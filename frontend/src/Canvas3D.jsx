import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

const MAX_TATTOOS = 8;

function getStableLimbBasis(normal, rotZDeg = 0) {
  const n = normal.clone().normalize();
  const limbAxis = new THREE.Vector3(0, 1, 0);
  let tangent = new THREE.Vector3().crossVectors(limbAxis, n);

  if (tangent.lengthSq() < 0.001) {
    tangent = new THREE.Vector3(1, 0, 0);
  } else {
    tangent.normalize();
  }

  const bitangent = new THREE.Vector3().crossVectors(n, tangent).normalize();

  if (rotZDeg !== 0) {
    const rotRad = THREE.MathUtils.degToRad(rotZDeg);
    tangent.applyAxisAngle(n, rotRad);
    bitangent.applyAxisAngle(n, rotRad);
  }

  return { normal: n, tangent, bitangent };
}

const StableTattooShader = {
  uniforms: {
    uBaseColor: { value: new THREE.Color('#d4d4d8') },
    uTattooMaps: { value: new Array(MAX_TATTOOS).fill(null) },
    uHasTattoo: { value: new Array(MAX_TATTOOS).fill(0.0) },
    uIsUVMode: { value: new Array(MAX_TATTOOS).fill(0.0) },

    // Projection uniforms
    uPositions: { value: Array.from({ length: MAX_TATTOOS }, () => new THREE.Vector3()) },
    uNormals: { value: Array.from({ length: MAX_TATTOOS }, () => new THREE.Vector3(0, 0, 1)) },
    uTangents: { value: Array.from({ length: MAX_TATTOOS }, () => new THREE.Vector3(1, 0, 0)) },
    uBitangents: { value: Array.from({ length: MAX_TATTOOS }, () => new THREE.Vector3(0, 1, 0)) },
    uScalesProj: { value: new Array(MAX_TATTOOS).fill(0.5) },

    // UV Multi-channel uniforms
    uCentersUV: { value: Array.from({ length: MAX_TATTOOS }, () => new THREE.Vector2()) },
    uScalesUV: { value: new Array(MAX_TATTOOS).fill(0.35) },
    uRotationsUV: { value: new Array(MAX_TATTOOS).fill(0.0) },
    uUVChannels: { value: new Array(MAX_TATTOOS).fill(0.0) },

    // Real-time hover preview (Only active in projection mode)
    uPreviewMap: { value: null },
    uHasPreview: { value: 0.0 },
    uPreviewPosition: { value: new THREE.Vector3() },
    uPreviewNormal: { value: new THREE.Vector3(0, 0, 1) },
    uPreviewTangent: { value: new THREE.Vector3(1, 0, 0) },
    uPreviewBitangent: { value: new THREE.Vector3(0, 1, 0) },
    uPreviewScaleProj: { value: 0.5 },

    // Dynamic studio lighting
    uLightDir: { value: new THREE.Vector3(1.0, 1.5, 1.0) }
  },
  vertexShader: `
    attribute vec2 uvSet0;
    attribute vec2 uvSet1;
    attribute vec2 uvSet2;
    attribute vec2 uvSet3;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv0;
    varying vec2 vUv1;
    varying vec2 vUv2;
    varying vec2 vUv3;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

      vUv0 = uvSet0;
      vUv1 = uvSet1;
      vUv2 = uvSet2;
      vUv3 = uvSet3;

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    #define MAX_TATTOOS 8

    uniform vec3 uBaseColor;
    uniform sampler2D uTattooMaps[MAX_TATTOOS];
    uniform float uHasTattoo[MAX_TATTOOS];
    uniform float uIsUVMode[MAX_TATTOOS];

    uniform vec3 uPositions[MAX_TATTOOS];
    uniform vec3 uNormals[MAX_TATTOOS];
    uniform vec3 uTangents[MAX_TATTOOS];
    uniform vec3 uBitangents[MAX_TATTOOS];
    uniform float uScalesProj[MAX_TATTOOS];

    uniform vec2 uCentersUV[MAX_TATTOOS];
    uniform float uScalesUV[MAX_TATTOOS];
    uniform float uRotationsUV[MAX_TATTOOS];
    uniform float uUVChannels[MAX_TATTOOS];

    uniform sampler2D uPreviewMap;
    uniform float uHasPreview;
    uniform vec3 uPreviewPosition;
    uniform vec3 uPreviewNormal;
    uniform vec3 uPreviewTangent;
    uniform vec3 uPreviewBitangent;
    uniform float uPreviewScaleProj;

    uniform vec3 uLightDir;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec2 vUv0;
    varying vec2 vUv1;
    varying vec2 vUv2;
    varying vec2 vUv3;

    vec2 calculateWrappedUV(vec3 worldPos, vec3 centerPos, vec3 n, vec3 t, vec3 b, float scale) {
      vec3 diff = worldPos - centerPos;
      float yDist = dot(diff, b);
      float tDist = dot(diff, t);
      float nDist = dot(diff, n);
      float arcLength = atan(tDist, max(0.01, scale * 0.45 + nDist)) * (scale * 0.45);
      float u = arcLength / scale + 0.5;
      float v = yDist / scale + 0.5;
      return vec2(u, v);
    }

    vec2 getActiveUV(float channel) {
      if (channel > 2.5) return vUv3;
      if (channel > 1.5) return vUv2;
      if (channel > 0.5) return vUv1;
      return vUv0;
    }

    vec2 transformUV(vec2 currentUV, vec2 centerUV, float scale, float rotDeg) {
      vec2 delta = currentUV - centerUV;
      float rad = radians(rotDeg);
      float c = cos(rad);
      float s = sin(rad);
      vec2 rotated = vec2(delta.x * c - delta.y * s, delta.x * s + delta.y * c);
      return (rotated / max(0.001, scale)) + vec2(0.5);
    }

    void main() {
      vec3 finalSkin = uBaseColor;

      for (int i = 0; i < MAX_TATTOOS; i++) {
        if (uHasTattoo[i] > 0.5) {
          vec2 uv = vec2(-1.0);
          float alphaFactor = 1.0;

          if (uIsUVMode[i] > 0.5) {
            vec2 activeUv = getActiveUV(uUVChannels[i]);
            uv = transformUV(activeUv, uCentersUV[i], uScalesUV[i], uRotationsUV[i]);
            alphaFactor = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x) *
                          smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);
          } else {
            float dotNorm = dot(vWorldNormal, uNormals[i]);
            if (dotNorm > -0.15) {
              uv = calculateWrappedUV(vWorldPosition, uPositions[i], uNormals[i], uTangents[i], uBitangents[i], uScalesProj[i]);
              float edgeFade = smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x) *
                               smoothstep(0.0, 0.06, uv.y) * smoothstep(1.0, 0.94, uv.y);
              alphaFactor = edgeFade * smoothstep(-0.2, 0.15, dotNorm);
            }
          }

          if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
            vec4 col = vec4(0.0);
            if (i == 0) col = texture2D(uTattooMaps[0], uv);
            else if (i == 1) col = texture2D(uTattooMaps[1], uv);
            else if (i == 2) col = texture2D(uTattooMaps[2], uv);
            else if (i == 3) col = texture2D(uTattooMaps[3], uv);
            else if (i == 4) col = texture2D(uTattooMaps[4], uv);
            else if (i == 5) col = texture2D(uTattooMaps[5], uv);
            else if (i == 6) col = texture2D(uTattooMaps[6], uv);
            else if (i == 7) col = texture2D(uTattooMaps[7], uv);

            finalSkin = mix(finalSkin, col.rgb, col.a * alphaFactor);
          }
        }
      }

      // Preview with soft opacity ONLY active when not in UV mode
      if (uHasPreview > 0.5) {
        float dotNormP = dot(vWorldNormal, uPreviewNormal);
        if (dotNormP > -0.15) {
          vec2 pUv = calculateWrappedUV(vWorldPosition, uPreviewPosition, uPreviewNormal, uPreviewTangent, uPreviewBitangent, uPreviewScaleProj);
          if (pUv.x >= 0.0 && pUv.x <= 1.0 && pUv.y >= 0.0 && pUv.y <= 1.0) {
            vec4 prevCol = texture2D(uPreviewMap, pUv);
            float edgeFadeP = smoothstep(0.0, 0.06, pUv.x) * smoothstep(1.0, 0.94, pUv.x) *
                              smoothstep(0.0, 0.06, pUv.y) * smoothstep(1.0, 0.94, pUv.y);
            float pAlpha = edgeFadeP * smoothstep(-0.2, 0.15, dotNormP);
            finalSkin = mix(finalSkin, prevCol.rgb, prevCol.a * 0.75 * pAlpha);
          }
        }
      }

      vec3 norm = normalize(vWorldNormal);
      vec3 light = normalize(uLightDir);
      float diff = max(dot(norm, light), 0.0);
      float fill = max(dot(norm, -light * vec3(1.0, 0.0, 1.0)), 0.0) * 0.25;
      float ambient = 0.42;

      float totalLighting = ambient + diff * 0.7 + fill;
      gl_FragColor = vec4(finalSkin * totalLighting, 1.0);
    }
  `
};

function BodyModel({
  modelPath,
  tattoos,
  tattooTransforms,
  selectedTattooId,
  isPlacingMode,
  isUVMode,
  activeUVZone,
  lightAngle,
  onPlaceTattoo,
  onUpdateTransform,
  onHoverPoint
}) {
  const { scene } = useGLTF(modelPath);
  const [textures, setTextures] = useState({});
  const [hoverData, setHoverData] = useState(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    tattoos.forEach((t) => {
      if (t.url && !textures[t.id]) {
        loader.load(t.url, (loaded) => {
          loaded.colorSpace = THREE.SRGBColorSpace;
          setTextures((prev) => ({ ...prev, [t.id]: loaded }));
        });
      }
    });
  }, [tattoos, textures]);

  const customMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(StableTattooShader.uniforms),
      vertexShader: StableTattooShader.vertexShader,
      fragmentShader: StableTattooShader.fragmentShader,
    });
  }, []);

  useEffect(() => {
    if (!customMaterial) return;
    const rad = ((lightAngle || 0) * Math.PI) / 180;
    const lx = Math.sin(rad) * 3.0;
    const lz = Math.cos(rad) * 3.0;
    customMaterial.uniforms.uLightDir.value.set(lx, 2.2, lz).normalize();
  }, [customMaterial, lightAngle]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const geom = child.geometry;
        const count = geom.attributes.position ? geom.attributes.position.count : 0;
        const dummyUV = new THREE.BufferAttribute(new Float32Array(count * 2), 2);

        const s0 = geom.attributes.uv || dummyUV;
        const s1 = geom.attributes.uv1 || geom.attributes.uv2 || s0;
        const s2 = geom.attributes.uv2 || geom.attributes.uv3 || geom.attributes._uv2 || s1;
        const s3 = geom.attributes.uv3 || geom.attributes.uv4 || geom.attributes._uv3 || s2;

        geom.setAttribute('uvSet0', s0);
        geom.setAttribute('uvSet1', s1);
        geom.setAttribute('uvSet2', s2);
        geom.setAttribute('uvSet3', s3);

        child.material = customMaterial;
      }
    });
  }, [scene, customMaterial]);

  useEffect(() => {
    if (!customMaterial) return;

    for (let i = 0; i < MAX_TATTOOS; i++) {
      const t = tattoos[i];
      const isPlaced = t && ((t.isUVMode && t.hitUV) || (!t.isUVMode && t.position));

      if (isPlaced && textures[t.id]) {
        const trans = tattooTransforms[t.id] || { scale: 35, rotZ: 0 };
        customMaterial.uniforms.uTattooMaps.value[i] = textures[t.id];
        customMaterial.uniforms.uHasTattoo.value[i] = 1.0;

        if (t.isUVMode && t.hitUV) {
          customMaterial.uniforms.uIsUVMode.value[i] = 1.0;
          customMaterial.uniforms.uCentersUV.value[i].set(t.hitUV.x, t.hitUV.y);
          customMaterial.uniforms.uScalesUV.value[i] = (trans.scale / 100) * 0.19;

          const zoneOffset = t.zoneOffset ?? 0.0;
          customMaterial.uniforms.uRotationsUV.value[i] = (trans.rotZ || 0.0) + zoneOffset;
          customMaterial.uniforms.uUVChannels.value[i] = t.uvChannel ?? 0.0;
        } else if (t.position && t.normal) {
          customMaterial.uniforms.uIsUVMode.value[i] = 0.0;
          const normalVec = new THREE.Vector3(...t.normal).normalize();
          const basis = getStableLimbBasis(normalVec, trans.rotZ || 0);

          customMaterial.uniforms.uPositions.value[i].set(...t.position);
          customMaterial.uniforms.uNormals.value[i].copy(basis.normal);
          customMaterial.uniforms.uTangents.value[i].copy(basis.tangent);
          customMaterial.uniforms.uBitangents.value[i].copy(basis.bitangent);
          customMaterial.uniforms.uScalesProj.value[i] = (trans.scale / 100) * 2;
        }
      } else {
        customMaterial.uniforms.uHasTattoo.value[i] = 0.0;
      }
    }
  }, [customMaterial, tattoos, tattooTransforms, textures]);

  // Preview management: Show shader preview ONLY in standard mode, never in UV mode
  useEffect(() => {
    if (!customMaterial) return;

    if (isPlacingMode && !isUVMode && hoverData && selectedTattooId && textures[selectedTattooId]) {
      const trans = tattooTransforms[selectedTattooId] || { scale: 35, rotZ: 0 };
      const basis = getStableLimbBasis(hoverData.normal, trans.rotZ || 0);

      customMaterial.uniforms.uPreviewMap.value = textures[selectedTattooId];
      customMaterial.uniforms.uHasPreview.value = 1.0;
      customMaterial.uniforms.uPreviewPosition.value.copy(hoverData.point);
      customMaterial.uniforms.uPreviewNormal.value.copy(basis.normal);
      customMaterial.uniforms.uPreviewTangent.value.copy(basis.tangent);
      customMaterial.uniforms.uPreviewBitangent.value.copy(basis.bitangent);
      customMaterial.uniforms.uPreviewScaleProj.value = (trans.scale / 100) * 2;
    } else {
      customMaterial.uniforms.uHasPreview.value = 0.0;
    }
  }, [customMaterial, isPlacingMode, isUVMode, hoverData, selectedTattooId, tattooTransforms, textures]);

  const dragStartRef = useRef(null);

  useEffect(() => {
    if (!isPlacingMode) return;

    const handleGlobalPointerDown = (e) => {
      if (e.button === 1 || ((e.ctrlKey || e.shiftKey) && e.button === 2)) {
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          initScale: (tattooTransforms[selectedTattooId]?.scale ?? 35),
          initRot: (tattooTransforms[selectedTattooId]?.rotZ ?? 0)
        };
        e.preventDefault();
      }
    };

    const handleGlobalPointerMove = (e) => {
      if (!dragStartRef.current || !selectedTattooId || !onUpdateTransform) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = dragStartRef.current.y - e.clientY;

      if (dragStartRef.current.ctrl) {
        const newScale = Math.max(10, Math.min(250, Math.round(dragStartRef.current.initScale + deltaY * 0.8)));
        onUpdateTransform('scale', newScale);
      } else if (dragStartRef.current.shift) {
        let newRot = Math.round((dragStartRef.current.initRot + deltaX * 1.2) % 360);
        if (newRot < 0) newRot += 360;
        onUpdateTransform('rotZ', newRot);
      }
    };

    const handleGlobalPointerUp = (e) => {
      if (dragStartRef.current && (e.button === 1 || e.button === 2)) {
        dragStartRef.current = null;
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isPlacingMode, selectedTattooId, tattooTransforms, onUpdateTransform]);

  const handlePointerMove = (e) => {
    if (!isPlacingMode) return;
    e.stopPropagation();

    const hitPoint = e.point.clone();
    const hitNormal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 0, 1);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
    const worldNormal = hitNormal.applyMatrix3(normalMatrix).normalize();

    const data = { point: hitPoint, normal: worldNormal };
    setHoverData(data);
    if (onHoverPoint) onHoverPoint(data);
  };

  const handlePointerLeave = () => {
    setHoverData(null);
    if (onHoverPoint) onHoverPoint(null);
  };

  const handlePointerDown = (e) => {
    if (!isPlacingMode || e.button !== 0 || !onPlaceTattoo) return;
    e.stopPropagation();

    const hitPoint = e.point.clone();
    const hitNormal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 0, 1);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
    const worldNormal = hitNormal.applyMatrix3(normalMatrix).normalize();

    let finalUV = new THREE.Vector2();
    let channel = activeUVZone;
    const geom = e.object.geometry;

    let attr = null;
    if (channel === 0) attr = geom.attributes.uvSet0;
    else if (channel === 1) attr = geom.attributes.uvSet1;
    else if (channel === 2) attr = geom.attributes.uvSet2;
    else if (channel === 3) attr = geom.attributes.uvSet3;

    if (attr && e.face) {
      const uvA = new THREE.Vector2(attr.getX(e.face.a), attr.getY(e.face.a));
      const uvB = new THREE.Vector2(attr.getX(e.face.b), attr.getY(e.face.b));
      const uvC = new THREE.Vector2(attr.getX(e.face.c), attr.getY(e.face.c));

      const posA = new THREE.Vector3().fromBufferAttribute(geom.attributes.position, e.face.a);
      const posB = new THREE.Vector3().fromBufferAttribute(geom.attributes.position, e.face.b);
      const posC = new THREE.Vector3().fromBufferAttribute(geom.attributes.position, e.face.c);

      const invMat = e.object.matrixWorld.clone().invert();
      const localHit = hitPoint.clone().applyMatrix4(invMat);

      const v0 = posB.clone().sub(posA);
      const v1 = posC.clone().sub(posA);
      const v2 = localHit.clone().sub(posA);

      const d00 = v0.dot(v0);
      const d01 = v0.dot(v1);
      const d11 = v1.dot(v1);
      const d20 = v2.dot(v0);
      const d21 = v2.dot(v1);

      const denom = d00 * d11 - d01 * d01;
      if (Math.abs(denom) > 1e-6) {
        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1.0 - v - w;

        finalUV.x = u * uvA.x + v * uvB.x + w * uvC.x;
        finalUV.y = u * uvA.y + v * uvB.y + w * uvC.y;
      } else {
        finalUV.copy(uvA);
      }
    }

    onPlaceTattoo(hitPoint, worldNormal, finalUV, channel, isUVMode);
  };

  return (
    <primitive
      object={scene}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerLeave}
      onPointerDown={handlePointerDown}
    />
  );
}

// Indicator guide ring for UV placement mode
function SurfaceTargetGuide({ hoverData }) {
  if (!hoverData) return null;
  const { point, normal } = hoverData;
  const offsetPoint = point.clone().add(normal.clone().multiplyScalar(0.015));

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal
  );

  return (
    <group position={offsetPoint} quaternion={quaternion}>
      <mesh>
        <ringGeometry args={[0.035, 0.046, 32]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Canvas3D({
  modelPath,
  tattoos,
  tattooTransforms,
  selectedTattooId,
  isPlacingMode,
  isUVMode,
  activeUVZone,
  lightAngle = 45,
  onPlaceTattoo,
  onUpdateTransform
}) {
  const [hoverData, setHoverData] = useState(null);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      cursor: isPlacingMode ? 'crosshair' : 'default'
    }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Center>
            <BodyModel
              modelPath={modelPath}
              tattoos={tattoos}
              tattooTransforms={tattooTransforms}
              selectedTattooId={selectedTattooId}
              isPlacingMode={isPlacingMode}
              isUVMode={isUVMode}
              activeUVZone={activeUVZone}
              lightAngle={lightAngle}
              onPlaceTattoo={onPlaceTattoo}
              onUpdateTransform={onUpdateTransform}
              onHoverPoint={setHoverData}
            />
            {/* Show target ring guide ONLY when in UV placement mode */}
            {isPlacingMode && isUVMode && <SurfaceTargetGuide hoverData={hoverData} />}
          </Center>
        </Suspense>

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enabled={!isPlacingMode} />
      </Canvas>
    </div>
  );
}
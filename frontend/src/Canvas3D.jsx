import React, { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

const MAX_TATTOOS = 4;

// شیدر پروجکشن چندگانه با پشتیبانی از اسلات شابلون زنده (Ghost Preview)
const MultiTattooShader = {
  uniforms: {
    uBaseColor: { value: new THREE.Color('#d4d4d8') },
    uTattooMaps: { value: [null, null, null, null] },
    uHasTattoo: { value: [0.0, 0.0, 0.0, 0.0] },
    uPositions: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uNormals: { value: [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1)] },
    uTangents: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0)] },
    uBitangents: { value: [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 0)] },
    uScales: { value: [0.5, 0.5, 0.5, 0.5] },

    // اسلات پیش‌نمایش ماوس
    uPreviewMap: { value: null },
    uHasPreview: { value: 0.0 },
    uPreviewPosition: { value: new THREE.Vector3() },
    uPreviewNormal: { value: new THREE.Vector3(0, 0, 1) },
    uPreviewTangent: { value: new THREE.Vector3(1, 0, 0) },
    uPreviewBitangent: { value: new THREE.Vector3(0, 1, 0) },
    uPreviewScale: { value: 0.5 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform sampler2D uTattooMaps[4];
    uniform float uHasTattoo[4];
    uniform vec3 uPositions[4];
    uniform vec3 uNormals[4];
    uniform vec3 uTangents[4];
    uniform vec3 uBitangents[4];
    uniform float uScales[4];

    uniform sampler2D uPreviewMap;
    uniform float uHasPreview;
    uniform vec3 uPreviewPosition;
    uniform vec3 uPreviewNormal;
    uniform vec3 uPreviewTangent;
    uniform vec3 uPreviewBitangent;
    uniform float uPreviewScale;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    void main() {
      vec3 finalSkin = uBaseColor;

      // ۱. رندر تتوهای ثبت‌شده روی پوست
      for (int i = 0; i < 4; i++) {
        if (uHasTattoo[i] > 0.5) {
          vec3 diff = vWorldPosition - uPositions[i];
          float dotNorm = dot(vWorldNormal, uNormals[i]);

          float x = dot(diff, uTangents[i]) / uScales[i] + 0.5;
          float y = dot(diff, uBitangents[i]) / uScales[i] + 0.5;

          if (x >= 0.0 && x <= 1.0 && y >= 0.0 && y <= 1.0 && dotNorm > 0.05) {
            vec4 col = vec4(0.0);
            if (i == 0) col = texture2D(uTattooMaps[0], vec2(x, y));
            else if (i == 1) col = texture2D(uTattooMaps[1], vec2(x, y));
            else if (i == 2) col = texture2D(uTattooMaps[2], vec2(x, y));
            else if (i == 3) col = texture2D(uTattooMaps[3], vec2(x, y));

            finalSkin = mix(finalSkin, col.rgb, col.a);
          }
        }
      }

      // ۲. رندر شابلون زنده پیش‌نمایش (با شفافیت ۳۵ درصد)
      if (uHasPreview > 0.5) {
        vec3 diffP = vWorldPosition - uPreviewPosition;
        float dotNormP = dot(vWorldNormal, uPreviewNormal);

        float px = dot(diffP, uPreviewTangent) / uPreviewScale + 0.5;
        float py = dot(diffP, uPreviewBitangent) / uPreviewScale + 0.5;

        if (px >= 0.0 && px <= 1.0 && py >= 0.0 && py <= 1.0 && dotNormP > 0.05) {
          vec4 prevCol = texture2D(uPreviewMap, vec2(px, py));
          finalSkin = mix(finalSkin, prevCol.rgb, prevCol.a * 0.7);
        }
      }

      vec3 lightDir = normalize(vec3(1.0, 1.5, 1.0));
      float diffLight = max(dot(vWorldNormal, lightDir), 0.35);
      gl_FragColor = vec4(finalSkin * diffLight, 1.0);
    }
  `
};

function BodyModel({
  modelPath,
  tattoos,
  tattooTransforms,
  selectedTattooId,
  isPlacingMode,
  onPlaceTattoo,
  onUpdateTransform
}) {
  const { scene } = useGLTF(modelPath);
  const [textures, setTextures] = useState({});

  // استیت موقت شابلون متحرک ماوس
  const [hoverData, setHoverData] = useState(null);

  // لود تکسچرها
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
      uniforms: THREE.UniformsUtils.clone(MultiTattooShader.uniforms),
      vertexShader: MultiTattooShader.vertexShader,
      fragmentShader: MultiTattooShader.fragmentShader,
    });
  }, []);

  // همگام‌سازی تتوهای ثبت‌شده با شیدر
  useEffect(() => {
    if (!customMaterial) return;

    for (let i = 0; i < MAX_TATTOOS; i++) {
      const t = tattoos[i];
      if (t && t.position && t.normal && textures[t.id]) {
        const trans = tattooTransforms[t.id] || { scale: 60, rotZ: 0 };
        const normal = new THREE.Vector3(...t.normal).normalize();
        const rotZ = THREE.MathUtils.degToRad(trans.rotZ || 0);

        const up = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        const tangent = new THREE.Vector3().crossVectors(up, normal).normalize();
        const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

        tangent.applyAxisAngle(normal, rotZ);
        bitangent.applyAxisAngle(normal, rotZ);

        customMaterial.uniforms.uTattooMaps.value[i] = textures[t.id];
        customMaterial.uniforms.uHasTattoo.value[i] = 1.0;
        customMaterial.uniforms.uPositions.value[i].set(...t.position);
        customMaterial.uniforms.uNormals.value[i].copy(normal);
        customMaterial.uniforms.uTangents.value[i].copy(tangent);
        customMaterial.uniforms.uBitangents.value[i].copy(bitangent);
        customMaterial.uniforms.uScales.value[i] = (trans.scale / 100) * 1.6;
      } else {
        customMaterial.uniforms.uHasTattoo.value[i] = 0.0;
      }
    }
  }, [customMaterial, tattoos, tattooTransforms, textures]);

  // همگام‌سازی شابلون پیش‌نمایش زنده با شیدر
  useEffect(() => {
    if (!customMaterial) return;

    if (isPlacingMode && hoverData && selectedTattooId && textures[selectedTattooId]) {
      const trans = tattooTransforms[selectedTattooId] || { scale: 35, rotZ: 0 };
      const normal = hoverData.normal.clone().normalize();
      const rotZ = THREE.MathUtils.degToRad(trans.rotZ || 0);

      const up = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
      const tangent = new THREE.Vector3().crossVectors(up, normal).normalize();
      const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

      tangent.applyAxisAngle(normal, rotZ);
      bitangent.applyAxisAngle(normal, rotZ);

      customMaterial.uniforms.uPreviewMap.value = textures[selectedTattooId];
      customMaterial.uniforms.uHasPreview.value = 1.0;
      customMaterial.uniforms.uPreviewPosition.value.copy(hoverData.point);
      customMaterial.uniforms.uPreviewNormal.value.copy(normal);
      customMaterial.uniforms.uPreviewTangent.value.copy(tangent);
      customMaterial.uniforms.uPreviewBitangent.value.copy(bitangent);
      customMaterial.uniforms.uPreviewScale.value = (trans.scale / 100) * 1.6;
    } else {
      customMaterial.uniforms.uHasPreview.value = 0.0;
    }
  }, [customMaterial, isPlacingMode, hoverData, selectedTattooId, tattooTransforms, textures]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = customMaterial;
      }
    });
  }, [scene, customMaterial]);

  // شورت‌کات‌های درگ اسکرول (Middle Click Drag + Ctrl / Shift)
  const dragStartRef = useRef(null);

  useEffect(() => {
    const handleGlobalPointerDown = (e) => {
      // کلیک اسکرول (button === 1) یا راست‌کلیک کمکی با Ctrl/Shift
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
        // Ctrl + درگ اسکرول = تغییر مقیاس (Scale)
        const newScale = Math.max(10, Math.min(250, Math.round(dragStartRef.current.initScale + deltaY * 0.8)));
        onUpdateTransform('scale', newScale);
      } else if (dragStartRef.current.shift) {
        // Shift + درگ اسکرول = چرخش (Rotation Z)
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
  }, [selectedTattooId, tattooTransforms, onUpdateTransform]);

  // تعقیب ماوس روی پوست برای شابلون
  const handlePointerMove = (e) => {
    if (!isPlacingMode) return;
    e.stopPropagation();

    const hitPoint = e.point.clone();
    const hitNormal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 0, 1);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
    const worldNormal = hitNormal.applyMatrix3(normalMatrix).normalize();

    setHoverData({ point: hitPoint, normal: worldNormal });
  };

  const handlePointerLeave = () => {
    setHoverData(null);
  };

  // ثبت تتو با کلیک چپ
  const handlePointerDown = (e) => {
    if (!isPlacingMode || e.button !== 0 || !onPlaceTattoo) return;
    e.stopPropagation();

    const hitPoint = e.point.clone();
    const hitNormal = e.face ? e.face.normal.clone() : new THREE.Vector3(0, 0, 1);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
    const worldNormal = hitNormal.applyMatrix3(normalMatrix).normalize();

    onPlaceTattoo(
      [hitPoint.x, hitPoint.y, hitPoint.z],
      [worldNormal.x, worldNormal.y, worldNormal.z]
    );
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

export default function Canvas3D({
  modelPath,
  tattoos,
  tattooTransforms,
  selectedTattooId,
  isPlacingMode,
  onPlaceTattoo,
  onUpdateTransform
}) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <directionalLight position={[-5, 5, -5]} intensity={0.8} />

        <Suspense fallback={null}>
          <Center>
            <BodyModel
              modelPath={modelPath}
              tattoos={tattoos}
              tattooTransforms={tattooTransforms}
              selectedTattooId={selectedTattooId}
              isPlacingMode={isPlacingMode}
              onPlaceTattoo={onPlaceTattoo}
              onUpdateTransform={onUpdateTransform}
            />
          </Center>
        </Suspense>

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enabled={!isPlacingMode} />
      </Canvas>
    </div>
  );
}
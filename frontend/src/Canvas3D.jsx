import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

const MAX_TATTOOS = 4;

// شیدر چندگانه اختصاصی پروجکشن بر پایه مختصات ۳بعدی
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

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    void main() {
      vec3 finalSkin = uBaseColor;

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

      vec3 lightDir = normalize(vec3(1.0, 1.5, 1.0));
      float diffLight = max(dot(vWorldNormal, lightDir), 0.35);
      gl_FragColor = vec4(finalSkin * diffLight, 1.0);
    }
  `
};

function BodyModel({ modelPath, tattoos, tattooTransforms, isPlacingMode, onPlaceTattoo }) {
  const { scene } = useGLTF(modelPath);
  const [textures, setTextures] = useState({});

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
  }, [tattoos]);

  const customMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(MultiTattooShader.uniforms),
      vertexShader: MultiTattooShader.vertexShader,
      fragmentShader: MultiTattooShader.fragmentShader,
    });
  }, []);

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
        // ضریب مقیاس به 1.6 افزایش یافت تا در مقیاس‌های بالا پوشش کامل بدهد
        customMaterial.uniforms.uScales.value[i] = (trans.scale / 100) * 1.6;
      } else {
        customMaterial.uniforms.uHasTattoo.value[i] = 0.0;
      }
    }
  }, [customMaterial, tattoos, tattooTransforms, textures]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = customMaterial;
      }
    });
  }, [scene, customMaterial]);

  const handlePointerDown = (e) => {
    if (!isPlacingMode || !onPlaceTattoo) return;
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

  return <primitive object={scene} onPointerDown={handlePointerDown} />;
}

export default function Canvas3D({ modelPath, tattoos, tattooTransforms, isPlacingMode, onPlaceTattoo }) {
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
              isPlacingMode={isPlacingMode}
              onPlaceTattoo={onPlaceTattoo}
            />
          </Center>
        </Suspense>

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} enabled={!isPlacingMode} />
      </Canvas>
    </div>
  );
}
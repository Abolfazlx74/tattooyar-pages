import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center } from '@react-three/drei';

function Model({ modelPath }) {
  const { scene } = useGLTF(modelPath);

  // اعمال متریال سفید مات و تمیز به تمام مش‌های مدل
  scene.traverse((child) => {
    if (child.isMesh) {
      child.material.color.set('#f0f0f0');
      child.material.roughness = 0.5;
      child.material.metalness = 0.1;
    }
  });

  return (
    <primitive object={scene} />
  );
}

export default function Canvas3D({ modelPath }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <directionalLight position={[-5, -5, -5]} intensity={0.4} />

        <Suspense fallback={null}>
          <Center>
            <Model modelPath={modelPath} />
          </Center>
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.05} />
      </Canvas>
    </div>
  );
}
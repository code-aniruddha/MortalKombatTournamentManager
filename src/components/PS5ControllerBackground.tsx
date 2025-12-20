import { useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Floating Particles Component
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 100;

  const particles = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Mix of Soul green, Blood red, and Gold
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 0.25; // Soul green
      } else if (colorChoice < 0.8) {
        colors[i * 3] = 0.55; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0; // Blood red
      } else {
        colors[i * 3] = 0.77; colors[i * 3 + 1] = 0.62; colors[i * 3 + 2] = 0.35; // Gold
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x += 0.00005;
      particlesRef.current.rotation.y += 0.00008;

      const positions = particles.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.001;
      }
      particles.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef} geometry={particles}>
      <pointsMaterial
        size={0.1}
        color="#00FF41"
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// GLTF Model loader component with glass morph and subtle glow
function PS5Controller() {
  const controllerRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/ps5-controller.glb');

  useEffect(() => {
    // Clone the scene to avoid shared material issues
    const clonedScene = scene.clone();

    // Apply glass morph effect and subtle glow to all materials
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        // Clone the material to avoid modifying shared materials
        child.material = child.material.clone();

        // Glass Morph Effect - semi-transparent frosted appearance
        child.material.transparent = true;
        child.material.opacity = 1;

        // Keep original emissive (no green tint)
        child.material.emissiveIntensity = 0;

        // Glass-like material properties
        child.material.metalness = 0.7;
        child.material.roughness = 0.26;

        // Ensure the material renders
        child.material.depthWrite = true;
        child.material.depthTest = true;

        // Enable shadow mapping for better lighting
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Add cloned scene to ref group
    if (controllerRef.current) {
      controllerRef.current.clear();
      controllerRef.current.add(clonedScene);

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(clonedScene);
      const center = box.getCenter(new THREE.Vector3());
      clonedScene.position.sub(center);

      // Scale to appropriate size
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim;
      clonedScene.scale.multiplyScalar(scale);
    }
  }, [scene]);

  useFrame((state) => {
    if (controllerRef.current) {
      // Floating animation
      controllerRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      // Slow rotation
      controllerRef.current.rotation.y += 0.003;
    }
  });

  return <group ref={controllerRef} />;
}

export default function PS5ControllerBackground() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: 'radial-gradient(circle at center, #1A1A1A 0%, #0D0D0D 100%)'
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        performance={{ min: 0.5, max: 1 }}
      >
        <PerspectiveCamera makeDefault position={[0.1, 0.9, 9]} fov={50} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Optimized Lighting Setup - Better visibility */}
        {/* Main ambient light for overall visibility */}
        <ambientLight intensity={0.85} color="#ffffff" />

        {/* Front light - white for accurate colors */}
        <pointLight
          position={[4, 2, 4]}
          intensity={1.2}
          color="#ffffff"
          distance={25}
          decay={2}
        />

        {/* Blood Red accent - subtle */}
        <pointLight
          position={[-4, 2, 3]}
          intensity={0.5}
          color="#8B0000"
          distance={20}
          decay={2}
        />

        {/* Gold accent from below */}
        <pointLight
          position={[0, -1.5, 2]}
          intensity={0.5}
          color="#C5A059"
          distance={15}
          decay={2}
        />

        {/* Front rim light - white */}
        <pointLight
          position={[0, 1, -5]}
          intensity={0.8}
          color="#ffffff"
          distance={20}
          decay={2}
        />

        {/* Soft directional light from top */}
        <directionalLight
          position={[0, 4, 2]}
          intensity={0.6}
          color="#ffffff"
          castShadow
        />

        {/* Background particles */}
        <FloatingParticles />

        <Suspense fallback={null}>
          <PS5Controller />
        </Suspense>
      </Canvas>
    </div>
  );
}

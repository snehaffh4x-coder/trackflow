"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Environment, 
  Float, 
  MeshTransmissionMaterial,
  Sphere,
  Box,
  Stars
} from "@react-three/drei";
import * as THREE from "three";

function PackageModel() {
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (innerRef.current) {
      innerRef.current.rotation.x = time * 0.5;
      innerRef.current.rotation.y = time * 0.8;
      // Pulse scale slightly
      const scale = 0.8 + Math.sin(time * 2) * 0.05;
      innerRef.current.scale.set(scale, scale, scale);
    }
    
    if (outerRef.current) {
      outerRef.current.rotation.x = time * 0.2;
      outerRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <Float
      speed={2} 
      rotationIntensity={1} 
      floatIntensity={2} 
    >
      {/* Outer Glass Box representing the Package */}
      <Box ref={outerRef} args={[2.5, 2.5, 2.5]}>
        <meshStandardMaterial 
          color="#3b82f6" 
          transparent
          opacity={0.2}
          wireframe
        />
      </Box>

      {/* Inner Glowing Core representing the Data/Item */}
      <Sphere ref={innerRef} args={[1, 32, 32]}>
        <meshStandardMaterial 
          color="#a855f7" 
          emissive="#a855f7"
          emissiveIntensity={4}
          toneMapped={false}
        />
      </Sphere>
    </Float>
  );
}

export function ThreeDPackage() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40 md:opacity-60 mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        
        {/* We place it to the right side on desktop, center on mobile */}
        <group position={[0, 1, -2]}>
          <PackageModel />
        </group>
      </Canvas>
    </div>
  );
}

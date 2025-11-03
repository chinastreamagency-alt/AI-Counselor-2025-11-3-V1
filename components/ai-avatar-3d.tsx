"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sphere } from "@react-three/drei"
import type * as THREE from "three"

type AvatarProps = {
  status: "idle" | "listening" | "processing" | "speaking"
}

function BeautifulAvatar({ status }: AvatarProps) {
  const headRef = useRef<THREE.Group>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)
  const mouthRef = useRef<THREE.Mesh>(null)
  const leftEyebrowRef = useRef<THREE.Mesh>(null)
  const rightEyebrowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!headRef.current) return

    const time = state.clock.elapsedTime

    if (status === "listening") {
      headRef.current.rotation.y = Math.sin(time * 1.5) * 0.08
      headRef.current.rotation.x = Math.sin(time) * 0.03
      // Eyebrows slightly raised when listening
      if (leftEyebrowRef.current) leftEyebrowRef.current.position.y = 0.45 + Math.sin(time * 2) * 0.02
      if (rightEyebrowRef.current) rightEyebrowRef.current.position.y = 0.45 + Math.sin(time * 2) * 0.02
    } else if (status === "speaking") {
      headRef.current.rotation.y = Math.sin(time * 2) * 0.1
      // Animate mouth for speaking
      if (mouthRef.current) {
        const mouthOpen = Math.abs(Math.sin(time * 6)) * 0.4
        mouthRef.current.scale.y = 1 + mouthOpen
        mouthRef.current.scale.x = 1 - mouthOpen * 0.2
      }
    } else if (status === "processing") {
      headRef.current.rotation.y = Math.sin(time * 0.8) * 0.05
    } else {
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.03
    }

    // Eye blinking animation
    const blinkTime = Math.sin(time * 2.5)
    if (blinkTime > 0.96) {
      if (leftEyeRef.current) leftEyeRef.current.scale.y = 0.15
      if (rightEyeRef.current) rightEyeRef.current.scale.y = 0.15
    } else {
      if (leftEyeRef.current) leftEyeRef.current.scale.y = 1
      if (rightEyeRef.current) rightEyeRef.current.scale.y = 1
    }
  })

  return (
    <group ref={headRef}>
      <Sphere args={[1, 64, 64]} scale={[1.1, 1.3, 1]}>
        <meshStandardMaterial
          color="#ffd7c4"
          roughness={0.4}
          metalness={0.05}
          emissive="#ffe4d6"
          emissiveIntensity={0.15}
        />
      </Sphere>

      <group position={[0, 0.4, 0]}>
        {/* Main hair volume */}
        <Sphere args={[1.15, 32, 32]} scale={[1.2, 1.1, 1.15]} position={[0, 0.2, -0.1]}>
          <meshStandardMaterial
            color="#f4d03f"
            roughness={0.6}
            metalness={0.3}
            emissive="#ffd700"
            emissiveIntensity={0.1}
          />
        </Sphere>
        {/* Hair highlights */}
        <Sphere args={[1.1, 32, 32]} scale={[1.15, 1.05, 1.1]} position={[0, 0.25, -0.05]}>
          <meshStandardMaterial color="#ffe066" transparent opacity={0.6} roughness={0.5} metalness={0.4} />
        </Sphere>
      </group>

      {/* Left Eye - white part */}
      <Sphere args={[0.15, 32, 32]} position={[-0.32, 0.25, 0.85]}>
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </Sphere>
      {/* Left Eye - blue iris */}
      <Sphere ref={leftEyeRef} args={[0.11, 32, 32]} position={[-0.32, 0.25, 0.92]}>
        <meshStandardMaterial
          color="#4a90e2"
          roughness={0.1}
          metalness={0.8}
          emissive="#6bb6ff"
          emissiveIntensity={0.3}
        />
      </Sphere>
      {/* Left Eye - pupil */}
      <Sphere args={[0.06, 16, 16]} position={[-0.32, 0.25, 0.97]}>
        <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.9} />
      </Sphere>
      {/* Left Eye - sparkle */}
      <Sphere args={[0.03, 16, 16]} position={[-0.3, 0.28, 1.0]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </Sphere>

      {/* Right Eye - white part */}
      <Sphere args={[0.15, 32, 32]} position={[0.32, 0.25, 0.85]}>
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </Sphere>
      {/* Right Eye - blue iris */}
      <Sphere ref={rightEyeRef} args={[0.11, 32, 32]} position={[0.32, 0.25, 0.92]}>
        <meshStandardMaterial
          color="#4a90e2"
          roughness={0.1}
          metalness={0.8}
          emissive="#6bb6ff"
          emissiveIntensity={0.3}
        />
      </Sphere>
      {/* Right Eye - pupil */}
      <Sphere args={[0.06, 16, 16]} position={[0.32, 0.25, 0.97]}>
        <meshStandardMaterial color="#1a1a2e" roughness={0.1} metalness={0.9} />
      </Sphere>
      {/* Right Eye - sparkle */}
      <Sphere args={[0.03, 16, 16]} position={[0.34, 0.28, 1.0]}>
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
      </Sphere>

      <mesh ref={leftEyebrowRef} position={[-0.32, 0.45, 0.88]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.03, 0.25, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9a961" roughness={0.7} />
      </mesh>
      <mesh ref={rightEyebrowRef} position={[0.32, 0.45, 0.88]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.03, 0.25, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9a961" roughness={0.7} />
      </mesh>

      <Sphere args={[0.07, 16, 16]} scale={[1, 1.1, 0.7]} position={[0, 0.05, 0.95]}>
        <meshStandardMaterial color="#ffcdb2" roughness={0.5} metalness={0.05} />
      </Sphere>

      <mesh ref={mouthRef} position={[0, -0.25, 0.9]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.12, 0.35, 16, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#ff9999"
          roughness={0.4}
          metalness={0.1}
          emissive="#ffb3ba"
          emissiveIntensity={0.2}
        />
      </mesh>

      <Sphere args={[0.15, 16, 16]} position={[-0.5, -0.05, 0.75]} scale={[1, 0.8, 0.6]}>
        <meshStandardMaterial color="#ffb3ba" transparent opacity={0.4} roughness={0.8} />
      </Sphere>
      <Sphere args={[0.15, 16, 16]} position={[0.5, -0.05, 0.75]} scale={[1, 0.8, 0.6]}>
        <meshStandardMaterial color="#ffb3ba" transparent opacity={0.4} roughness={0.8} />
      </Sphere>

      <Sphere args={[1.7, 32, 32]} scale={[1.1, 1.3, 1]}>
        <meshBasicMaterial color="#fff5e6" transparent opacity={0.08} depthWrite={false} />
      </Sphere>
    </group>
  )
}

export default function AIAvatar3D({ status }: AvatarProps) {
  return (
    <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl bg-gradient-to-br from-amber-50 via-pink-50 to-blue-50">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 5]} intensity={1.5} color="#fff5e6" />
        <pointLight position={[-3, 2, 3]} intensity={0.8} color="#ffd7c4" />
        <pointLight position={[0, -2, 3]} intensity={0.5} color="#ffe4d6" />
        <spotLight position={[0, 5, 3]} intensity={0.8} angle={0.4} penumbra={1} color="#ffffff" />
        <BeautifulAvatar status={status} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 2.2}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  )
}

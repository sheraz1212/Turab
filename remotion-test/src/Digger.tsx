import {interpolate, Easing} from 'remotion';
import * as THREE from 'three';

const cloth = new THREE.MeshStandardMaterial({color: '#1c1d1f', roughness: 0.95});
const skin = new THREE.MeshStandardMaterial({color: '#9a6a48', roughness: 0.7});
const straw = new THREE.MeshStandardMaterial({color: '#c4a464', roughness: 0.9});
const wood = new THREE.MeshStandardMaterial({color: '#6b4a2c', roughness: 0.8});
const steel = new THREE.MeshStandardMaterial({color: '#7a7a76', roughness: 0.45, metalness: 0.7});

/** Low-poly digger with conical hat. `phase` 0..1 = one shovel stroke. */
export const Digger: React.FC<{phase: number; position: [number, number, number]; rotY: number}> = ({phase, position, rotY}) => {
  const e = {easing: Easing.inOut(Easing.sin), extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
  const k = [0, 0.35, 0.55, 0.75, 1];
  const bend = interpolate(phase, k, [0.15, 0.75, 0.55, -0.05, 0.15], e); // torso forward lean
  const twist = interpolate(phase, k, [0, 0, 0.1, 0.9, 0], e); // turn to throw onto the pile
  const arm = interpolate(phase, k, [0.35, 1.0, 0.75, -0.9, 0.35], e); // shoulder pitch
  const knee = interpolate(phase, k, [0.1, 0.45, 0.35, 0.05, 0.1], e);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* legs */}
      {[-0.07, 0.07].map((x) => (
        <group key={x} position={[x, 0.42, 0]}>
          <mesh material={cloth} position={[0, -0.11, 0.0]} rotation={[-knee, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.045, 0.24, 7]} />
          </mesh>
          <mesh material={cloth} position={[0, -0.31, 0.05 * knee]} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.22, 7]} />
          </mesh>
          <mesh material={skin} position={[0, -0.415, 0.05 + 0.05 * knee]} castShadow>
            <boxGeometry args={[0.07, 0.035, 0.13]} />
          </mesh>
        </group>
      ))}
      {/* upper body pivots at the hips */}
      <group position={[0, 0.42 - knee * 0.06, 0]} rotation={[bend, twist, 0]}>
        <mesh material={cloth} position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.115, 0.095, 0.4, 8]} />
        </mesh>
        <mesh material={skin} position={[0, 0.47, 0.01]} castShadow>
          <sphereGeometry args={[0.075, 12, 10]} />
        </mesh>
        <mesh material={straw} position={[0, 0.55, 0.01]} castShadow>
          <coneGeometry args={[0.2, 0.12, 16]} />
        </mesh>
        {/* arms + shovel, pivot at shoulders */}
        <group position={[0, 0.36, 0.02]} rotation={[arm, 0, 0]}>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} material={cloth} position={[x * 0.85, 0, 0.15]} rotation={[Math.PI / 2, 0, -x * 1.2]} castShadow>
              <cylinderGeometry args={[0.035, 0.03, 0.32, 6]} />
            </mesh>
          ))}
          <mesh material={skin} position={[0, 0, 0.3]} castShadow>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
          <group position={[0, 0, 0.3]} rotation={[-0.25, 0, 0]}>
            <mesh material={wood} position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.017, 0.017, 0.75, 6]} />
            </mesh>
            <mesh material={steel} position={[0, 0, 0.55]} castShadow>
              <boxGeometry args={[0.15, 0.012, 0.2]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

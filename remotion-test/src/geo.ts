import * as THREE from 'three';

/**
 * Builds a subdivided plane, places it with a matrix, then lets callers displace each
 * vertex along the plane normal (in world space) and assign UVs from world coords.
 */
export const makePlane = (
  w: number,
  h: number,
  sx: number,
  sy: number,
  matrix: THREE.Matrix4,
  disp: (p: THREE.Vector3, local: THREE.Vector2) => number,
  uv: (p: THREE.Vector3) => [number, number],
) => {
  const g = new THREE.PlaneGeometry(w, h, sx, sy);
  g.applyMatrix4(matrix);
  const normal = new THREE.Vector3(0, 0, 1).transformDirection(matrix);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uvs = g.attributes.uv as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const local = new THREE.Vector2();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    local.set(uvs.getX(i), uvs.getY(i));
    const [u, v] = uv(p);
    const d = disp(p, local);
    p.addScaledVector(normal, d);
    pos.setXYZ(i, p.x, p.y, p.z);
    uvs.setXY(i, u, v);
  }
  g.computeVertexNormals();
  return g;
};

export const mat4 = (pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(1, 1, 1));

/** Adds a world-space discard rule to a standard material (used to cut the hole open). */
export const patchDiscard = (mat: THREE.Material, uDepth: {value: number}, cond: string) => {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uDepth = uDepth;
    sh.vertexShader =
      'varying vec3 vWPos;\n' +
      sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader =
      'varying vec3 vWPos;\nuniform float uDepth;\n' + sh.fragmentShader.replace('void main() {', `void main() {\n if (${cond}) discard;`);
  };
  mat.customProgramCacheKey = () => cond;
};

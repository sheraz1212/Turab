import * as THREE from 'three';

export const MAXR = 112;
export const cutU = {
  uRects: {value: Array.from({length: MAXR}, () => new THREE.Vector4())},
  uCount: {value: 0},
};

const HEAD = `
varying vec3 vWPos;
varying vec3 vWN;
uniform vec4 uRects[${MAXR}];
uniform int uCount;
uniform int uSelf;
`;

/**
 * mode front: discard where the cross-section is dug open.
 * mode top: discard ground surface above shafts that reach the surface.
 * mode interior: world-mapped soil texture, darken with depth, hide walls that sit inside another cut.
 */
export const patchCut = (mat: THREE.MeshStandardMaterial, mode: 'front' | 'top' | 'interior', self = -1) => {
  const selfU = {value: self};
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRects = cutU.uRects;
    sh.uniforms.uCount = cutU.uCount;
    sh.uniforms.uSelf = selfU;
    sh.vertexShader = HEAD + sh.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n vWN = normalize(mat3(modelMatrix) * objectNormal);',
    );
    let test = '';
    if (mode === 'front') test = 'if (p.x > r.x && p.x < r.z && p.y > r.y && p.y < r.w) discard;';
    if (mode === 'top') test = 'if (p.x > r.x && p.x < r.z && r.w > -0.05 && p.z > -1.6) discard;';
    if (mode === 'interior') test = 'if (i != uSelf && uSelf >= 0 && p.x > r.x + 0.004 && p.x < r.z - 0.004 && p.y > r.y + 0.004 && p.y < r.w - 0.004) discard;';
    let frag = sh.fragmentShader.replace(
      'void main() {',
      `void main() {
  vec3 p = vWPos;
  for (int i = 0; i < ${MAXR}; i++) {
    if (i >= uCount) break;
    vec4 r = uRects[i];
    ${test}
  }`,
    );
    if (mode === 'interior') {
      frag = frag.replace(
        '#include <map_fragment>',
        `vec3 an = abs(vWN);
  vec2 tuv = an.z > 0.5 ? p.xy : (an.y > 0.5 ? vec2(p.x, p.z * 1.0) : vec2(p.z, p.y));
  tuv = vec2((tuv.x + 12.0) / 24.0, (tuv.y + 16.0) / 16.0);
  vec4 sampledDiffuseColor = texture2D(map, tuv);
  diffuseColor *= sampledDiffuseColor;
  diffuseColor.rgb *= mix(0.95, 0.5, clamp(-p.z / 1.6, 0.0, 1.0));`,
      );
    }
    sh.fragmentShader = HEAD + frag;
  };
  mat.customProgramCacheKey = () => 'cut-' + mode;
};

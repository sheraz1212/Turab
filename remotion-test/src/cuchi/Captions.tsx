import {AbsoluteFill, interpolate} from 'remotion';

// Same voiceover lines and start times as the Blender version (finish.ps1).
export const LINES: [number, string][] = [
  [0.15, 'You dig a hole in the jungle, to hide from the bombs.'],
  [3.0, 'Enemy soldiers walk right past your hideout.'],
  [5.6, 'So you cover it with a wooden lid and fresh leaves. Every patrol walks straight over it.'],
  [10.3, 'A bomb lands nearby.'],
  [11.8, "But the red clay walls hold. When it dries, it's as hard as concrete."],
  [16.3, 'So you dig sideways.'],
  [18.0, 'But fresh dirt outside would give you away. So at night, you carry it out, and scatter it.'],
  [24.2, 'Deep down, the air runs out. So you drill thin air holes, and hide them inside termite mounds.'],
  [30.0, 'But smoke from your kitchen would give you away. So you send it through long tunnels, until it leaks out far away, low, like morning mist.'],
  [37.4, 'Then the enemy finds an entrance, and pumps in gas.'],
  [40.4, 'So you dig a U-bend, and fill it with water. The gas stops right there.'],
  [45.0, 'You keep digging. More levels. Kitchens. A hospital. Bedrooms.'],
  [51.0, 'Until the tunnels stretch over a hundred kilometers.'],
  [54.2, 'They send a soldier in. But the tunnels were dug for tiny people. He gets stuck.'],
  [59.4, 'Congratulations. You have built the Cu Chi tunnels.'],
];

// Word timings: no voice track here, so each line is spread at ~2.9 words/s (capped before the next line).
const WORDS: {a: number; b: number; w: string}[] = [];
LINES.forEach(([t, s], i) => {
  const words = s.replace(/[,.]/g, '').split(' ').filter(Boolean);
  const next = i + 1 < LINES.length ? LINES[i + 1][0] : 63.5;
  const dur = Math.min(next - t - 0.15, words.length * 0.34 + 0.2);
  const tot = words.reduce((a, w) => a + w.length + 2, 0);
  let acc = 0;
  for (const w of words) {
    const a = t + (dur * acc) / tot;
    acc += w.length + 2;
    const b = t + (dur * acc) / tot;
    WORDS.push({a, b, w: w[0].toUpperCase() + w.slice(1)});
  }
});

const style: React.CSSProperties = {
  fontFamily: '"DejaVu Sans", "Arial Rounded MT Bold", Arial, sans-serif',
  fontWeight: 900,
  color: 'white',
  WebkitTextStroke: '3px rgba(0,0,0,0.85)',
  paintOrder: 'stroke fill',
  textShadow: '2px 3px 4px rgba(0,0,0,0.6)',
};

export const Captions: React.FC<{frame: number}> = ({frame}) => {
  const t = frame / 24;
  const cur = WORDS.find((w) => t >= w.a && t < w.b);
  const km = t >= 51.4 && t < 53.9;
  return (
    <AbsoluteFill>
      {cur && (
        <div style={{...style, position: 'absolute', top: 1280 * 0.455, width: '100%', textAlign: 'center', fontSize: 46,
          transform: `scale(${interpolate(t - cur.a, [0, 0.06], [0.85, 1], {extrapolateRight: 'clamp'})})`}}>
          {cur.w}
        </div>
      )}
      {km && (
        <div style={{...style, position: 'absolute', top: 1280 * 0.16, width: '100%', textAlign: 'center', fontSize: 80, color: '#FFD21E', WebkitTextStroke: '4px rgba(0,0,0,0.9)'}}>
          100+ KM
        </div>
      )}
    </AbsoluteFill>
  );
};

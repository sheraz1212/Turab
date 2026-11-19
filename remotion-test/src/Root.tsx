import {Composition} from 'remotion';
import {SoilScene} from './Scene';
import {CuChi, CUCHI_FRAMES} from './cuchi/CuChi';

export const Root: React.FC = () => (
  <>
    <Composition id="SoilTest" component={SoilScene} durationInFrames={120} fps={24} width={720} height={1280} />
    <Composition id="CuChi" component={CuChi} durationInFrames={CUCHI_FRAMES} fps={24} width={720} height={1280} />
  </>
);

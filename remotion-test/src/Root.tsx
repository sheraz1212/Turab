import {Composition} from 'remotion';
import {SoilScene} from './Scene';

export const Root: React.FC = () => (
  <Composition id="SoilTest" component={SoilScene} durationInFrames={120} fps={24} width={720} height={1280} />
);

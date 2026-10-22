import React from 'react';
import {Composition} from 'remotion';
import {Orbit} from './Orbit';

export const RemotionRoot: React.FC = () => (
  <Composition id="Orbit" component={Orbit} durationInFrames={360} fps={30} width={1080} height={1920} />
);

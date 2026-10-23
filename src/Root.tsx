import React from 'react';
import {Composition} from 'remotion';
import {StarBalance} from './StarBalance';
import {Crowd} from './Crowd';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AloneInACrowd" component={Crowd} defaultProps={{includeNarration: true}} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="CrowdVisualPreview" component={Crowd} defaultProps={{includeNarration: false}} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="StarBalancePreview" component={StarBalance} defaultProps={{includeNarration: false}} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="StarBalance" component={StarBalance} defaultProps={{includeNarration: true}} durationInFrames={600} fps={30} width={1920} height={1080} />
  </>
);

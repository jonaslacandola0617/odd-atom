import React from 'react';
import {Composition} from 'remotion';
import {ArtworkMotion} from './ArtworkMotion';
import {StarBalance} from './StarBalance';
import {Crowd} from './Crowd';
import {Connection} from './Connection';
import {MotionCharactersTest} from './MotionCharacters';
import {ApprovedCharactersTest} from './ApprovedCharacters';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="MedicineArtworkMotion" component={ArtworkMotion} defaultProps={{topic: 'medicine' as const}} durationInFrames={600} fps={30} width={1920} height={1080}/>
    <Composition id="CyberArtworkMotion" component={ArtworkMotion} defaultProps={{topic: 'cyber' as const}} durationInFrames={600} fps={30} width={1920} height={1080}/>
    <Composition id="MotionCharactersTest" component={MotionCharactersTest} durationInFrames={600} fps={30} width={1920} height={1080}/>
    <Composition id="ApprovedCharactersTest" component={ApprovedCharactersTest} durationInFrames={600} fps={30} width={1920} height={1080}/>
    <Composition id="CrowdRebuilt" component={Connection} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="AloneInACrowd" component={Crowd} defaultProps={{includeNarration: true}} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="CrowdVisualPreview" component={Crowd} defaultProps={{includeNarration: false}} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="StarBalancePreview" component={StarBalance} defaultProps={{includeNarration: false}} durationInFrames={600} fps={30} width={1920} height={1080} />
    <Composition id="StarBalance" component={StarBalance} defaultProps={{includeNarration: true}} durationInFrames={600} fps={30} width={1920} height={1080} />
  </>
);

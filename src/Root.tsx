import React from 'react';
import {SingularityRebuild,singularityRebuildConfig} from './SingularityRebuild';
import {StoryMotionLab} from './StoryMotionLab';
import {TransitionLab} from './TransitionLab';
import {SingularityFilm,singularityConfig} from './Singularity';
import {SingularitySpriteExport} from './SingularitySpriteExport';
import {Composition} from 'remotion';
import {MedicineVectorArtwork} from './MedicineVector';
import {MedicineLayerExport} from './MedicineLayerExport';
import {ArtworkMotion} from './ArtworkMotion';
import {StarBalance} from './StarBalance';
import {Crowd} from './Crowd';
import {Connection} from './Connection';
import {MotionCharactersTest} from './MotionCharacters';
import {ApprovedCharactersTest} from './ApprovedCharacters';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SingularityRebuildFull" component={SingularityRebuild} defaultProps={{includeAudio:true,captions:false}} {...singularityRebuildConfig}/>
    <Composition id="StoryMotionSixScenes" component={StoryMotionLab} defaultProps={{includeAudio:true}} durationInFrames={600} fps={30} width={1920} height={1080}/>
    <Composition id="TransitionLabSixScenes" component={TransitionLab} defaultProps={{includeAudio:true}} durationInFrames={600} fps={30} width={1920} height={1080}/>
    <Composition id="SingularityFullFilm" component={SingularityFilm} defaultProps={{captions:true,includeAudio:true}} {...singularityConfig}/>
    <Composition id="SingularitySpriteExport" component={SingularitySpriteExport} defaultProps={{sheet:'galaxies-atlas',cell:0}} durationInFrames={1} fps={30} width={512} height={512} calculateMetadata={({props})=>({width:props.sheet==='field-ribbons'?768:512,height:512})}/>
    <Composition id="MedicineLayerExport" component={MedicineLayerExport} defaultProps={{layer:'window-clouds'}} durationInFrames={1} fps={30} width={1672} height={941}/>
    <Composition id="MedicineLayeredEnvironment" component={ArtworkMotion} defaultProps={{topic:'medicine' as const,environmentLayers:true}} durationInFrames={240} fps={30} width={1920} height={1080}/>
    <Composition id="MedicineVectorArtwork" component={MedicineVectorArtwork} durationInFrames={1} fps={30} width={1920} height={1080}/>
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

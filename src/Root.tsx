import React from 'react';
import {SingularitySoundEnding,singularitySoundEndingConfig} from './SingularitySoundEnding';
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
import {MasteryStudy,masteryStudies} from './MasteryStudies';
import {CancerShort,cancerShortConfig} from './CancerShort';
import {OddAtomJupiter,oddAtomJupiterConfig} from './OddAtomJupiter';
import {GalileoTape,galileoTapeConfig} from './horror/GalileoTape';
import {Episode01,ep01Config} from './horror/ep01/Episode01';
import {Episode01Viral,ep01ViralConfig} from './horror/ep01/Episode01Viral';
import {Episode02,ep02Config} from './horror/ep02/Episode02';
import {Episode03,ep03Config} from './horror/ep03/Episode03';
import {Episode04,ep04Config} from './horror/ep04/Episode04';
import {Episode05,ep05Config} from './horror/ep05/Episode05';
import {Episode06,ep06Config} from './horror/ep06/Episode06';
import {Episode07,ep07Config} from './horror/ep07/Episode07';
import {Episode08,ep08Config} from './horror/ep08/Episode08';
import {ChannelAvatar,ChannelBanner} from './horror/channel/ChannelArt';
import {Episode09,ep09Config} from './horror/ep09/Episode09';
import {Episode10,ep10Config} from './horror/ep10/Episode10';
import {Episode11,ep11Config} from './horror/ep11/Episode11';
import {Episode12,ep12Config} from './horror/ep12/Episode12';
import {Episode13,ep13Config} from './horror/ep13/Episode13';
import {Episode14,ep14Config} from './horror/ep14/Episode14';
import {OddAtomJupiterV3,oddAtomJupiterV3Config} from './OddAtomJupiterV3';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Ep06TheSoundThatMatchedUs" component={Episode06} defaultProps={{includeAudio:true,captions:true}} {...ep06Config}/>
    <Composition id="Ep07TheVoiceOfVrillon" component={Episode07} defaultProps={{includeAudio:true,captions:true}} {...ep07Config}/>
    <Composition id="Ep08RoomZero" component={Episode08} defaultProps={{includeAudio:true,captions:true}} {...ep08Config}/>
    <Composition id="Ep09TheLighthouseThatWentDark" component={Episode09} defaultProps={{includeAudio:true,captions:true}} {...ep09Config}/>
    <Composition id="Ep10TheNightTheLakeBreathedOut" component={Episode10} defaultProps={{includeAudio:true,captions:true}} {...ep10Config}/>
    <Composition id="Ep11ThePassengerOnBaleteDrive" component={Episode11} defaultProps={{includeAudio:true,captions:true}} {...ep11Config}/>
    <Composition id="Ep12TikTik" component={Episode12} defaultProps={{includeAudio:true,captions:true}} {...ep12Config}/>
    <Composition id="Ep13HalfOfHer" component={Episode13} defaultProps={{includeAudio:true,captions:true}} {...ep13Config}/>
    <Composition id="Ep14GuestsOfDominicanHill" component={Episode14} defaultProps={{includeAudio:true,captions:true}} {...ep14Config}/>
    <Composition id="ChannelAvatar" component={ChannelAvatar} durationInFrames={1} fps={30} width={800} height={800}/>
    <Composition id="ChannelBanner" component={ChannelBanner} durationInFrames={1} fps={30} width={2560} height={1440}/>
    <Composition id="Ep05NineHikersOneCutTent" component={Episode05} defaultProps={{includeAudio:true,captions:true}} {...ep05Config}/>
    <Composition id="Ep04RulesForTheNightShift" component={Episode04} defaultProps={{includeAudio:true,captions:true}} {...ep04Config}/>
    <Composition id="Ep03FootprintsInTheSnow" component={Episode03} defaultProps={{includeAudio:true,captions:true}} {...ep03Config}/>
    <Composition id="Ep02MaskOnChannel11" component={Episode02} defaultProps={{includeAudio:true,captions:true}} {...ep02Config}/>
    <Composition id="Ep01ViralCut" component={Episode01Viral} defaultProps={{includeAudio:true,captions:true}} {...ep01ViralConfig}/>
    <Composition id="Ep01DoNotLookAtTheMoon" component={Episode01} defaultProps={{includeAudio:true,captions:true}} {...ep01Config}/>
    <Composition id="HorrorGalileoTape" component={GalileoTape} defaultProps={{includeAudio:true}} {...galileoTapeConfig}/>
    <Composition id="OddAtomJupiterV3Opening" component={OddAtomJupiterV3} defaultProps={{includeAudio:true,captions:true}} {...oddAtomJupiterV3Config}/>
    <Composition id="OddAtomJupiterV2Opening" component={OddAtomJupiter} defaultProps={{includeAudio:true,captions:true}} {...oddAtomJupiterConfig}/>
    <Composition id="CancerShort76" component={CancerShort} defaultProps={{includeAudio:true,captions:true}} {...cancerShortConfig}/>
    {(['acting','explanation','transition','narrative'] as const).map(kind=><Composition key={kind} id={masteryStudies[kind].id} component={MasteryStudy} defaultProps={{kind,includeAudio:true}} durationInFrames={masteryStudies[kind].frames} fps={30} width={1920} height={1080}/>)}
    <Composition id="SingularityMusic85Percent" component={SingularitySoundEnding} defaultProps={{includeAudio:true,audioFile:'assets/audio/singularity-v6/final-mix.m4a'}} {...singularitySoundEndingConfig}/>
    <Composition id="SingularityMusicPresence" component={SingularitySoundEnding} defaultProps={{includeAudio:true,audioFile:'assets/audio/singularity-v5/final-mix.m4a'}} {...singularitySoundEndingConfig}/>
    <Composition id="SingularityFinalMix" component={SingularitySoundEnding} defaultProps={{includeAudio:true,audioFile:'assets/audio/singularity-v4/final-mix.m4a'}} {...singularitySoundEndingConfig}/>
    <Composition id="SingularitySoundEnding" component={SingularitySoundEnding} defaultProps={{includeAudio:true}} {...singularitySoundEndingConfig}/>
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

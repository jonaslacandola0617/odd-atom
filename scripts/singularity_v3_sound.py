"""Reuse the user's Curio Bureau library; retain the exact Knox source timing.

Material, movement, anticipation and consequence have separate placements.
No narration API, new generative sound request, voice retiming or pitch shift.
"""
from pathlib import Path
import hashlib,json,subprocess,wave
import numpy as np
from scipy.signal import lfilter

R=Path(__file__).resolve().parents[1];SR=48000
T=json.loads((R/'src/data/singularity-narration.json').read_text())
FRAMES=T['durationInFrames']+360;D=FRAMES/30;N=round(D*SR)
LIB=R/'public/assets/audio/library/curio-bureau'
OUT=R/'out/singularity-v3';DEST=R/'public/assets/audio/singularity-v3';DOC=R/'docs/production/singularity/sound-ending'
for p in [OUT,DEST,DOC]:p.mkdir(parents=True,exist_ok=True)
catalog=json.loads((LIB/'curio_sfx_v1/CATALOG.json').read_text())['cues']
assets={x['name']:LIB/x['path'].removeprefix('audio/') for x in catalog}
assets.update({x:LIB/'generated-editorial-v1'/f'{x}.mp3' for x in ['paper','pencil','marker_bold','camera_move','projector','ink']})
cache={};events=[];effects=np.zeros((N,2),np.float32);atmosphere=np.zeros_like(effects)
def decode(path):return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vn','-ar',str(SR),'-ac','2','-f','f32le','-']),np.float32).reshape(-1,2).copy()
def db(x):return float(20*np.log10(max(float(x),1e-10)))
def load(name):
    if name not in cache:cache[name]=decode(assets[name])
    return cache[name].copy()
def add(time,name,target=-28,pan=0,length=None,start=0,role='',bus='effects',reverse=False,fade_in=.018,fade_out=.16):
    sound=load(name);offset=round(start*SR);sound=sound[offset:]
    if length is not None:sound=sound[:round(length*SR)]
    if reverse:sound=sound[::-1].copy()
    if len(sound)<10:return
    rms=np.sqrt(np.mean(sound**2));gain=min(10**(target/20)/max(rms,1e-9),.36/max(np.max(np.abs(sound)),1e-9))
    sound*=gain
    ramp=min(len(sound)//4,round(fade_in*SR));tail=min(len(sound)//3,round(fade_out*SR))
    sound[:ramp]*=np.linspace(0,1,ramp)[:,None];sound[-tail:]*=np.linspace(1,0,tail)[:,None]
    # Preserve some original width while linking the cue to screen position.
    mono=sound.mean(axis=1);sound[:,0]=.28*sound[:,0]+.72*mono*np.sqrt(1-pan);sound[:,1]=.28*sound[:,1]+.72*mono*np.sqrt(1+pan)
    begin=round(time*SR)
    if begin<0:sound=sound[-begin:];begin=0
    end=min(N,begin+len(sound));sound=sound[:end-begin]
    dest=effects if bus=='effects' else atmosphere;dest[begin:end]+=sound
    events.append({'time':round(time,4),'duration':round(len(sound)/SR,4),'asset':str(assets[name].relative_to(R/'public')),'cue':name,'target_rms_dbfs':target,'gain':round(float(gain),6),'pan':pan,'role':role,'bus':bus,'reverse':reverse,'source_offset':start})
def beat(n):return T['visualBeats'][n-1]['startFrame']/30
def cue(n,offset,name,target=-28,pan=0,role='',**kw):add(beat(n)+offset,name,target,pan,role=role,**kw)
def bed(start,end,name,target=-43,role='environment'):
    # Crossfaded overlapping library loops retain the source's character without
    # generating a new sound family. Overlap gains are calibrated per buffer.
    sound=load(name);dur=len(sound)/SR;spacing=max(1,dur-.6)
    for t in np.arange(start,end,spacing):
        add(float(t),name,target,0,length=min(dur,end-t),role=role,bus='atmosphere',fade_in=.6,fade_out=.6)

# Opening: approach textures, disappearance, then sustained density/tension.
add(.2,'soft_depth_pass',-30,-.35,role='Rewind begins across depth layers')
cue(2,.45,'perspective_whip',-28,.25,role='Structure gathers')
cue(3,.2,'parallax_swish',-27,0,role='Star contracts into the next scale')
cue(4,.15,'soft_depth_pass',-28,-.3,role='Electron/orbit separation',reverse=True)
cue(4,1.9,'cut_match',-29,.3,role='Atomic state gives way to plasma')
bed(beat(5),beat(7),'cavern_lowwind',-42,'Designed density atmosphere, not literal sound in vacuum')
cue(5,1.1,'cable_tension',-29,0,role='Compression begins')
cue(5,4.2,'wood_stress',-29,-.25,role='Description strains')
cue(5,7.5,'low_cinematic_hit',-28,0,role='Classical divergence emphasis')
cue(7,.4,'turn_of_story',-29,-.1,role='The apparent answer becomes a question')
for k in range(5):cue(7,1.9+k*.28,'metallic_rivet',-31-k*.6,(-1)**k*.35,length=.28,role='Individual model tiles detach')
cue(7,3.8,'lost_signal',-31,.35,role='Model loses continuation')

# Three distinct ideas, each with a material placement rather than three dings.
for n,o,name,pan in [(8,.3,'photo_slide',-.55),(8,2.3,'paper_light_turn',0),(8,4.4,'document_focus',.55)]:cue(n,o,name,-29,pan,role='Separate knowledge motifs enter')
cue(8,8.2,'map_route_draw',-31,0,role='A relationship is drawn, not a new fact certified')
cue(9,.5,'soft_depth_pass',-29,-.4,role='Galaxy separation begins')
cue(9,3.1,'cable_tension',-30,.2,role='Distances and wavelength stretch')
cue(9,9.3,'soft_depth_pass',-28,.3,role='Expansion rewinds',reverse=True)

# Recombination: individual captures, a release pass, then an instrument response.
bed(beat(10),beat(11),'radio_noise_bed',-45,'Quiet radiation sonification')
for k in range(6):cue(10,1.7+k*.72,'tiny_mask_reveal',-31+(k%2),-.55+k*.22,role='Separate electron-capture moments')
cue(10,6.2,'parallax_swish',-27,-.35,role='Formerly scattered light is released')
cue(10,8.8,'soft_depth_pass',-29,.35,role='Light continues across the field')
cue(10,12.5,'heavy_hinge',-31,.4,role='Receiving dish moves into place')
cue(10,16.5,'radio_search',-30,.45,role='Instrument searches the stretched signal')
cue(10,18,'data_pulse',-30,.35,role='Signal arrives at the receiver')

# Contacts have approach, landing and a short settling detail.
cue(11,.8,'document_focus',-30,-.2,role='Nucleons approach')
cue(11,3.7,'cut_match',-29,0,role='Helium constituents contact',length=.5)
cue(11,4.45,'micro_emphasis',-28,0,role='Helium cluster settles')
cue(11,6.1,'document_focus',-31,.45,role='Deuterium constituents approach')
cue(11,7.45,'cut_match',-28,.5,role='Deuterium cluster settles',length=.55)
for k in range(3):cue(12,1.3+k*1.7,'photo_slide',-29,-.5+k*.4,role='Clue motif travels toward the instrument')
cue(12,6.4,'gear_ratchet',-31,.4,role='Telescope mechanism')
cue(12,7.2,'evidence_lock',-29,.25,role='Clues agree on hot history')
cue(12,10.2,'pencil_marks',-29,-.4,role='The unsupported earlier segment is sketched')

# Gravity, compression and broken support: substantial material consequences.
cue(13,1,'soft_depth_pass',-29,0,role='Mass descends')
cue(13,3.95,'low_cinematic_hit',-26,0,role='Mass arrival deforms the grid')
cue(13,4.2,'cable_tension',-30,-.2,role='Curvature settles after arrival')
cue(13,9,'wheel_roll',-31,.2,role='Following the model backward')
bed(beat(14),beat(15),'workshop_floor',-44,'Quiet model-strain texture')
for k in range(4):cue(14,1+k*2.8,'screw_jack_turn',-30+k*.4,(-1)**k*.25,role='Progressive contraction')
cue(14,12.1,'wood_stress',-28,0,role='Approach to the classical boundary')
cue(15,.45,'turn_of_story',-30,0,role='Tested conditions become an assumption')
cue(15,2,'wheel_roll',-31,-.25,role='Marker advances along supported tiles')
cue(15,5.8,'wood_stress',-27,.25,role='Unsupported span begins to fail')
for k in range(5):cue(15,6.25+k*.4,'metallic_rivet',-29-k*.5,.1+k*.1,role='Separate unsupported pieces fall',length=.4)
cue(16,.4,'lost_signal',-29,.3,role='Infinity does not deliver a measurable answer')

# Room misconception and its removal: paper/hinge/scale sounds fit the art.
cue(17,.2,'paper_heavy_turn',-27,-.5,role='Enter the thought-experiment drawing')
cue(18,2.7,'suspense_riser',-31,0,role='Anticipation before the imagined blast')
cue(18,4.3,'restrained_boom',-27,0,role='Explicitly imagined explosion illustration')
cue(18,4.5,'perspective_whip',-29,.4,role='Pieces move outward')
cue(19,.4,'heavy_hinge',-28,-.5,role='The assumed walls become apparent')
cue(19,2,'paper_heavy_turn',-28,.5,role='Room framing pulls outward')
cue(20,.1,'paper_heavy_turn',-26,-.4,role='Container panels unfold away')
cue(20,.65,'parallax_swish',-29,.4,role='Continuous spatial field replaces the container')
cue(20,4,'soft_depth_pass',-31,0,role='The field expands throughout')
cue(21,.4,'camera_move',-30,.3,role='A different viewpoint is selected')
cue(22,1.8,'pencil_marks',-29,-.25,role='Observable-region outline begins')
cue(22,5,'map_route_draw',-29,.25,role='The observational region is drawn inside a larger field')
cue(23,1,'soft_depth_pass',-29,0,role='Only the local region rewinds',reverse=True)
cue(23,5,'cable_tension',-30,-.2,role='Region contracts; exterior remains')

# Incompatible descriptions, then a different metaphor for time.
cue(24,.1,'cut_match',-29,0,role='Move to the two-scale comparison')
cue(24,2,'document_focus',-31,-.45,role='Quantum-scale focus')
cue(24,6,'document_focus',-31,.45,role='Gravity-scale focus')
cue(25,.6,'cable_tension',-29,0,role='Two descriptions approach a common regime')
cue(26,1.2,'lost_signal',-28,0,role='Combined description remains missing')
cue(26,7,'paper_light_turn',-31,-.2,role='Attempted connection approaches the gap')
cue(27,.4,'turn_of_story',-29,0,role='Boundary returns as a need for physics')
cue(28,.1,'paper_heavy_turn',-28,-.25,role='A hypothetical history is unrolled')
cue(28,2,'map_route_draw',-29,-.35,role='The time route is drawn')
cue(28,5,'pencil',-31,.15,role='Continued route sketch',length=1.7)
cue(29,3.5,'wood_stress',-30,.3,role='Assumed continuation meets a boundary')
cue(30,.2,'paper',-26,-.3,role='Map unfolds')
cue(30,2.6,'paper_light_turn',-29,.4,role='Folded panels settle')
cue(30,4.2,'map_route_draw',-30,-.25,role='Pointer follows the map')
cue(30,8.9,'unit_mismatch',-31,-.5,role='Requested location lies outside the defined domain')
cue(30,12.5,'photo_slide',-30,.1,role='Pointer returns inside the map')
cue(31,.2,'pencil_marks',-31,-.45,role='Earliest-event illustration stays conditional')

# Alternative histories: restrained motion and tension, not repeated victories.
cue(32,.1,'paper_heavy_turn',-28,-.25,role='Change hypothetical history')
cue(33,.5,'cable_tension',-29,0,role='Contraction')
cue(33,4.1,'wood_stress',-29,0,role='Finite minimum approaches')
cue(33,7.7,'micro_emphasis',-28,0,role='Illustrative bounce minimum')
cue(33,8,'soft_depth_pass',-27,.3,role='Expansion follows the hypothetical minimum')
cue(34,.3,'gear_ratchet',-30,.45,role='Comparison apparatus enters')
cue(34,4.8,'radio_search',-31,.35,role='Comparison asks for evidence')
cue(35,.1,'lost_signal',-30,0,role='No confirmed bounce is delivered')
cue(36,.1,'parallax_swish',-27,0,role='Field patch expands rapidly')
cue(36,1.6,'cable_tension',-29,.3,role='Wavelength and spacing stretch together')
cue(36,4,'soft_depth_pass',-29,-.3,role='Expansion continues across depth')
cue(37,5,'pencil_marks',-31,.45,role='Open mechanism region is drawn')
for k in range(4):cue(38,1.1+k*1.1,'soft_depth_pass',-31,[-.4,.3,.55,-.5][k],role='Independent hypothetical regions appear')
cue(39,.1,'turn_of_story',-31,0,role='Shared-birthplace question without a family tree')
cue(40,5,'radio_search',-32,.2,role='Return to observational access')

# Empty space/framework and knowledge summary.
cue(41,.1,'document_focus',-32,0,role='Attention narrows to apparently empty space')
bed(beat(42),beat(44),'cavern_lowwind',-45,'Quiet conceptual field; fictional sonification')
cue(42,.5,'soft_depth_pass',-30,-.4,role='Fields are revealed beneath apparent emptiness')
cue(42,3.4,'cable_tension',-30,.1,role='Localized excitation grows within the field')
cue(43,.7,'steel_latch',-30,-.3,role='Framework becomes explicit')
cue(43,3.5,'heavy_hinge',-30,.3,role='Boundary and supports appear')
cue(43,8,'pencil_marks',-32,.5,role='Why the framework exists remains an unfinished mark')
for k,name in enumerate(['photo_slide','paper_light_turn','document_focus']):cue(44,k*.5,name,-31,(k-1)*.45,role='Knowledge levels return')
cue(45,3,'evidence_lock',-29,-.4,role='Supported history is distinguished')
cue(45,7,'document_stamp',-31,0,role='Second supported motif is confirmed')

# Instrument details, moving light and a human connection.
bed(beat(46),beat(47),'mission_control',-43,'Observatory electronics atmosphere')
cue(46,.2,'heavy_hinge',-29,-.5,role='Telescope changes aim')
cue(46,1.2,'gear_ratchet',-31,-.4,role='Aim mechanism settles')
cue(46,3.4,'radio_search',-30,.45,role='Dish searches incoming light')
cue(46,4.2,'data_pulse',-30,.45,role='Signal reaches receiver')
cue(46,6.8,'radar_sweep',-31,.1,role='Trace passes across comparison display')
cue(46,10,'paper_light_turn',-32,0,role='Candidate trace is compared')
cue(46,14,'radio_search',-32,.4,role='Possible signal remains a question')
cue(47,.25,'soft_depth_pass',-31,.2,role='Focus reaches the human figure')
cue(48,.2,'tiny_mask_reveal',-30,-.4,role='Hydrogen motif is introduced')
cue(48,2.9,'cut_match',-30,0,role='Hydrogen arrives near the human gesture')
cue(48,4.1,'low_cinematic_hit',-31,-.5,role='Later stellar production is introduced')
cue(48,5.8,'parallax_swish',-29,-.2,role='Stellar constituents disperse')
cue(48,8.3,'cut_match',-30,.25,role='Counted nucleus motif settles near the human')
cue(49,1.2,'map_route_draw',-30,-.25,role='A cosmic-history trail joins the human-scale scene')

# Ending: reprise, restrained tension, an audible gap, then a paper/map payoff.
cue(50,.1,'soft_depth_pass',-28,-.3,role='Closing rewind')
cue(50,2.6,'perspective_whip',-29,0,role='Past stellar structure')
cue(50,5.9,'document_focus',-29,.3,role='Past atoms')
cue(51,.2,'paper_light_turn',-30,0,role='The last drawn map is revealed')
cue(51,2.1,'map_route_draw',-29,-.3,role='Knowledge marker approaches the edge')
cue(51,5,'pencil_marks',-30,0,role='The model stops before an answer')
cue(51,7.2,'cable_tension',-32,.2,role='Question is held without a fabricated impact')
add(535.7,'camera_move',-31,0,role='Pullback reveals that the edge belongs to a map')
add(538.8,'paper_heavy_turn',-26,.4,role='Printed page lifts after the spoken question')
add(541.4,'paper',-28,.25,length=2.1,role='Unprinted paper is revealed')
add(543.2,'pencil_marks',-31,.45,role='A tentative unfilled location is sketched')
add(543.9,'suspense_riser',-34,0,length=2,role='A restrained unresolved tail, not a new answer')
bed(537.6,D,'cavern_lowwind',-44,'Quiet lingering question tail')

voice_path=R/'public'/T['audioFile'];assert hashlib.sha256(voice_path.read_bytes()).hexdigest()==T['audioSha256']
voice=decode(voice_path);ref=np.zeros((N,2),np.float32);ref[:min(len(voice),N)]=voice[:N]*.92
# Smoothed presence envelope ducks effects by at most 4.7dB, never the voice.
mono=np.mean(voice,axis=1);hop=480;blocks=len(mono)//hop
presence=np.sqrt(np.mean(mono[:blocks*hop].reshape(blocks,hop)**2,axis=1)+1e-12)
raw=np.clip((presence-.012)/.07,0,1);smoothed=lfilter([.12],[1,-.88],raw)
control=np.interp(np.arange(N)/SR,np.arange(len(smoothed))*.01,smoothed,left=0,right=0).astype(np.float32)
effects*= (1-.42*control)[:,None];atmosphere*=(1-.28*control)[:,None]
score=decode(R/'public/assets/audio/singularity/score.m4a');music=np.zeros_like(ref);music[:min(N,len(score))]=score[:N]
music*= (1-.22*control)[:,None]
# Strip the music back around reversals and let the last question breathe.
for s,e in [(24,26),(146.4,148.4),(264.0,266.4),(399,401),(531,537.4)]:
    i,j=round(s*SR),round(e*SR);ramp=np.minimum(1,np.minimum(np.arange(j-i)/(SR*.25),(j-i-np.arange(j-i))/(SR*.35)))
    music[i:j]*=(1-.78*ramp)[:,None]
fade=np.clip((D-np.arange(N)/SR)/3.8,0,1).astype(np.float32)
effects*=fade[:,None];atmosphere*=fade[:,None]
# Opening is quiet for the first spoken word; all transition contacts remain.
intro=np.minimum(1,np.arange(N)/SR/.22).astype(np.float32);effects*=intro[:,None]
def write(name,sound,bitrate='160k'):
    path=OUT/(name+'.wav')
    assert np.isfinite(sound).all()
    with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(sound,-1,1)*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(path),'-c:a','aac','-b:a',bitrate,'-movflags','+faststart',str(DEST/(name+'.m4a'))],check=True)
    return path
fx=write('effects',effects);amb=write('atmosphere',atmosphere,'128k');bedfile=write('score',music,'128k')
graph=f'[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=.92,apad,atrim=duration={D}[voice];[voice][1:a][2:a][3:a]amix=inputs=4:normalize=0,alimiter=limit=.8414:level=0:latency=1,apad,atrim=duration={D}[mix]'
subprocess.run(['ffmpeg','-y','-v','error','-i',str(voice_path),'-i',str(fx),'-i',str(amb),'-i',str(bedfile),'-filter_complex',graph,'-map','[mix]','-ar',str(SR),'-c:a','aac','-b:a','192k','-movflags','+faststart',str(DEST/'final-mix.m4a')],check=True)
measure=[]
for event in events:
    if event['bus']!='effects':continue
    i=round(event['time']*SR);j=min(N,i+round(event['duration']*SR));vr=np.sqrt(np.mean(ref[i:j]**2));fr=np.sqrt(np.mean(effects[i:j]**2))
    measure.append({'time':event['time'],'cue':event['cue'],'effect_rms_dbfs':db(fr),'voice_rms_dbfs':db(vr),'effect_below_voice_db':db(vr/max(fr,1e-9))})
voiced=[x['effect_below_voice_db'] for x in measure if x['voice_rms_dbfs']>-35]
record={'duration_frames':FRAMES,'duration_seconds':D,'source_voice':T['audioFile'],'source_voice_sha256':T['audioSha256'],'voice_speed':1,'voice_pitch_shift':0,'voice_mix_gain':.92,'new_generative_audio_requests':0,'library':'assets/audio/library/curio-bureau/IMPORT.json','distinct_library_cues_used':len({x['asset'] for x in events}),'events':events,'measured_effect_windows':measure,'median_effect_below_simultaneous_voice_db':float(np.median(voiced)),'tail_after_original_voice_seconds':D-T['durationSeconds'],'narrative_note':'Space/particles/physics sounds are fictional sonification. Material sounds accompany diagram paper/geometry, not purported recordings of the early universe.','review_limits':'Levels, source timing and event placement can be verified here; direct audio audition is unavailable and creative listening approval remains with the user.'}
(DOC/'sound-design.json').write_text(json.dumps(record,indent=2)+'\n')
(DEST/'README.md').write_text('# Singularity sound/ending revision stems\n\nReusable committed `effects.m4a`, `atmosphere.m4a`, `score.m4a` and `final-mix.m4a`. All effect source cues come from the user-owned imported Curio Bureau library; no new generative sound or voice request was made. Full cue placement, gains and origins are in `docs/production/singularity/sound-ending/sound-design.json`. Original Knox timing/pitch are unchanged; the film has a 12-second visual tail after the old picture endpoint. Rebuild with `npm run sound:singularity-v3`.\n')
print('Placed',len(events),'events using',record['distinct_library_cues_used'],'existing cues. Median effect below simultaneous voice:',round(record['median_effect_below_simultaneous_voice_db'],1),'dB',flush=True)

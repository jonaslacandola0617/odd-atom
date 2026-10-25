"""Materialize analyst-authored observations from inspected evidence.

No semantic recognition is automated here. Case ranges are selected intervals,
not verified complete shots. Do not promote navigation to temporal review.
"""
import gzip
import json
from pathlib import Path
from common import ROOT,write_json

HALF='reference_fd02030ee890';TREES='reference_46db30e386c9'
HISTORY='reference_3dab4435d188';ROOTS='reference_2e586456bc4d';AI='reference_9a02fcef71d3'

# ID, source, exported case, purpose, attention order, characters, props,
# background/layer description, direct observations, unresolved construction.
CASES=[
 ('C01',HALF,'creator-reaction',
  'A diminishing luminous object is reinforced by the human reaction and loss of surrounding illumination.',
  ['luminous core beside hand','face','lowering hand','surrounding idea panels'],
  [('half.creator','Pink-faced, violet-haired human in a cyan shirt; chest-up view.')],
  [('half.core','Small bright core near raised hand.'),('half.idea-panels','Book/art panels around the actor.'),('half.telescope','Telescope near the edge of the composition.')],
  'Dark blue field, cyan light wash, radial rays and small particles; actor in front of this field.',
  ['Core visibly shrinks while hand lowers; movement has a slow interval followed by a larger descent.',
   'Blink near f2133–2135 coincides with the later descent; these are strongest-closure samples, not the entire blink.',
   'Face/hair light wash and surrounding ray prominence diminish; no continuous dark outline encloses the face.'],
  'Exact shoulder/elbow pivots, source easing, mesh vs redrawn shapes and camera parenting are not recoverable uniquely.'),
 ('F01',TREES,'forest-layer-motion',
  'Foreground foliage opens a view toward the path and central tree, making depth part of the reveal.',
  ['opening between dark branches','bright path','central broad tree'],[],
  [('forest.foreground-left','Large dark evergreen foliage overlapping the left frame.'),('forest.rear-trunk','Purple rear trunk visible through foliage.'),('forest.path','Warm winding path leading toward the tree.')],
  'Overlapping dark foreground evergreens, middle foliage/path and smaller rear trees; warm opening against cool greens.',
  ['Foreground foliage and selected rear-trunk features have substantially different image motion.',
   'Registered rear-trunk subset cannot account for surviving foreground tracks; source-layer parallax is a plausible interpretation.'],
  'A flattened movie does not distinguish a virtual camera from multiple authored layer transforms. Mixed-depth ROIs gave misleading medians.'),
 ('G01',TREES,'tree-conduit-flow',
  'A central tissue diagram and outward arrows explain radial thickening; this interval is not a measured water-flow example.',
  ['central purple column','green boundary cells','outward arrows'],[],
  [('trees.radial-column','Purple vertical column with thin internal striations and green boundary marks.'),('trees.growth-arrows','Large left/right purple arrows.')],
  'Dark violet field with subdued circular texture isolates the central diagram.',
  ['Green marks appear along both column edges while arrows point outward.',
   'Column width and arrow prominence change; diagram remains centered and readable.'],
  'The source path topology, layer parenting and exact width/ease curves have not been recovered.'),
 ('H01',TREES,'cell-column-change',
  'Hold the simplified cell arrangement long enough to read the structure during explanation.',
  ['repeating hollow purple cells','small separators at connections'],[],
  [('trees.sieve-columns','Three main chains of narrowed purple cell outlines with small connector marks.')],
  'Soft dark purple/blue circular texture; no competing foreground character.',
  ['Arrangement is largely held through the sampled 72 frames; small image changes do not establish a separate acting cycle.'],
  'No principal action onset or complete biological transformation is contained in this window.'),
 ('R01',ROOTS,'root-rock-change',
  'Root/rock interaction makes underground force and mineral access visible rather than leaving the mechanism to narration.',
  ['orange root tips','blue rock gap','warm particles at contact'],[],
  [('roots.tip-left','Warm layered root approaching from lower left.'),('roots.tip-right','Warm layered root from upper right.'),('roots.rock','Large blue faceted rock sections with interior marks.'),('roots.mineral-particles','Warm circular particles near root/rock boundaries.')],
  'Dark granular underground field; thick cool rock contours frame warm roots.',
  ['Rock sections are separated around the roots; root widths and framing change during the interval.',
   'Warm particles appear and move near the contact areas.',
   'Broader 439–467 s overview and unverified ASR describe cracks, swelling/hydraulic force, acid and mineral uptake; a detour alone would tell a different story.'],
  'Camera contribution to the reframing and exact shape morphs remain uncertain; observed particles do not identify chemical species.'),
 ('L01',ROOTS,'leaf-section-reveal',
  'A transparent surface, ray and droplets explain a leaf surface admitting light while retaining water.',
  ['transparent white-edged plate','amber ray','droplets','layered leaf block'],[],
  [('leaf.epidermis-plate','Transparent white-edged quadrilateral above the leaf section.'),('leaf.ray','Amber diagonal light arrow/ray.'),('leaf.droplets','Blue droplets on upper surface.'),('leaf.section','Green upper cells with purple lower structure in an oblique block.')],
  'Plain violet field gives the exploded section strong separation.',
  ['Exploded leaf is already established at the start; this window does not contain its initial reveal.',
   'The amber ray and droplets remain legible through a mostly held composition; ray prominence changes toward the end.'],
  'No source extrusion, projection matrix or exact plate trajectory is known.'),
 ('W01',HISTORY,'hillside-walk-cycle',
  'Small walking figures supply human scale and activity on a spare land/settlement diagram.',
  ['two people at left','ground contour','open area toward settlement'],
  [('history.walker-left','Small human at the left of the terrain diagram.'),('history.walker-right','Second small human beside the first.')],
  [('history.ground-profile','Thin land contour running across a pale field.')],
  'Nearly empty light field; small people contrast with the large explanatory ground profile.',
  ['Leg/arm silhouettes cycle while the pair travels little within this one-second interval.',
   'The preceding overview changes from a map to the land diagram by about 770 s.'],
  'Tiny image scale is insufficient to validate exact foot plants, knee pivots, full step period or a production locomotion rig.'),
 ('T01',HISTORY,'tablet-hand-interaction',
  'Isolate the inscribed tablet and reaching hands to make an otherwise anonymous historical exchange tangible.',
  ['glowing tablet','holding hand','approaching hand'],[],
  [('history.tablet','Orange rounded inscribed clay tablet.'),('history.holding-hand','Warm hand entering from lower left and supporting the tablet.'),('history.reaching-hand','Warm hand entering from upper right.')],
  'Dark red-to-teal field; glow is concentrated around the orange tablet.',
  ['Upper-right hand approaches and overlaps the tablet edge while lower-left hand remains attached to it.',
   'Selected native interval shows approach/contact, not a completed release.',
   '911–917 s proxy scout shows blue cosmic/figure motifs replacing parts of the hands, followed by a seated person; do not label this simply a finished handoff.'],
  'Exact grip pivot, depth ordering of hidden fingers and any final release need additional native evidence.'),
 ('E01',HISTORY,'fire-circle-secondary-motion',
  'One central fire unifies a social group while additional people become visible around the perimeter.',
  ['bright central fire','seated inner group','dimmer outer people'],
  [('history.fire-group','Several rounded human figures arranged around a fire; inner people have warmer illumination.')],
  [('history.fire','Central yellow/orange fire and rising warm sparks.'),('history.vessels','Small green vessels near seated people.')],
  'Dark violet field, warm central ground pool, dim peripheral silhouettes.',
  ['Flame shape and rising sparks change between consecutive frames.',
   'Outer figures grow more visible during the interval while the inner circle remains the primary focus.',
   'Small character pose changes do not all occur as one simultaneous uniform sway.'],
  'Exact crowd count and each person’s rig/action timing have not been individually tracked.'),
 ('P01',HALF,'materials-arrival',
  'An accumulating pile of screens, paper and objects communicates volume and production effort.',
  ['falling phone and papers','growing pile','grounding oval'],[],
  [('half.material-pile','Overlapping blue/violet devices and documents.'),('half.falling-phone','Small portrait-format phone falling toward the pile.'),('half.falling-papers','White sheets with differing tilt and trajectories.'),('half.gold-object','Small gold vessel/trophy-like object; precise identity uncertain.')],
  'Dark blue field and a blue oval ground shadow isolate a dense central pile.',
  ['Phone descends and rotates into the pile across the interval; papers enter at separate times and orientations.',
   'Later gold object rotates as it descends; not every item shares one rigid group transform.',
   'The pile preserves overlap/occlusion rather than leaving every object on an independent visible plane.'],
  'Exact source collision solver, object weights and per-object bounce curves are unknown; do not infer physics simulation.'),
 ('A01',AI,'room-object-change',
  'Establish the instruction and furnished room before revealing a failure of the intended meaning of “clean.”',
  ['request bubble','human in room','furniture'],
  [('ai.room-person','Small human centered in an orange isometric room.')],
  [('ai.room-furniture','Bed/sofa, desk, chair, shelving and small scattered items.'),('ai.request','White “Clean my room!” speech bubble.')],
  'Bright orange/yellow isometric room floats on a dark blue field; exterior agent at lower right.',
  ['Furniture largely holds during this 171–173 s interval; it is setup, not the main stripping action.'],
  'No furniture-removal timing should be measured from this initial selection.'),
 ('A02',AI,'room-strip-action',
  'Remove everything that makes the room useful to expose the mismatch between instruction and intention.',
  ['furniture disappearing','remaining person','empty room','agent outside'],
  [('ai.room-person','Same centered human remains while belongings disappear.'),('ai.room-agent','Small glowing agent outside at lower right.')],
  [('ai.room-furniture','Same furniture now shrinking/disappearing in a staggered sequence.'),('ai.clean-sparkles','Small pale sparkle bursts at disappearing items.')],
  'Room shell stays orange/yellow and stable against the dark exterior.',
  ['Furnished state holds initially; items then shrink/disappear in stages with sparkle marks.',
   'By f10590 /176.5 s the room is visibly empty except for the human; small sparkles subside afterward.',
   'Room shell and person remain, preserving the comparison without a scene cut.'],
  'Precise authored scale curves and the identity of every tiny removed item are not recovered.'),
 ('A03',AI,'boat-reward-path',
  'Bridge from scoreboard to racecourse; this window is a cut/setup control, not a complete route study.',
  ['ranked boats on scoreboard','racecourse after cut'],[],
  [('ai.scoreboard','Pale scoreboard with ranked boat illustrations and numbers.'),('ai.racecourse','Top-down teal water, sea walls, coins and route markers.')],
  'Flat bright scoreboard becomes a cool top-down course.',
  ['Hard cut at f12366 /206.1 s changes scoreboard to the course; boats enter near the end.'],
  'Do not derive a loop path from this initial selection; use A04 and the broader scout.'),
 ('A04',AI,'boat-collision-and-turn',
  'A green boat pursues rewards away from the useful race route; contact, damage and continued turning make the error visible.',
  ['green boat and coin','wall near top','contrasting purple racers','curved wake'],[],
  [('ai.green-boat','Lime/green boat turning toward the upper sea wall.'),('ai.purple-racers','Purple boats on the right route.'),('ai.coins','Gold reward markers.'),('ai.wake','Pale curved water trail behind moving boat.'),('ai.damage','Orange/yellow flames and intermittent low-opacity hull after wall approach.')],
  'Top-down teal course framed by stone-colored wall/pier and small decorative sailboats.',
  ['Green hull rotates and translates along a curved route; wake preserves recent direction.',
   'Near f12716–12720 /211.933–212.0 s warm flames become clearly visible after the wall approach.',
   'Purple racers continue upward on the right while green boat turns left/down; the 206–220 s scout shows the broader loop and return to a winning scoreboard.'],
  'Hull-mask centroid is not pivot; covariance angle is modulo180. Full loop timing still needs native tracking beyond this two-second window.'),
 ('A05',AI,'shared-route-reveal',
  'A visible connector and fragments make access across a boundary readable between an agent and a green endpoint.',
  ['bright connector','green endpoint','agent icon','diagonal boundary'],
  [('ai.route-agent','Small dark diamond-shaped agent with one bright eye at lower left.')],
  [('ai.route-connector','Cyan-to-pale angular connector crossing a diagonal division.'),('ai.route-endpoint','Green glowing square endpoint.'),('ai.route-fragments','Pale rectangular fragments near crossing.'),('ai.route-label','Magenta ARTIFACTORY label above endpoint.')],
  'Dark blue left half and circuit-patterned green right half divided diagonally.',
  ['Connector geometry and pale fragments change while the endpoint remains the focus.',
   'Magenta label retracts/fades near the end; background pattern remains subordinate to the bright route.'],
  'Specific network topology and data semantics require source context; visual shapes are not measured packet traffic.'),
 ('A06',AI,'agent-group-staging',
  'Preserve a contrasting minority row while revealing a much larger surrounding population.',
  ['three initial rows of magenta agents','cyan minority row','expanding magenta population'],
  [('ai.magenta-agents','Repeated varied magenta one-eyed agent silhouettes.'),('ai.cyan-agents','Smaller cyan/blue contrasting row.'),('ai.corner-bird','Small bird entering/visible at lower right late in the interval.')],
  [('ai.objection-bubble','Purple bubble with green symbols near the cyan row, removed during expansion.')],
  'Dark near-black field with violet top light; repeated icons create the informational structure.',
  ['Initial compact group is readable before the composition expands.',
   'Around f53973 onward, additional icons enter/spread while original group scales/repositions; by f54012 the larger array fills the frame.',
   'Cyan minority remains a contrasting row within the much larger magenta field; icons retain differing silhouettes.'],
  'The visible array is illustrative, not a verified exact count of agents or a measured percentage.'),
 ('D01',HISTORY,'farmer-design',
  'Contrast a person carrying a harvest with a person working in the crop patch; props and pose communicate labor.',
  ['left carrier and full basket','right bending worker','crop patch','distant hills'],
  [('history.harvest-carrier','Long-legged human in cyan patterned dress, purple rear/front hair, warm skin and filled simplified facial marks.'),('history.harvest-worker','Bent bearded human in a cyan patterned tunic; hand near basket and crops.')],
  [('history.harvest-basket','Warm orange ribbed basket overlapping both forearms.'),('history.crops','Repeated orange mounds/roots and curving green leaves.')],
  'Light green land, darker curving patch, rounded blue/teal hills, layered rock and shrub masses.',
  ['Native still shows continuous arm silhouettes, hidden joints under basket/clothing overlap and selective internal color patches.',
   'Long thin exposed legs differ substantially from creator C01 proportions; a single head/body ratio is not supported.'],
  'Single-frame drawing study only; no movement, rig or stable across-angle identity inferred.'),
 ('D02',AI,'scientist-design',
  'Two people and a laptop make technical activity ominous through source-motivated green illumination.',
  ['luminous faces/hands','laptop','subdued circuit wall'],
  [('ai.laptop-person-left','Dark human silhouette with green-edged smile and hand.'),('ai.laptop-person-right','Dark human with round glasses and green face illumination.')],
  [('ai.laptop','Dark laptop with green illumination below/around it.')],
  'Very dark blue wall with circuit-like lines; green light is concentrated on nearby forms.',
  ['Large flat silhouettes and very selective luminous edges replace the bright pastel facial treatment of C01.',
   'Internal background marks have far less contrast than the faces and device.'],
  'Single native frame; light animation and expression changes are not established here.'),
 ('D03',HALF,'bird-design',
  'A seated viewer with laptop and phone stages divided attention.',
  ['large magenta bird','bright laptop screen','phone and chair arm','subdued room'],
  [('half.viewer-bird','Large magenta bird, broad rounded head/body, yellow beak/feet, white expressive facial area, purple wing plane.')],
  [('half.laptop','Blue layered laptop with rounded corners and simplified keyboard keys.'),('half.phone','Small teal phone partly hidden by chair.'),('half.chair','Red/violet rounded chair with broad internal shadow patches.'),('half.mug','Violet mug on table.')],
  'Dark blue interior with low-contrast plant/frame silhouettes; furniture overlaps the bird.',
  ['Bird anatomy uses species-specific wing/foot/beak shapes, not the human limb proportions.',
   'White angled HEY lettering is part of this source communication; it does not authorize titles in our tests.'],
  'One native still supports construction/composition only, not motion or mouth timing.'),
]

PHASES={
 'C01':[(2040,2071,'early decrease','Core area falls sharply; hand moves down modestly.'),(2071,2101,'slow interval','Hand displacement is smaller while diminished core remains.'),(2101,2144,'release','Larger hand descent, blink near2133–2135, core falls below threshold by2143.'),(2144,2160,'aftermath','Core absent under threshold, hand exits lower ROI.')],
 'A02':[(10530,10548,'setup hold','Room remains furnished.'),(10548,10590,'staggered removal','Small items and large furniture disappear at different times; sparkles mark changes.'),(10590,10610,'result hold','Human remains in empty room, residual sparkles subside.')],
 'A04':[(12660,12704,'curved approach','Boat turns toward top wall; pale wake curves behind.'),(12704,12720,'contact/damage interval','Hull intermittently loses opacity and visible flames appear by end.'),(12720,12780,'consequence','Burning boat turns left/down while purple racers continue on right.')],
 'A06':[(53940,53973,'readable small group','Three magenta rows and contrasting cyan row with bubble.'),(53973,54012,'population reveal','Bubble goes; array expands, new icons enter as original group is rescaled/repositioned.'),(54012,54060,'large-group hold','Expanded population retains cyan minority contrast.')],
}

PAGE_NOTES={
 AI:[
 'July/date and glowing doorway; agents in dark environments; interfaces and eye-like symbolic characters; furnished-room setup/result occurs inside a long proposal.',
 'Race finish and scoreboard; course with reward coins and burning green boat; later bulb, branching symbols, server racks and agent grid. Several proposals span multiple ideas.',
 'Large haloed agent, branching assignments, network routes, green/cyan interface planes, library and laptop imagery. Contrast separates agent icons from dark fields.',
 'Confinement cube, maze/abort imagery, clustered agents, text quote, agent faces, network and large yellow face. Proposal031 is exceptionally broad.',
 'Network enclosure and red maze; collage of source screenshots; interconnected document/server nodes; stage/public-ranking imagery; subdued human question scene.',
 'Stacks of paper/documents; agent/maze icons; connected labels; world/network metaphor; laptop, red point and production-art montage.',
 'Bright studio birds and luminous object; live-action artbook/calendar/product shots; final support/end card. Keep promotional live action separate from illustration rules.'
 ],
 TREES:[
 'Foreground forest opening; silhouettes/vertical green transition; contrasting desert/snow/lush habitats; bird branch and underground roots.',
 'Chapter title; aquatic/shoreline plant ancestry; night/rain variation; sparse land; close low-angle plant; cell-wall cellulose diagram.',
 'Early plants, lignin/cellulose diagram, sparse landscape and named plant comparisons; forest cutaway and scale/height chart.',
 'Wet stream environment, tree close-up, map/comparison tree, landscape and chapter; trunk/cross-section/cell structure.',
 'Tube/cell types, changing land/tree examples, bright particles and transport paths, root/leaf imagery; fast blurred change produces a four-frame false split.',
 'City/tree metaphor, water apparatus and molecular diagrams, canopy from below, wood cross section and cell bundles; phloem section/reading holds.',
 'Internal tissue routes, parenchyma examples, winter tree, multicolor cross sections, bark, carving damage, clear-cutting contrast.',
 'Treehouse/pastoral forest; split habitat comparison; fire; evergreen forest; seedling/forest; labeled tree parts; upward canopy and roots.',
 'Concluding forest and birds; transition into live-action wildlife/restoration, aerial before/after and rapid testimonial faces.',
 'Rapid live-action portrait montage with numeric overlays. These cuts do not define character animation timing.',
 'More testimonial faces; website; dry landscape and restoration footage; declining ground texture.',
 'Live-action roots, cracked ground, seedlings and restoration work; product imagery. Separate measured real motion from animation construction.',
 'Animated merchandise/birds, phone message and forest; sponsor/support end material.'
 ],
 HISTORY:[
 'Long opening spans night/social/settlement imagery; timeline, map, land, seedlings; human entering light; early live-action product insert.',
 'Product shots then night chapter; geographic map, settlement at sunset, two burdened people and close crop of them.',
 'Settlement interiors/social work, ropes/structure close-up, hand/food preparation, grain planting, harvest field, fire/interior and location map.',
 'Settlement growth/comparison, split-screen people, subsistence diagram, hand/object, map and social fire circle; settlement cutaway and symbolic windows.',
 'Food/body health comparison, paired people, skulls and war chapter; buildings, flexed arm, crossed tools, settlement overhead and violence/labor.',
 'Person/ground detail, settlement construction, symbolic light, farming spread map, wide landscape, apocalypse chapter, ice map and ocean.',
 'Extreme weather, skeletal aftermath, failing grain strip, distressed people, settlement variants, desert-to-coast, river map, land profile and grain harvest.',
 'End-of-era chapter, population/settlement profile, distribution map, detailed settlement, early innovations, city, tablet and hands.',
 'Inscribed symbol on clay, harvest/land/settlement callbacks, product presenter and artwork/calendar montage; very short flash transition is not a whole narrative shot.',
 'Live-action calendar/products, art display and drawing process. Do not average their texture/lighting into the illustrated world.',
 'Artbook product views, page turns and office/studio live action.',
 'Digital drawing, animation curves, studio staff, animation montage, product and support end card.'
 ],
 ROOTS:[
 'Tall tree scale hook, upward view, growth comparison, roots/rock, title, life categories, city and early-cell diagram.',
 'Named early plants, biomass chart, insect/bird/fox chain, forests, wood volume/cross-section and crown/branch.',
 'Tree particle field, leaf close-up, human-skin vs leaf, exploded leaf block, stomata, root overview, leaf droplets and spiral tree graphic.',
 'Forest-to-dry-land contrast, photosynthesis title, leaf/star/planet, tree with human/callout, stomata and water/root tip diagrams.',
 'Coast/algae, root chapter, rain/stream, root-depth comparison, forest underground, drought tree and cellular/mineral section.',
 'Root tip close section, branching network, root/rock interaction, fungus network, tree/root cross-sections and relationship diagram.',
 'Dense canopy, branch, upward tree, forest/root callbacks, birds in lab/classroom; sponsor educational diagram.',
 'Sponsor learning icons, white circuit/graph examples, subscription card and final support/end screen.'
 ],
 HALF:[
 'Bird watching laptop and phone; green image swarm/messages; human creator with diminishing core; platform/icon comparisons and phone viewer.',
 'Human social/web network, held luminous object, warm busy studio, expressive bird close-up, workstation and balloon; live-action mug/artbook begins.',
 'Live-action apparel, flags, figurines, booklet, drawer, poster and calendar product montage.',
 'Calendar, falling materials pile, birds in studio, live presenter and product interiors.',
 'Office, digital painting, graph curves, staff at artwork screens, calendar and printed artwork.',
 'Printed artwork, illustrated environment and circular motif, then product/support/end card.'
 ]}


def make_case(item,manifest):
    cid,vid,name,purpose,attention,chars,props,bg,observations,limitations=item
    epath=ROOT/'analysis/keyframes'/vid/name/'evidence.json';e=json.loads(epath.read_text())
    start,end=e['start_frame'],e['end_frame'];single=end-start==1
    with gzip.open(ROOT/'analysis/video-reports'/vid/'frame-index.jsonl.gz','rt') as stream:
        pts={r['frame_index']:r['pts_seconds'] for r in map(json.loads,stream) if start<=r['frame_index']<=end}
    def element(pair):return {'object_id':pair[0],'description':pair[1],'visibility':'visible','bounds_normalized_xyxy':None,'bounds_at_frame':None}
    elements=[element(x) for x in chars+props]
    events=[] if single else [{'object_ids':[x[0] for x in chars+props],'start_frame':start,'end_frame':end,
        'purpose':purpose,'basis':'direct_observation','confidence':.85,
        'phases':[{'start_frame':a,'end_frame':b,'phase':phase,'pose_or_state':state} for a,b,phase,state in PHASES.get(cid,[(start,end,'observed interval',' '.join(observations))])],
        'pivot_estimate':None,'interpolation_hypothesis':None,'path_hypothesis':None,
        'limitations':limitations}]
    # Evidence references tracked sheets and actual PTS. Bulk PNGs are regenerable.
    evidence=[]
    for i in sorted(set([0,len(e['sampled_frames'])//2,len(e['sampled_frames'])-1])):
        sample=e['sampled_frames'][i]
        evidence.append({'frame_index':sample['frame_index'],'pts_seconds':sample['pts_seconds'],
             'file':e['sheets'][min(i//24,len(e['sheets'])-1)],'native_png_regenerable':sample['png']})
    row={'video_id':vid,'shot_id':'case_'+cid,'case_id':cid,'case_name':name,
      'source_sha256':manifest[vid]['source_sha256'],'start_frame':start,'end_frame':end,'end_frame_exclusive':True,
      'start_pts_seconds':pts[start],'end_pts_seconds':pts.get(end,end/60),'fps':60,
      'review_scope':'selected_native_still' if single else 'consecutive_frame_case_window',
      'not_a_complete_verified_shot':True,'boundary_review_status':'needs_refinement',
      'narrative_purpose':purpose,'narrative_purpose_basis':'inferred_from_visual_event_and_coarse_unverified_ASR_context',
      'composition':{'attention_order':attention,'subject_layout':elements,
         'negative_space':bg,'depth_order':['background field','scene props / explanatory structure','actor or focal interaction where present'],
         'depth_order_basis':'broad observed overlap; per-object hidden ordering not recovered'},
      'characters':[element(x) for x in chars],'objects':[element(x) for x in props],
      'background_layers':[{'object_id':cid.lower()+'.background','description':bg,'visibility':'visible'}],
      'motion_events':events,'camera_animation':[{'statement':'Camera motion is not uniquely separated from artwork/layer motion in this case.',
         'basis':'inferred','confidence':.9,'evidence_frame_range':[start,end],'limitations':limitations}],
      'transitions':[{'statement':'Case window is internal to a larger sequence. Incoming/outgoing complete-shot relationship needs boundary refinement.',
         'basis':'direct_observation','confidence':.9,'evidence_frame_range':[start,end]}],
      'visual_style_notes':[{'statement':s,'basis':'inferred' if 'ASR' in s else 'direct_observation','confidence':.85,'evidence_frame_range':[start,end]} for s in observations],
      'evidence_frames':evidence,'evidence_manifest':str(epath.relative_to(ROOT)),
      'source_technique_inference_limitations':limitations,'reviewed_consecutive_sheets':e['sheets'],
      'audio_review':'No direct audition. ASR is unverified coarse context, not exact word or isolated-SFX timing.'}
    if cid=='F01':row['measurement_files']=['analysis/motion-tracks/reference_46db30e386c9/forest-registered-layer-comparison.json']
    if cid=='C01':row['measurement_files']=['analysis/motion-tracks/reference_fd02030ee890/creator-core-and-hand.json','analysis/motion-tracks/reference_fd02030ee890/creator-eye-mask.json','analysis/composition-diagrams/creator-face-geometry.json']
    if cid=='A04':row['measurement_files']=['analysis/motion-tracks/reference_9a02fcef71d3/boat-lime-hull-mask.json']
    # Three single-frame design cases have no motion review despite the common field name.
    if single:row['reviewed_consecutive_sheets']=e['sheets'];row['motion_events']=[]
    return row


if __name__=='__main__':
    manifest={r['video_id']:r for r in json.loads((ROOT/'references/manifest.json').read_text())['videos']}
    cases=[make_case(c,manifest) for c in CASES]
    out=ROOT/'analysis/reviewed-cases';out.mkdir(parents=True,exist_ok=True)
    for row in cases:write_json(out/(row['case_id']+'.json'),row)
    write_json(out/'index.json',{'scope':'19 selected native evidence cases; 16 temporal windows and3 construction stills. No archive-wide semantic completion claimed.',
        'cases':[{'case_id':r['case_id'],'video_id':r['video_id'],'name':r['case_name'],'start_frame':r['start_frame'],'end_frame':r['end_frame'],'file':str((out/(r['case_id']+'.json')).relative_to(ROOT))} for r in cases]})
    navigation=[]
    for vid,notes in PAGE_NOTES.items():
        timeline=json.loads((ROOT/'analysis/shot-timelines'/f'{vid}.json').read_text())
        assert len(notes)==(len(timeline['shots'])+7)//8
        pages=[]
        for i,note in enumerate(notes):
            group=timeline['shots'][i*8:i*8+8]
            pages.append({'page':i+1,'file':f'analysis/keyframes/{vid}/storyboard-{i+1:03}.jpg',
                 'proposal_ids':[r['shot_id'] for r in group],
                 'reviewed_frame_indices':[e['frame_index'] for r in group for e in r['evidence_frames']],
                 'observations':note,'scope':'first/middle/last navigation review; intermediate motion not certified'})
        navigation.append({'video_id':vid,'pages':pages})
    write_json(ROOT/'analysis/storyboard-navigation-review.json',{
        'reviewed_pages':46,'proposal_navigation_frames_reviewed':1065,
        'verified_shot_count':None,'status':'all_storyboard_pages_visually_navigated_temporal_semantics_incomplete','videos':navigation})
    print('Saved19 authored cases and46 page-specific navigation reviews;355 proposal boundaries remain provisional.')

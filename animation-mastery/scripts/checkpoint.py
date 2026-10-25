"""Write a precise research checkpoint and per-video navigation/case reports.

This does not certify artistic quality or turn proposals into verified shots.
"""
import json
from pathlib import Path
from common import ROOT,REPO,digest,write_json

PROFILES={
 'reference_9a02fcef71d3':{
  'family':'Technical/symbolic agency and incentive failures; dark interfaces and luminous agents.',
  'characters':'One-eyed symbolic agents in varied silhouettes/colors; humans at laptop; small humans in room/stage scenes; birds in production/end material. Unique recurring-character counts are not yet established.',
  'environments':'Dark circuit fields, server racks, isometric room, top-down racing course, maze/enclosure/network metaphors, stage and production studio.',
  'story':'Navigation and unverified ASR establish a progression through AI capabilities/goals, reward mistakes, networked agents and consequences, followed by art/product material. This is source narrative context, not an endorsement or independent fact-check of its claims.',
  'differences':'Green/cyan routes against navy and magenta agent populations dominate many technical scenes. The bright orange room and pale scoreboard are deliberate contextual departures. Do not force a single ominous treatment on all scenes.',
  'next':'Refine exceptionally broad proposals013/014/031; track the full206–220s boat loop natively; measure room removals per object; inspect source audio through actual listening.'},
 'reference_46db30e386c9':{
  'family':'Botanical history and tissue mechanics; rich landscapes alternate with spare diagrams.',
  'characters':'Birds, occasional scale humans and contextual animals; many shots have no human. Plants/cells are explanatory subjects rather than all anthropomorphic characters. Unique identities/counts remain unverified.',
  'environments':'Layered evergreen/lush/desert/snow forests, streams and canopy views; violet cell/tube/cross-section diagrams; city/tree metaphor; live-action restoration/product sections.',
  'story':'Navigation moves from tree diversity and plant ancestry to structural/transport tissues, bark/damage and the role of trees, then restoration/sponsor/product material. Exact spoken statements remain unverified ASR.',
  'differences':'Natural scenes use depth, varied silhouettes and warm openings; cell diagrams reduce scenery and repeat readable structures. Rapid live-action testimonial cuts are not animation timing templates.',
  'next':'Split internal concept changes inside long proposals; reject the four-frame blur false split around17987; investigate transport, carving and weather actions in native sequences beyond the current radial/hold/forest cases.'},
 'reference_3dab4435d188':{
  'family':'Human history, social scenes, maps and settlements; warmer pastoral and architectural palettes.',
  'characters':'Many humans with varied clothing, hair, beards, proportions and action poses; small human groups; birds in end material. Unique people and identity recurrence are not exhaustively counted.',
  'environments':'Harvest fields, village interiors, social fire circles, settlement cutaways, maps, timelines, climate/ice/ocean scenes and live-action artwork/studio inserts.',
  'story':'Navigation/ASR organize a prehistoric-to-civilization argument through cultivation, settlements, social change, conflict, climate and early recorded names, with calendar/art material. Source factual claims are not independently verified here.',
  'differences':'D01 shows long-legged human construction, warm crops/cyan clothing and basket overlaps, unlike the large close-up creator C01. Social fire scenes use warm center/dim perimeter. Maps and simple land profiles deliberately reduce environmental detail.',
  'next':'Refine the81-second opening proposal and later multi-concept ranges; crop native walk/harvest/rope actions; export911–914s hand-surface transformation rather than claiming a completed release; build original close-up locomotion/hand tests.'},
 'reference_2e586456bc4d':{
  'family':'Tree growth and material/biological mechanisms; scale changes from forest to leaf/root systems.',
  'characters':'Bird/animal chains, occasional scale people and lab/classroom birds; roots/cells/trees as main explanatory elements. Counts and recurring identities remain unverified.',
  'environments':'Tall-tree forests, canopy, leaf sections/stomata, underground soil/rock/fungal networks, simplified comparison fields and educational sponsor interfaces.',
  'story':'Navigation moves from a scale/growth question through plant/leaf structure and photosynthesis into roots, minerals and underground relationships, then learning/sponsor material. Specific narration is coarse ASR until checked.',
  'differences':'Warm active roots/particles oppose cool rock/soil. Oblique leaf layers use strong color coding and transparent overlays. Sparse taxonomy/comparison diagrams are a different density regime from full forest illustration.',
  'next':'Refine broad root-tip/network proposals041–043 and leaf proposal019; distinguish source root fracture/mineral mechanism from our original detour; measure actual object/camera contributions over larger native windows.'},
 'reference_fd02030ee890':{
  'family':'AI/creativity, audience attention and human-made artwork; intimate acting plus busy studio/product imagery.',
  'characters':'Seated magenta viewer bird, cyan-shirt violet-haired creator, additional humans in social/studio illustrations, birds and live-action presenters. Exact recurring-character count not established.',
  'environments':'Dark viewer room, message/image/platform fields, luminous creator space, warm dense studio, falling-material stage, printed art and live-action production/product footage.',
  'story':'Navigation/ASR contrasts AI-filled attention with human creative work and support for making art. The diminishing creator core gives a personal emotional beat; later material accumulation and studio/product sequences show production. No claim of exhaustive spoken fact verification.',
  'differences':'C01 has clean filled facial planes and coordinated light/hand response; D03 uses species-specific rounded bird construction. Warm studio density differs from the minimal dark pile stage. Live-action product footage must stay separate in the style taxonomy.',
  'next':'Refine proposal007 and later mixed animation/live-action ranges; examine phone/wing interaction, balloon and studio transformations in native temporal detail; compare more human expressions/angles before universalizing C01.'}
}


if __name__=='__main__':
    manifest=json.loads((ROOT/'references/manifest.json').read_text())
    cases=[json.loads(p.read_text()) for p in sorted((ROOT/'analysis/reviewed-cases').glob('*.json')) if p.name!='index.json']
    nav=json.loads((ROOT/'analysis/storyboard-navigation-review.json').read_text())
    nav_by={r['video_id']:r for r in nav['videos']}
    coverage=[]
    for row in manifest['videos']:
        vid=row['video_id'];profile=PROFILES[vid];selected=[c for c in cases if c['video_id']==vid]
        timeline=json.loads((ROOT/'analysis/shot-timelines'/f'{vid}.json').read_text())
        lines=[f"# {row['title']}",'',
          '**Scope:** full metadata/every-frame measurement, all proposal navigation triplets, and selected native cases. Exhaustive verified-shot semantics are still incomplete.','',
          '| Metadata | Value |','|---|---|',f"| Video ID | `{vid}` |",f"| SHA256 | `{row['source_sha256']}` |",
          f"| Source | `{row['local_path']}` |",f"| Container duration | {row['container_duration_seconds']:.6f}s |",
          f"| Picture endpoint | {row['decoded_picture_end_seconds']:.6f}s |",f"| Native picture | {row['width']}×{row['height']},16:9,60fps,AV1 |",
          f"| Decoded frames | {row['decoded_frame_count']:,} |",f"| Automated proposals | {len(timeline['shots'])}; not a verified scene count |",
          '| Sound | Stereo AAC44.1kHz; complete coarse offline ASR; no direct listening/separation |','',
          '## Visual family and meaningful differences','',profile['family'],'',profile['differences'],'',
          '**Medium:** clean filled, vector-like illustrated shapes with selective planes, texture and glow. The delivered movie is flattened; original authoring software/rig is not proven.','',
          '**Characters:** '+profile['characters'],'','**Environments/objects:** '+profile['environments'],'',
          '## Narrative and visual progression','',profile['story'],'',
          'The following page notes are actual inspected first/middle/last navigation, not a claim that all intervening animation has been interpreted.','',
          '| Proposal group / source interval | Inspected navigation observations |','|---|---|']
        for page in nav_by[vid]['pages']:
            group=timeline['shots'][(page['page']-1)*8:page['page']*8]
            a,b=group[0]['start_pts_seconds'],group[-1]['end_pts_seconds']
            lines.append(f"| [Page{page['page']}](../../keyframes/{vid}/storyboard-{page['page']:03}.jpg), {group[0]['shot_id']}–{group[-1]['shot_id']}, {a:.3f}–{b:.3f}s | {page['observations']} |")
        lines+=['','## Native temporal/construction cases','','| Case / exact source frames | Narrative purpose and evidence |','|---|---|']
        for c in selected:
            lines.append(f"| [{c['case_id']}](../../reviewed-cases/{c['case_id']}.json) / [{c['start_frame']},{c['end_frame']}) / {c['start_pts_seconds']:.3f}–{c['end_pts_seconds']:.3f}s | {c['narrative_purpose']} [Evidence](../../../{c['evidence_manifest']}) |")
        lines+=['','## Motion, camera, transitions and audio limits','',
          'The case JSON distinguishes observed motion, image measurements, inferred meaning and unresolved source construction. Stable semantic IDs are assigned only to identified case elements. Global affine fits and sparse flow features are not camera/rig diagnoses. Proposal durations are not editing-rhythm statistics: proposals can combine several shots or split one blur. Native action/contact sequences and their measured spacing are the basis for the timing guide.','',
          'Typography includes informational labels, speech/interfaces, chapter material and end cards in context. This does not override the user’s no-title rule for our originals.','',
          'Complete soundtrack ASR is retained with model/source hashes and25-second chunk times. It can mishear names and words, does not isolate music/effects, and is not exact word alignment. No perceptual sound design or audio-to-motion onset analysis has been certified.','',
          '## Next evidence to collect','',profile['next'],'']
        (ROOT/'analysis/video-reports'/vid/'VISUAL_REPORT.md').write_text('\n'.join(lines))
        ranges=sorted((c['start_frame'],c['end_frame']) for c in selected if c['review_scope']=='consecutive_frame_case_window')
        missing=[];cursor=0
        for a,b in ranges:
            if cursor<a:missing.append([cursor,a])
            cursor=max(cursor,b)
        if cursor<row['decoded_frame_count']:missing.append([cursor,row['decoded_frame_count']])
        coverage.append({'video_id':vid,'frames_measured':row['decoded_frame_count'],
          'proposal_boundaries_requiring_refinement':len(timeline['shots']),
          'verified_complete_shots':0,'selected_temporal_windows':ranges,
          'frames_outside_selected_temporal_windows':missing,
          'construction_still_frames':[c['start_frame'] for c in selected if c['review_scope']=='selected_native_still'],
          'next_case_targets':profile['next']})

    delivery_path=ROOT/'validation/quality-audits/delivery.json';delivery=json.loads(delivery_path.read_text())
    visual=json.loads((ROOT/'validation/quality-audits/visual-review-record.json').read_text())
    for movie in delivery['original_studies']:
        assert digest(REPO/movie['file'])==movie['sha256'],'Movie changed since visual inspection'
        assert visual['movie_hashes'].get(movie['file'])==movie['sha256'],'New movie requires a new actual visual inspection record'
        movie['visual_review']='encoded_phase_board_inspected; acting also consecutive23–46 and native arm/neck crop'
    delivery['status']='technical_checks_passed_encoded_visual_evidence_inspected_user_approval_pending'
    delivery['visual_audit']='validation/quality-audits/visual-audit.md'
    delivery['artistic_equivalence']='not_claimed'
    write_json(delivery_path,delivery)
    progress=json.loads((ROOT/'progress.json').read_text())
    progress.update(project_status='research_and_original_engine_checkpoint_v1_not_exhaustive',mastery_claimed=False,
       reviewed_storyboard_pages=46,selected_native_cases=19,selected_temporal_cases=16,
       selected_temporal_window_frames=sum(b-a for r in coverage for a,b in r['selected_temporal_windows']),
       verified_complete_shots=0,total_provisional_shot_proposals=355,
       total_unreviewed_shot_proposals=355,
       original_rendered_tests=[r['file'] for r in delivery['original_studies']],
       technical_validation='passed; see delivery, engine-geometry, pixel-determinism and pipeline audits',
       visual_validation='encoded evidence inspected; revisions recorded; user artistic approval pending',
       audio_validation='metadata/ASR/source provenance/decode/levels only; no direct audition')
    progress['stages']={
      '1_reference_acquisition_and_inventory':'complete_all_five_sources_preserved',
      '2_frame_and_shot_analysis':'every_frame_measured_all_navigation_pages_viewed19_native_cases_full_shot_review_incomplete',
      '3_cross_reference_research':'evidence_backed_selected_case_comparison_complete_for_v1_not_exhaustive',
      '4_knowledge_extraction':'12_substantive_guides_plus_evidence_index_with_scope_limits',
      '5_reusable_architecture':'working_hybrid_Remotion_engine_and_registered_assets_limited_pose_library',
      '6_practical_validation':'four_original_MP4_tests_rendered_inspected_revised_technical_pass_no_mastery_claim',
      '7_final_documentation':'checkpoint_guides_reports_audit_remaining_intervals_saved'}
    write_json(ROOT/'progress.json',progress)
    write_json(ROOT/'remaining-work.json',{
      'status':'checkpoint_v1; original full-scope request remains incomplete',
      'source_scope':'Only the five actual video-samples.zip members. Earlier eight uploads remain a separate collection.',
      'mastery_claimed':False,'blocking_source_access':None,
      'completed':['Public archive download/hash/safe extraction','All five inventories and236097 frame/PTS measurements','46 storyboard pages visually navigated','19 native evidence cases:16 temporal windows plus3 construction stills','12 practical evidence-backed guides and five specific video reports','Hybrid Remotion engine, preserved approved original artwork','Four rendered original studies, inspected encoded evidence, corrected concrete failures','Source/audio provenance and technical/geometry/pixel determinism checks'],
      'not_completed':['Exhaustive verified-shot boundaries and semantic interpretation for every source shot','Complete object/character counts and persistent identities across the archive','Per-shot source narration/music/SFX listening relationships and exact word alignment','Full source action library including close-up locomotion, running, turns, jumps, hand/grip/foot variants and shared-object release','Across-angle new-character construction and consistency','Rendered proof of every helper/technique class; current morph/IK helpers are tested but not a complete performance library','Independent animation of every painted background object','Audience silent-comprehension tests and user artistic approval','Source-level artistic equivalence or mastery'],
      'resume_order':['Read AGENTS, README, evidence index, progress and this manifest. Do not reacquire/redecode intact checked sources.','Refine conservative proposals in a separate verified-boundary layer; broad ranges and false blur splits are documented.','Continue native temporal/semantic review outside the listed selected windows, preserving observation vs inference and actual PTS.','Prioritize close-up walk/harvest/hand action and additional environment/diagram transitions. Use existing case-plan as evidence locator, not as completed analysis.','Obtain actual source/final audio audition through an audio-capable review workflow. Do not label ASR/level metrics a listening pass.','Author missing poses/angles/hand/foot assets; render targeted original tests, inspect and revise before another full production.'],
      'precise_per_video_coverage':coverage,
      'coverage_notice':'1776 selected consecutive source frames (29.6s) are detailed temporal case coverage, not a percent-complete semantic-shot claim. All236097 frames have automated measurements; navigation covers entire videos.',
      'computational_scope':'Persistent checkpoint for a65.6-minute,236097-frame corpus. Exhaustive perceptual interpretation and the expanded action library require further review/render iterations; no completion is inferred from pipeline execution.',
      'remote_delivery':'See delivery.json and repository commit; push and verify before sharing download links.'})
    print('Saved five specific reports, current delivery review status and exact per-video remaining intervals.')

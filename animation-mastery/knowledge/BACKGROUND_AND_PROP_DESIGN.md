# Environments, props and diagrams

Evidence: [F01, D01–D03, R01, L01, G01, H01, P01, A02, A05](EVIDENCE_INDEX.md). Backgrounds change their role with the explanation. A forest establishing image and a cellular reading hold should not have identical density or motion.

## Environment construction

F01 uses dark overlapping evergreen silhouettes to crop the foreground. Warm negative space opens toward a winding path and a central broad tree; small rear foliage continues the environment. Curved leaf masses have broad scalloped/tapered edges and restrained interior planes. Depth comes from overlap, relative scale, contrast and unequal image motion. A texture-only background slide cannot reproduce that reveal.

D01 divides a pastoral scene into light sky/hills, a broad field, a darker crop patch and foreground people/props. Hills are rounded blue/teal silhouettes, rocks have a few broad planes and horizontal internal marks, crops repeat warm mounds with curving green leaves. The repeated masses give context while basket, hands and faces stay readable. D02 provides the opposite density/contrast choice: a dark circuit wall is present but suppressed, and luminous people/device take over the visual hierarchy.

R01's dark granular soil supports large cool faceted rocks. Root contours are warm, layered and continuous, with small warm particles making an interaction legible. Rocks are not shaded photorealistically: large planes, selected edge bands and elongated interior marks supply material/depth. Do not scatter high-contrast noise uniformly over the subject. Keep material texture lower in contrast and smaller in scale than the explanation.

## Props that communicate function

P01's devices use consistent layered bodies/screens, bright screen rectangles and selected small content marks. Their tilted rectangles retain thickness/edge separation through descent and overlap. Paper sheets are thinner and have separate rotation/entry times. The blue ground oval anchors an otherwise floating pile. The pile's dense overlap communicates accumulation; making all items orbit would tell a different story.

D03's laptop uses rounded slabs, a darker screen border, sparse keyboard marks and a visibly hinged view. Chair arms/buttons and table/mug are simplified but spatially coherent. D01's basket wraps around the body/arms with broad orange rib bands and a dark contents opening. In T01 a few inscription cells make a tablet read as recorded information without drawing tiny illegible text everywhere.

L01's leaf is an oblique section with clearly separated green/yellow upper cells and violet lower layers. Transparent white-edged plate, droplets and amber ray each encode a different role. H01 simplifies further into repeated hollow cells against a soft dark field. This is an intentional reading hold, not an empty scene that needs decorative movement. G01 animates radial structure with outward arrows and boundary cells. Diagram detail should explain relationships, not imitate an interface with arbitrary labels.

## Original reusable assets

[TerraceLayers.tsx](../assets/environments/TerraceLayers.tsx) retains the approved terrace plate and adds separately animated cloth, foreground sprigs, light and shadow. Some painted background material remains static. Do not claim every branch/cloud is independently rigged. Cloth is anchored over the actual right window; this was corrected after an early render placed it on an unmotivated wall area.

[GardenPlant.tsx](../assets/props/GardenPlant.tsx) has a connected stem, individually offset leaves/veins, a bud and overlapping rounded petals. `plantLeafTip` exposes geometry for the transition carrier. The earlier star-shaped bloom was replaced after visual review. RootWorld supplies a connected tapered root, faceted rock, a water destination, surface sprout and restrained soil details. The initial seeded random generator clustered all rocks and left the ground empty; the corrected deterministic avalanche distributes29 stones and 520 subdued grains through their intended area.

These assets generalize modestly: parameterized plant state, light, cloth and explanatory paths are reusable. They are not a comprehensive furniture/machine/environment kit or proof that every newly generated background will match the approved art. New designs still require a native-size still and temporal review.

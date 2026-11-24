# Anatomy workstream report

## Result
`data/anatomy/` : `index.json` + 11 per-system files (integumentary, skeletal, muscular, nervous, cardiovascular, respiratory, digestive, urinary, endocrine, lymphatic, sensory). **122 structures, 238,390 triangles, 5.36 MB total on disk** (budget 12 MB). 118 are normal clickable structures; 4 are flagged `detail:true` heart internals (heart_valves, papillary_muscles, lv_cavity, rv_cavity) and 6 more carry `parent:"heart"` (left/right atrium, left/right ventricle, plus the 4 details); `heart` has `whole:true`.

Per-part JSON: id, name, fma, system, side (L/R/null), color, center, radius, tris, pos (flat int16), scale[3], offset[3], idx (flat uint32), exactly as specified (p = pos*scale+offset). Extra optional fields: `color`, `tris`, `parent`, `whole`, `detail`. `index.json` is an object `{format, units, up, front, left, decode, systems:[{id,name,color,count,file}], parts:[{id,name,system,side,fma,color,center,radius,tris,file,...}]}` (not a bare array, so it can carry the systems list).
Coordinates: metres, +Y up, feet at y=0, skin height 1.750 m, x/z centred, face toward +Z, body left at +X (arms hang slightly abducted, as in the source). Validation (`work/anatomy/validate.py`) reloads every file, checks index bounds and 20 anatomical checks (heart +X/anterior/y=1.33, liver -X, spleen +X, IVC -X, lungs, kidneys posterior, eyes anterior, etc.): all PASS. Preview PNGs: `work/anatomy/preview_<system>.png`, `preview_all_no_skin.png` (front + side vertex scatter; orientation confirmed upright, nose toward +Z). (`preview_probe_oa.png` is a scratch probe.)

Contents: skin (20k tris); 36 skeletal (skull, mandible, teeth, hyoid, C/T/L spine, sacrum, discs, sternum, ribs+costal cartilage L/R, clavicle, scapula, humerus, radius, ulna, hand bones, hip bone, femur, patella, tibia, fibula, foot bones L/R); 26 muscular (pectoralis major, deltoid, biceps, triceps, trapezius, sternocleidomastoid, gluteus maximus, quadriceps, hamstrings, gastrocnemius, forearm muscles, back muscles incl. latissimus, all L/R; diaphragm; abdominal wall); nervous 4 (cerebral hemispheres L/R, cerebellum, brainstem); cardiovascular 28 (heart + atria + ventricles + valves + papillary muscles + ventricle blood pools; aorta, pulmonary trunk, SVC, IVC, coronary arteries, pulmonary vessels, carotids, regional artery/vein groups); respiratory 5 (lungs L/R, trachea, bronchial tree, larynx); digestive 10 (esophagus, stomach, liver, gallbladder, pancreas, small intestine, colon, rectum, appendix, tongue); urinary 5; endocrine 3 (adrenals, pituitary); lymphatic 2 (spleen, thymus); sensory 2 (eyeballs). Count is slightly above the ~110 target because of the L/R splits.

## Sources and licences
- Direct GitHub access to BodyParts3D mirrors (Kevin-Mattheus-Moerman/BodyParts3D, olivercase/body_parts_3d_api, ...) was NOT used: the session's `add_repo` request was denied by the permission system, so I did not work around it. Z-Anatomy (LluisV/Z-Anatomy) answered `git ls-remote` but a blobless clone/API listing was gated and stalled; not pursued (it is .blend anyway).
- npm worked. Used (tarballs in `work/dl_anatomy/dagno`, `work/dl_anatomy/open-anatomy-3d`, treated as untrusted data, only parsed): `@dagno/anatomy-model@0.1.2` (gitHead d3b47239f1038041bb550a1cfb6bfe40a62c4970, sha512-OLEfqUqn...TEyYA==; 2,234 BodyParts3D 4.0 meshes + FMA concepts; main source) and `open-anatomy-3d@0.1.0` (gitHead 534c0e1c3173b91af828904b9d06fecccd55ec15; 128 pre-merged structures; used for liver, lungs, cerebrum, skin-adjacent muscle/vessel groups). Also seen, unused: `abussola-med-models`, `@somakine/bodyparts3d-musculoskeletal`.
- Licence: BodyParts3D is CC BY 4.0 per DBCLS's current terms (2025-02-27); the original OBJ headers still say CC BY-SA 2.1 JP. I documented both and recommend treating the derived meshes as share-alike (done in `assets/ATTRIBUTION.md`).

## Gaps / caveats
- No thyroid gland, spinal cord (only the 2 mm central canal exists), peripheral/limb nerves (sciatic etc.), coccyx, cerebral cortex as one surface other than the OA brain mesh, or reproductive organs used (male reproductive meshes exist in the source; omitted per brief). No true individual cranial nerve set except what is in the source (orbital nerves) - nerves system is therefore only brain parts.
- Quality: source meshes are already coarse (bones 300-1000 tris, bladder 224, esophagus 296), so bones/small organs look low-poly; vessels/muscle groups from open-anatomy-3d are pre-merged regional groups (e.g. back muscles include latissimus dorsi + erector spinae; abdominal wall includes rectus abdominis and obliques). Cerebral hemispheres were obtained by cutting the OA brain mesh at x=0 (open medial face). Ventricle L/R split is by nearest cavity (septum boundary approximate). `heart` (whole) duplicates the geometry of its parts: show either the whole or the parts.
- Normals are not stored (compute in browser). Rebuild: `python3 -I work/anatomy/build.py && python3 -I work/anatomy/export.py` (needs `node work/anatomy/node/dump.mjs` output in `work/dl_anatomy/oa_dump`).

# The woman (data/anatomy_f)

## Result
`data/anatomy_f/`: `index.json`, 11 per-system files and `ao.json`, 5,767,846 bytes in all. **180 parts** (93 shown in the whole body, 87 more in her cut-open views), 253,442 triangles (185,370 whole body + 68,072 detail). Parts per system: respiratory 25, reproductive 25, nervous 24, cardiovascular 24, skeletal 22, digestive 22, sensory 18, urinary 13, muscular 4, lymphatic 2, integumentary 1 (the skin).

Where each part's shape comes from (`src`, shown on its card as "Shape: ..."): from her sections 115; from her sections, adjusted by the atlas makers 25; another woman's brain (Allen atlas), fitted 22; sculpted reference model placed in her body 10 (the inside of each breast and the nipples); modelled to fit her body 4 (spinal discs, colon, rectum, appendix); from her sections, modelled with the guidance of oral anatomy atlases 4 (teeth, tongue, gums and palate, salivary glands).

Same per-part format as the man's (int16 `pos` with per-axis `scale`/`offset`, uint32 `idx`), plus `card` (the topic card the part opens) and `src`. Coordinates: metres, +Y up, feet at y = 0, midline (mean x of her 25 vertebrae, -8.3 mm in the source) at x = 0, skin centred front to back, +Z front, +X her left. **Not scaled**: she stands 1.658 m sole to crown in the model; her recorded height is 171.2 cm.

The index also carries `subject`, `source`, `height_m`; `hotspots` (organ-view markers measured on her parts: heart 12, eyes 7 each, brain 12, kidneys 3 each, right lung 1, uterus 8, breast 5); `organ_views` (uterus with tubes, ovaries and ligaments; left breast); `regions` (a region code per skin vertex and the torso band heights, tools/anatomy/female/regions_f.py); `absent` (the man's parts her atlas has no counterpart for, found by name in both source trees): skull, mandible, hyoid, ribs, clavicle, scapula, humerus, radius, ulna, hand and foot bones, the named arm, shoulder, back, hip and calf muscles, diaphragm, abdominal muscles, oesophagus, stomach, adrenal glands, pituitary.

## Sources and licence
- Human Reference Atlas (HuBMAP), K. Browne and H. Schlehlein: 3D Reference Organ Set for Female v1.10 (https://doi.org/10.48539/HBM637.DWBM.744) and Pelvis, Female v1.3 (https://doi.org/10.48539/HBM853.VCFM.778), CC BY 4.0, made from the U.S. National Library of Medicine's Visible Human Female (59 years old). Brain: Allen human brain reference atlas (Ding et al. 2016) as fitted by the atlas makers.
- Files pinned by SHA-256 in tools/anatomy/female/fetch.sh; credit and changes in assets/ATTRIBUTION.md, in a section of its own (her data is CC BY 4.0, the man's share-alike).
- Downloads were treated as untrusted data: fetched into a work folder outside the repository and parsed only by our own scripts, run with `python -I`.

## Build
`WORK=work/anatomy_f sh tools/anatomy/female/fetch.sh`, `python -I tools/anatomy/female/build_f.py --work work/anatomy_f`, `node tools/anatomy/bake_ao.mjs data/anatomy_f`. Previews: `python tools/anatomy/female/preview_f.py data/anatomy_f OUT`. The part table is tools/anatomy/female/parts_f.tsv. The build asserts the sides (the heart's left ventricle to her left of the right atrium; kidneys, breasts and ovaries by position; nipples in front) and logs every pair the source names the other way round (142, nearly all Allen brain regions, plus the round ligaments); sides are taken from position.

## Gaps and caveats
- Her atlas has no skull, ribs, shoulder, arm, hand or foot bones, almost no muscles, no stomach, oesophagus or diaphragm, and no vessels of the head and limbs. Nothing is borrowed from the man; the cards say "Not in her model" and offer his.
- Not her own tissue: the inside of each breast (sculpted), the brain (another woman's), the spinal discs (modelled). The large intestine (colon, rectum, appendix: modelled) follows her bowel only roughly; the atlas makers adjusted her skin to fit the organs. All of this is on her model note and the part cards.
- Her eyes are closed in the data and shown closed; the data has no hair or fingernails (the realistic look colours the scalp by rule, draws a lash line where the lids meet, and lays fingernails on her fingers by the man's rule: see below). The man's detailed skin (skin_hd.bin) and park shadow have no counterpart for her.
- No source consulted gives her menopause status. Her reproductive cards say she was 59, that the data does not say whether she had been through menopause, and what changes after it (see below).
- The unclothed woman should be reviewed by the site's owner before the site goes public.
- Phase 2 (her leg and hip muscles from other segmentations of the same woman) is not done.

## After the referee and the critique

An anatomist refereed her cards and notes (15 findings), and an illustrator went through the pictures (18 defects, 5 of 10). Every finding was checked against a source opened for this pass, and every defect against new pictures.

### Data
- **Skin.** Before, the skin was reduced as one mesh to 22,000 triangles. That left about 1,900 triangles for her whole head (a mask) and fused her fingers into mittens. Now the skin is welded and reduced region by region, with each region's open edges kept: head 9,000 triangles, hands 6,000, feet 3,000, the rest 20,000 (tools/anatomy/female/build_f.py, `decimate_skin`). Her face now has its closed eyes, nose and lips, and her fingers are separate.
- **Bronchi.** The bronchi went from 3,500 to 10,000 triangles, cleaned before reduction, so the airway tree is no longer shredded.
- **Part names.**
  - The source's "segmennt" spelling is fixed.
  - Each lung segment now names its lobe, e.g. "Superior segment (right lower lobe)", "Lateral segment (right middle lobe)", and "Apical part of the apicoposterior segment (left upper lobe)".
  - Each of the ten liver pieces carries its Couinaud number, assigned from where the piece lies in her liver: II, III, IVa, IVb, the quadrate lobe as the underside of IV, V to VIII, and the caudate lobe as I. This assignment by position is our own; the atlas gives only the descriptive names.
- **Measured sizes.** `index.json` gains `measured`: her uterus, her uterus with the cervix, and each ovary, measured along the part's own principal axes.
  - Uterus body: 5.2 × 4.3 × 2.4 cm.
  - Uterus with cervix: 6.3 cm long.
  - Ovaries: 2.5 × 1.0 × 0.8 cm and 2.6 × 1.0 × 0.8 cm.
- **Fingernails.** New file data/anatomy_f/nails.json (61 kB), made by tools/anatomy/female/nails_f.py.
  - It uses the man's rule (skin_hd.py `nail_plate`), but finds the fingertips without hand bones, since her model has none.
  - Each nail is 9 to 13 mm wide.
  - Her coarse finger skin cuts through a plate laid 0.35 mm over it, so the plate is laid 0.7 mm higher.
  - One row of the left little finger's plate had no skin under it; it takes the height of the nearest row.
- **Totals.** data/anatomy_f is now 6,438,627 bytes: 180 parts, 275,942 triangles (207,870 whole body + 68,072 detail), plus the nails.

### The referee's findings

| # | Finding | Verdict and source | What changed |
|---|---|---|---|
| 1 | The broad ligament called "the main support"; the suspensory ligament called part of the mesovarium | **Right.** OpenStax 27.2 says "a primary support". Wikipedia "Uterus": the uterus is held up primarily by the pelvic diaphragm, perineal body and urogenital diaphragm, then by the uterosacral, cardinal and pubocervical ligaments. Wikipedia "Suspensory ligament of ovary": a fold from the ovary to the pelvic wall carrying the ovarian vessels. Wikipedia "Cardinal ligament": it steadies the cervix and carries the uterine artery and the ureter. | The broad ligament card now says "one of the supports", corrects the suspensory ligament and the cardinal ligament, and is tagged C2. The ligaments card is also corrected. |
| 2 | Where the coronary sinus opens | **Right.** Wikipedia "Coronary sinus": between the opening of the inferior vena cava and the tricuspid valve, with a valve of its own. | Card corrected. |
| 3 | Liver: eight segments but ten pieces, with no numbers on them | **Right** (her index.json). | The card explains the ten pieces; each piece's name carries its segment number. |
| 4 | The "segmentennt" name, and segments that do not say their lobe | **Right.** | Fixed in build_f.py (regex, plus a table of names with their lobes). |
| 5 | "She gave her body" | **Right in substance.** The NLM page says the donors "willed their body to science". The HRA library page: 59, 171.2 cm, white, obese. Wikipedia "Visible Human Project": press reports of a Maryland woman who died of a heart attack. Wikipedia also says her "reproductive organs ... are not representative of those organs of normal anatomy". | The card now says "was donated", that NLM thanks her for having willed it, her age, the HRA's "obese", and the press reports (attributed as press reports), and adds the sentence on her reproductive organs. |
| 6 | Reproductive-age text on a 59-year-old | **Right.** OpenStax 27.2: menopause at an average age of 50 to 52. MSD Manual (aging of the female reproductive system): the uterus, tubes and ovaries shrink and the breasts become smaller and fattier. AAFP 2000;61:3090: vaginal pH 3.5 to 4.5, and above 5 after menopause. No source gives her menopausal status. | Her cards for uterus, endometrium, myometrium, cervix, vagina, tubes and ovaries gain a line in "In this model" (js/body_two.js `BODY_F_MENO`). The uterus and ovaries add her measured sizes and say the chart is a typical cycle, not hers. The breast cards add the change after menopause. The vagina card adds the pH after menopause, with AAFP linked. |
| 7 | The model note omits parts she has, and the atlas edits | **Right** (index.json; the HRA record quotes in plan.md). | BODY_F_NOTE is rewritten: the full list of parts, the dental-atlas refinement, the thicker optic nerves, the reshaped pancreas neck, "obese", and "no missing part is filled in from another body; the one part from someone else is her brain". |
| 8 | The mouth card implies a bony palate | **Right** ("absent" lists the skull). | The mouth card now says the bones of her palate and jaws are not in her model; the lining over them is. |
| 9 | The omentum card in the builder's voice | **Right.** | Reworded. "Thick with fat" was not added: nothing was measured that shows it. |
| 10 | The tube is "not attached" to the ovary | **Right.** Wikipedia "Fimbriae of uterine tube": the ovarian fimbria reaches the ovary. OpenStax 27.2: "close to, but not directly connected to". | The tubes card now names the ovarian fimbria and the small gap; the ampulla is the usual site of fertilization. |
| 11 | The knee's 20:1 meniscus ratio | **Partly right.** OpenStax 9.6 gives about 20 times. I found no opened source for the 2–3:1 clinical figure. | The number is dropped. The card now says the medial meniscus is injured more often and that the ratio varies between studies (C2), and names the "terrible triad". |
| 12 | Cystic duct 1 to 2 cm | **Right.** Wikipedia "Cystic duct": 2 to 4 cm (Dasgupta and Stringer 2005; Gray's), or 2 to 3 cm (Last's). | The card now says "about 2 to 4 cm (sources differ: OpenStax gives 1 to 2 cm)", tagged C2. |
| 13 | The pelvis card has no female features | **Right** (OpenStax 8.3, opened). | The pelvis card's expert text now gives the inlet shape, the subpubic angle (above 80° in women, below 70° in men), the sacrum, sciatic notch, outlet and ischial tuberosities, as overlapping averages. A facts row gives the angle. The card stays C2. The "more mobile coccyx" was **not added**: OpenStax 8.3 does not mention the coccyx, and no other source was opened. |
| 14 | ATTRIBUTION does not credit the VHP or the Allen Institute | **Right.** | Added Spitzer and Whitlock 1998 (Anat Rec 253:49–57) and Ding et al. 2016 (J Comp Neurol 524:3127–3481), the new skin reduction and triangle counts, the measured sizes and segment names, and her nails. |
| 15 | The man's source person is too vague | **Right in part.** The NICT data page: TARO, the model BodyParts3D was made from, is 172.8 cm and 65.0 kg. **His age was not found** on any page opened, so "in his twenties" is not used. | model_man now gives TARO's height and weight and says 1.75 m is a height chosen for this site. BODY_BOTH_NOTE says the same. |

The referee also noted that the release date, section count and spacing, and age were taken from search results. These were confirmed on the NLM page, which was opened this pass (released 1995; 5,189 images at 0.33 mm).

In addition, the man's nail ratio had been credited to "Park et al. 2015". It is Jung et al. 2015, Arch Plast Surg 42:753 ("Fingernail configuration"). It is corrected in skin_hd.py and ATTRIBUTION.

### The illustrator's defects
1. **[broken] Shards in Auto.**
   - Her skin is one surface. While it was see-through it was drawn double-sided in triangle order, so its far side broke through the near side.
   - Now, while her skin is see-through, only the side facing the camera is drawn (js/nodes.js).
   - With the new skin, Auto at 0.9 m now shows her skin whole.
2. **[broken] The breast cut.**
   - The view now cuts her left breast from top to bottom through the nipple and is seen from her left (`organ_views.breast`: `cut: 'sagittal'`, `cut_through: nipple_areola_l`, `dir`). The fat is drawn as a see-through wall (`shell`), so the lobes, ducts, ligaments and nipple show.
   - The flights (double-click and goToNode) turn the camera to that side.
   - The note says how the breast is cut.
3. **[wrong] Lung chart.**
   - She now has her own chart, `lung_l@woman` / `lung_r@woman`: resting level 1.8 L, total capacity 4.2 L, residual 1.1 L, from Tortora via Wikipedia "Lung volumes". It is labelled "average woman; not measured on this woman".
   - His chart is labelled as an average man's.
   - The schematic-lung note (LUNG_NOTE) is now shown only on his lungs.
4. **[wrong] Contradictory note.** Fixed (see referee finding 7). A sentence now says her shape is that of a body lying on its back, shown standing, so her back and buttocks are flattened. It does not claim she was frozen supine, because no source for that was opened.
5. **[wrong] His label over her head.** A body's name label is now hidden while the other body stands in front of it, seen from above, within 0.35 m of the line of sight (`hideFn`, js/engine.js `updateLabels`).
6. **[unequal] Illustrated skin blotches.**
   - The cause was the toon light step on her coarse skin, not ambient occlusion.
   - Her skin now has more triangles, and in the illustrated look her skin's normals are averaged with their neighbours four times (`blendNormals`).
   - Her front is now shaded smoothly.
   - From behind, the light's steps still cross her back. The man's back, seen from the same side in the same light, shows the same pattern (pictures p2/illo_back10.png and p2/illo_man_back.png), so this is the illustrated look's light, not her data.
   - Her back is flatter than his because of her supine shape, and the note says so.
7. **[unequal] Her face in the realistic look.**
   - The colours laid on the skin by rule are now set per body (`SKINRULE`): lips, brows, areolae, hairline, ears and sideburns, all measured on her skin.
   - Her lids are closed in the data, so a lash line is drawn where they meet.
   - She now has fingernails by the man's rule (see above).
   - The note states all of this, including that the nail proportions were measured on men.
8. **[unequal] Missing layers not said on the canvas.** In each view, the line under the field of view now says what her data lacks (`BODY_F_GAP` per mode, `F.gapNote`). For example: "Not in her data: skull, jaw, ribs, collarbones, shoulder blades, arm, hand and foot bones. Nothing is filled in from another body."
9. **[ugly] Omentum and breast fat.** In the Organs, Nerves and Heart & vessels views, and in Auto once it is past her skin, her omentum and breasts are drawn see-through (opacity at most 0.18; they can still be clicked). The gut, uterus, heart and lungs now show.
10. **[wrong] Uterus size and age.** Her own measured size and her age now appear in "In this model". Her uterus measures 5.2 × 4.3 × 2.4 cm along its own main axes (the critique gave 5.2 × 3.5 × 4.4 cm, measured along other axes).
11. **[broken] Phone framing.** On an upright phone, the Man and Woman landmarks fly further back (4.1–4.3 m) and aim at the body's middle (the view is already centred in the space above the sheet), so the whole person stands between the toolbar and the sheet.
12. **[ugly] Glowing palms.** In her skin zones, the light through her fingers is set to about a third of his (`fingerThin: .35`).
13. **[ugly] Shredded bronchi.** The bronchi now have more triangles and are cleaned before reduction. The cut is not capped; the note already says "the cut is drawn as the surfaces the data has".
14. **[unequal] Start card.** The start view now opens on a **People** card that introduces both of them and carries the two-bodies note (`placeAs`, shown while the camera is more than 5 m from either body; the Man and Woman landmarks, at 3 to 4.3 m, show that body's own card).
15. **[wrong] His height.** BODY_BOTH_NOTE and model_man now say that 1.75 m was chosen and that TARO is 1.73 m.
16. **[polish] Markers.** Not changed in this pass.
17. **[polish] Floating face.** Not changed in this pass. In these views the canvas line now says the skull is not in her data.
18. **[polish] Seams and outlines.** The fingers are no longer mittens. The pubic rami seams were not changed.

### Tests (second pass, both looks)
The first pass's tests were run again, against http://127.0.0.1:8193 (`.devtools/harness/core`). The illustrated look is the default page and the realistic look is `?look=2`. The machine was heavily loaded by other work during the run (load average 50 to 76), so the realistic look's waits were stretched with the harness's new `WT_SLOW=4` (`wt.py settle`).

| Test | Illustrated | Realistic |
|---|---|---|
| t_body_core, woman | 22 of 22 | 22 of 22 |
| t_body_core, man | 22 of 22 | 21 of 22 |
| t_organ_views | 22, none failed | 22, none failed |
| t_regions, woman | 58 points, no mismatch | 58 points, no mismatch |
| t_descent, woman (chest, abdomen, forearm, thigh, face) | 5 of 5 | 5 of 5 |
| t_two_bodies | 42 of 42 | 41 of 42 |

Notes on the two realistic failures and the test changes:
- **Man, t_body_core, realistic:** the double click on his skin peels a layer instead of descending. The same check fails in the same way on another branch that does not have the woman (wt/fixr-a), so it is not caused by this work.
- **t_two_bodies, realistic:** "from the start view only her skin is drawn" sees her two eyeballs. The stretched waits run past the 15 s after which her inner systems load, and in the realistic look the eyes are drawn behind the lids, as on the man.
- **Test points moved for her rebuilt skin.**
  - Her neck point moved from 1.43 m to 1.41 m: at 1.43 m a ray from the front now meets her chin.
  - Her chest point moved 1.5 cm nearer the midline: the test clicks the frontmost skin vertex within 3 cm, which on her finer skin lay on the slope of the breast, and the ray then passed beside her airway.
- **Two waits added.**
  - The start-view check in t_two_bodies now waits until both bodies are drawn.
  - The harness's screenshots allow 3 minutes.

Run in the illustrated look only:

| Test | Result |
|---|---|
| t_perf_budget | Same budget misses as the first pass (DNA and replication draw calls and triangles; the park's update time under load). Woman at 1 m: 72 draw calls, 306,970 triangles (first pass 210 and 526,795). |
| t_descent_cover | 166 of 166 starts reach quarks. |
| t_ui_clicks --all | 235 pass, 2 fail. The 2 are the same "cell" selection failures as in the first pass. |
| t_goto_all 0 6 | 0 of 22 fail. |

Console errors: none in any run. viz: `node tools/viz/validate.mjs data/viz/body.json`: 232 specs, 0 errors.

Pictures: .devtools/shots/woman/after/ (illo_*, real_*, real_phone_*) and .devtools/shots/woman/p2/ (nails, back views, Auto at 0.9 m, phone landmarks).

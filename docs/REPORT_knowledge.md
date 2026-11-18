# REPORT knowledge workstream (C: library + knowledge graph)

## Library index
- 51 OpenStax English books indexed (repos found by probing `git ls-remote` because the GitHub org API is blocked in this sandbox; 35 osbooks-* repos found/cloned under ../books). Total 5619 sections, 21011 unique terms in 27 shards (a-z, 0).
- Files: data/library/books.json, data/library/terms_<a-z|0>.json (2.6 MB total). Script: work/scripts_knowledge/index_books.py (reads slug from collection <md:slug>, base https://openstax.org/books/<slug>/pages/).
- By subject: Physics: UP1(116 sec), UP2(111 sec), UP3(87 sec), CPH(278 sec), HSP(98 sec); Astronomy: AST(185 sec); Biology: BIO(255 sec), COB(103 sec), MIC(153 sec), ANP(197 sec); Chemistry: CHE(135 sec), CAF(135 sec), ORG(337 sec); Math: CA1(51 sec), CA2(50 sec), CA3(50 sec), PRE(85 sec), CAL(68 sec), ATR(92 sec), PAL(71 sec), ELA(81 sec), INA(82 sec), CMA(117 sec), HST(92 sec), IST(93 sec), IBS(74 sec); Health: HCF(28 sec); Computing: DSC(54 sec), WSS(104 sec); Engineering: ADM(41 sec); Psychology: PSY(104 sec), LSD(99 sec); Social science: SOC(95 sec), AGV(94 sec); History: USH(169 sec), WH1(80 sec), WH2(75 sec); Economics: MAC(115 sec), MIE(96 sec); Business: FAC(100 sec), MAA(77 sec), FIN(130 sec), MKT(128 sec), MGT(131 sec), ORB(118 sec), INB(151 sec), ENT(77 sec), BLW(46 sec), BET(57 sec); Study skills: CSU(71 sec); Writing: WRG(183 sec)
- Duplicates skipped: AP variants (biology-ap-courses, college-physics-ap-courses, macro/micro AP), combined principles-economics-3e (macro+micro kept), college-algebra-corequisite, college-success-concise, preparing-for-college-success. Only the current edition exists in each repo (no 1e/2e collisions).
- Repos probed that do not exist (e.g. nursing, nutrition, hs-chemistry, hs-biology, political-science): not on GitHub under osbooks-* names I could find. The list may be incomplete for repos with unguessable names.
- Link spot-checks (WebFetch, all valid): astronomy-2e 17.2; organic-chemistry 10.2; principles-macroeconomics-3e 3.2; anatomy-and-physiology-2e 12.3; university-physics-volume-2 7.1; american-government-4e 3.1; principles-data-science 3.1; business-law-i-essentials-2e 3.1.
- Chapter-intro section number is "" in books.json (same as slim_library.py); in terms shards the intro uses the chapter number string.
- Non-OpenStax earth-science/geology/oceanography/meteorology books: SKIPPED. Web search only surfaced Pressbooks/BCcampus-hosted sites (Physical Geology, Introduction to Oceanography, etc.) with no GitHub source repo of parseable structure that I could verify, so reliable link construction and licence per page could not be guaranteed. Consequence: no Earth-science textbook in the library; Earth/atmosphere/ocean nodes reference AST 8/10 (planetary Earth), BIO 44/46 (climate, biogeochemical cycles) and CHE where relevant.

## Knowledge graph (data/knowledge/nodes.json, 309 nodes, 289 KB)
- Built from work/scripts_knowledge/kn/k0..k8_*.py (original prose) via build_nodes.py (resolves refs against books.json, validates, derives `explains` as the inverse of `emerges_from` plus declared links).
- Levels: 0:17, 1:62, 2:5, 3:6, 4:20, 5:22, 6:16, 7:49, 8:39, 9:29, 10:17, 11:11, X:16 (note: levels 2 and 3 are thin because the brief groups them; nuclear and atomic nodes beyond these also appear under 1 for fundamental theory).
- Certainty: C1 240, C2 41, C3 22, C4 6.
- Validation (all pass): unique ids; every emerges_from/explains target exists; every ref resolves to a real section in books.json; sim ids all in the SPEC list; certainty/level values valid; no isolated nodes.
- 30 nodes carry `frontier_ref`; all 23 planned ids are used and all exist in data/knowledge/frontier.json (also checked). No 2024-2026 claim is stated in node text; "frontier" arrays contain only open-problem statements with as_of "2023-12" (my verified baseline).
- 147 nodes have no `sim` link (abstract topics); the rest link to engine frames.

## Caveats
- Refs are at section granularity chosen by title keyword matching; most are accurate, a few are the nearest available section (e.g. complexity -> graph theory chapter).
- Section "ch.sec" for chapter intros is not used (refs always point to numbered sections where available).
- Some quantitative values are approximate textbook/handbook values (flagged by context with ≈); no `approx` field exists in the node schema.
- Node count is 309 (target 250-400); depth is introductory-intermediate; the brief's 10^4-10^5 node vision is not attempted.

// A domestic dog (Canis familiaris), Labrador-retriever type, adult male, about 30 kg and 57 cm at the withers.
// Procedural reconstruction from typical proportions (not a scan). Cards: data/nodes/park_dog.json, written by tools/things/content/dog_nodes.py.
import * as L from '../lib/index.mjs';
import * as D from './dog_lib.mjs';
import { skinShape, M } from './dog_rig.mjs';
import { skeleton } from './dog_skel.mjs';
import { limbBones } from './dog_limbs.mjs';
import { MUSCLES, muscleMeshes, organs, vessels, nerves } from './dog_soft.mjs';
import * as X from './dog_detail.mjs';

const bone = '#ecdfc6', cart = '#cfe0d8', blood = '#b3261e';
const SYSTEMS = [
  { id: 'coat', label: 'Coat' }, { id: 'muscles', label: 'Muscles' }, { id: 'skeleton', label: 'Skeleton' }, { id: 'organs', label: 'Organs' }, { id: 'eyes', label: 'Eyes' },
  { id: 'nervous', label: 'Nerves' }, { id: 'cord', label: 'Spinal cord' }, { id: 'vessels', label: 'Heart and vessels' },
  { id: 'd_heart', label: 'Inside the heart' }, { id: 'd_eye', label: 'Inside the eye' }, { id: 'd_nose', label: 'Inside the nose' }, { id: 'd_ear', label: 'Inside the ear' },
];
const MODES = [
  { id: 'coat', label: 'Coat', show: { coat: 1, eyes: 1 } },
  { id: 'muscles', label: 'Muscles', show: { muscles: 1, eyes: 1 } },
  { id: 'skeleton', label: 'Skeleton', show: { skeleton: 1 } },
  { id: 'organs', label: 'Organs', show: { organs: 1, eyes: 1, skeleton: .16 } },
  { id: 'nerves', label: 'Nerves', show: { nervous: 1, cord: 1, eyes: 1, skeleton: .2 } },
  { id: 'vessels', label: 'Heart and vessels', show: { vessels: 1, skeleton: .16 } },
  { id: 'cut_half', label: 'Cut in half', cut: { at: [0, .4, 0] }, hotspots: true, show: { muscles: 1, skeleton: 1, organs: 1, cord: 1, eyes: 1 }, legend: { title: 'On the cut face', items: [{ name: 'Muscle and soft tissue', color: '#a8433a', node: 'dog_muscles' }, { name: 'Bone', color: '#e8dcc0', node: 'dog_skeleton' }, { name: 'Organs', color: '#c9776e', node: 'dog_organs' }], note: 'The dog is cut along its midline: look at it from the side first, then press the button. A schematic section: the pale blue-grey is sketched, not a scan.' } },
  { id: 'cut_heart', label: 'Inside the heart', cut: { at: [.085, .36, .003] }, hotspots: true, show: { d_heart: 1 }, legend: { title: 'In the heart', items: [{ name: 'Heart muscle (myocardium)', color: '#b9524a', node: 'dog_heart' }, { name: 'Blood in the left side (oxygen-rich)', color: '#e0463c', node: 'dog_lv' }, { name: 'Blood in the right side (oxygen-poor)', color: '#4f6fb5', node: 'dog_rv' }], note: 'A simplified cut through a model heart: the wall thicknesses, the chamber shapes and the valve positions are schematic, not measured.' } },
  { id: 'cut_eye', label: 'Inside the eye', cut: { at: [.416, .634, .045] }, hotspots: true, show: { d_eye: 1 }, legend: { title: 'In the eye', items: [{ name: 'Tapetum lucidum (shiny layer)', color: '#7fb98a', node: 'dog_tapetum' }, { name: 'Retina', color: '#d99a9a', node: 'dog_retina' }, { name: 'Lens', color: '#f0dfa0', node: 'dog_lens' }, { name: 'Choroid (dark layer)', color: '#3b2f2a', node: 'dog_choroid' }], note: 'A model eye with a schematic layout. Look at the dog from the side, then press the button; the cut passes through the middle of the eye.' } },
  { id: 'cut_nose', label: 'Inside the nose', cut: { at: [0, .4, 0] }, hotspots: true, show: { skeleton: 1, organs: 1, cord: 1, d_nose: 1 }, legend: { title: 'In the nose', items: [{ name: 'Scrolls at the back: the smell lining', color: '#e3a58e', node: 'dog_turb_olf' }, { name: 'Scrolls at the front: the airway lining', color: '#d9c9ce', node: 'dog_turb_resp' }], note: 'The turbinate scrolls are drawn as a schematic: the real ones are far more finely folded and branched. Look from the side, then press the button.' } },
  { id: 'cut_ear', label: 'Inside the ear', cut: { at: [.355, .6, 0] }, hotspots: true, show: { skeleton: 1, d_ear: 1 }, legend: { title: 'In the ear', items: [{ name: 'Ear canal and eardrum', color: '#e8b3a0', node: 'dog_ear_canal' }, { name: 'Middle ear (bulla)', color: '#d8ccb0', node: 'dog_bulla' }, { name: 'Cochlea and balance canals', color: '#9cc1d9', node: 'dog_cochlea' }], note: 'A schematic of the ear, not to scale in the inner ear. Look at the dog from the front, then press the button; the cut passes across the head.' } },
];
const MC = ['#b0463b', '#a23d35', '#bb5144', '#9a3a33', '#b84e41'];

export const thing = {
  id: 'dog', title: 'Dog', label: 'Dog', scientific: 'Canis familiaris', node: 'dog', main_part: 'coat',
  blurb: 'A Labrador-type dog, with its body, muscles, bones, organs, nerves and blood vessels. Click any part, or use the layer buttons.',
  model_note: 'A model built from typical proportions of a medium-sized dog (a Labrador-type male, 30 kg, 57 cm at the withers), not a scan of one animal. Bone shapes, muscle outlines and organ sizes are schematic; the counts (7 neck, 13 chest, 7 lower-back vertebrae, 13 pairs of ribs, 42 teeth) are real.',
  size_m: { height_at_withers: .57, body_length: 1.0, mass_kg: 30 }, height_m: .66, radius_m: .85, draw_m: 400, seed: 2027,
  systems: SYSTEMS, modes: MODES,
  auto: { label: 'Auto', near_m: 2.2, near: 'muscles', far: 'coat' },
  lod: { near_m: 14, far_m: 60 }, shadow: { radius_m: .85, opacity: .8 },
  cut: { default: 'muscle', at: [0, .4, 0], faces: { muscle: { kind: 'plain', palette: [['#a8433a', 1]] }, bone: { kind: 'plain', palette: [['#e8dcc0', 1]] }, organ: { kind: 'plain', palette: [['#c9776e', 1]] }, blood_l: { kind: 'plain', palette: [['#e0463c', 1]] }, blood_r: { kind: 'plain', palette: [['#4f6fb5', 1]] }, brain: { kind: 'plain', palette: [['#d9c3bd', 1]] } } },
  hotspots: [], parts: [],
};

export default function build() {
  const t0 = Date.now(), parts = [], meshes = {}, instances = {}; const log = s => console.log(s, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  const add = (id, name, system, node, color, mesh, o = {}) => { parts.push({ id, name, system, node, color, mesh, ...o }); };
  const skin = skinShape(), coat = D.meshS(skin, .01); meshes.coat = coat; log('coat');
  add('coat', 'Skin and coat', 'coat', 'dog_coat', '#d9b36f', 'coat', { priority: 1.2, cutFace: 'muscle', deeper: { type: 'tissue2', id: 'dog_skin', D: 1.6e-3, button: 'Look inside the skin and coat' } });
  // fur blades
  meshes.fur_blade = X.furBladeMesh(); instances.fur = X.fur(coat, 9000); parts.push({ id: 'fur', name: 'Fur', system: 'coat', node: 'dog_fur', color: '#cfa65f', instances: 'fur', tint: .22, double: true, lod: 'near', priority: 1.3 }); log('fur');
  Object.assign(meshes, X.ears(), X.nose(), X.paws());
  add('ears', 'Ears', 'coat', 'dog_ear', '#c99f58', 'ears', { priority: 1.6, noink: false, solid: false });
  add('nose', 'Nose (rhinarium)', 'coat', 'dog_nose', '#231d1b', 'nose', { priority: 1.8 });
  add('paw_pads', 'Paw pads', 'coat', 'dog_pads', '#2b2220', 'paw_pads', { priority: 1.8 });
  add('claws', 'Claws', 'coat', 'dog_claws', '#3a302b', 'claws', { priority: 1.8 });
  const ey = X.eyes(); for (const k of ['eye_globe', 'eye_front']) meshes[k] = ey[k];
  add('eyes', 'Eyes', 'eyes', 'dog_eye', '#6b4a2a', 'eye_globe', { priority: 1.9, solid: false, double: true, deeper: null });
  add('eye_front', 'Eyes (front)', 'eyes', 'dog_eye', '#3b2a1c', 'eye_front', { priority: 1.9, solid: false, double: true });
  // skeleton
  const sk = skeleton(); Object.assign(meshes, sk.meshes, limbBones()); log('skeleton');
  const SK = [['skull', 'Skull', 'dog_skull'], ['mandible', 'Lower jaw (mandible)', 'dog_mandible'], ['teeth', 'Teeth (42)', 'dog_teeth'], ['cervical', 'Neck vertebrae (7)', 'dog_cervical'], ['thoracic', 'Chest vertebrae (13)', 'dog_thoracic'], ['lumbar', 'Lower-back vertebrae (7)', 'dog_lumbar'], ['sacrum', 'Sacrum (3 fused)', 'dog_sacrum'], ['caudal', 'Tail vertebrae (about 20)', 'dog_caudal'], ['ribs', 'Ribs (13 pairs)', 'dog_ribs'], ['costal', 'Costal cartilages', 'dog_costal'], ['sternum', 'Breastbone (sternum)', 'dog_sternum'], ['pelvis', 'Pelvis', 'dog_pelvis'], ['baculum', 'Penis bone (baculum)', 'dog_baculum']];
  for (const [k, n, nd] of SK) add(k, n, 'skeleton', nd, k === 'costal' ? cart : k === 'teeth' ? '#fbf6e8' : bone, k, { cutFace: 'bone', priority: k === 'teeth' ? 1.8 : 1.5 });
  for (const s of ['r', 'l']) { const S = s === 'r' ? 'right ' : 'left ';
    for (const [k, n, nd] of [['scapula', 'Shoulder blade (scapula)', 'dog_scapula'], ['humerus', 'Upper arm bone (humerus)', 'dog_humerus'], ['radius_ulna', 'Forearm bones (radius and ulna)', 'dog_radius_ulna'], ['carpus', 'Carpus (the dog\'s wrist)', 'dog_carpus'], ['metacarpals', 'Metacarpals (palm bones)', 'dog_metacarpals'], ['phalanges_f', 'Toe bones of the forefoot', 'dog_phalanges'], ['dewclaw', 'Dewclaw (first toe)', 'dog_dewclaw'], ['femur', 'Thigh bone (femur)', 'dog_femur'], ['patella', 'Kneecap (patella)', 'dog_patella'], ['tibia_fibula', 'Shin bones (tibia and fibula)', 'dog_tibia'], ['tarsus', 'Tarsus (the hock, with the heel bone)', 'dog_tarsus'], ['metatarsals', 'Metatarsals (sole bones)', 'dog_metatarsals'], ['phalanges_h', 'Toe bones of the hind foot', 'dog_phalanges']]) {
      const key = (k === 'phalanges_f' ? 'phalanges_f_' : k === 'phalanges_h' ? 'phalanges_h_' : k + '_') + s; add(key, S + n.charAt(0).toLowerCase() + n.slice(1) === S + n ? n : n, 'skeleton', nd, bone, key, { cutFace: 'bone', priority: 1.6 }); parts[parts.length - 1].name = n + ' (' + (s === 'r' ? 'right' : 'left') + ')'; } }
  // muscles
  const mm = muscleMeshes(skin); log('muscles'); MUSCLES.forEach((m, i) => { meshes['m_' + m.id] = mm[m.id]; add('m_' + m.id, m.name, 'muscles', 'dog_m_' + m.id, MC[i % 5], 'm_' + m.id, { cutFace: 'muscle', priority: 1.5, ink_w: .0016, deeper: i === 0 || m.id === 'quadriceps' ? { type: 'tissue2', id: 'dog_muscle', D: 5e-4, button: 'Look inside the muscle' } : undefined }); parts[parts.length - 1].deeper = { type: 'tissue2', id: 'dog_muscle', D: 5e-4, button: 'Look inside the muscle' }; });
  // organs
  const og = organs(); Object.assign(meshes, og); log('organs');
  const OG = [['brain', 'Brain', 'dog_brain', '#d8b5ad', 'brain'], ['bulbs', 'Olfactory bulbs', 'dog_bulbs', '#e8cfa0', 'organ'], ['tongue', 'Tongue', 'dog_tongue', '#d8766f', 'organ'], ['larynx', 'Larynx', 'dog_larynx', '#c9b6a6', 'organ'], ['trachea', 'Windpipe (trachea)', 'dog_trachea', '#c9c3d0', 'organ'], ['bronchi', 'Main bronchi', 'dog_bronchi', '#c9c3d0', 'organ'], ['esophagus', 'Gullet (esophagus)', 'dog_esophagus', '#c88f86', 'organ'], ['lung_r', 'Right lung', 'dog_lungs', '#d98a86', 'organ'], ['lung_l', 'Left lung', 'dog_lungs', '#d98a86', 'organ'], ['heart', 'Heart', 'dog_heart', '#b04a45', 'organ'], ['diaphragm', 'Diaphragm', 'dog_diaphragm', '#c97c6b', 'organ'], ['liver', 'Liver', 'dog_liver', '#7a3a2a', 'organ'], ['stomach', 'Stomach', 'dog_stomach', '#d7a58b', 'organ'], ['spleen', 'Spleen', 'dog_spleen', '#7d3b4a', 'organ'], ['small_intestine', 'Small intestine', 'dog_small_intestine', '#e0aa98', 'organ'], ['large_intestine', 'Large intestine and rectum', 'dog_large_intestine', '#c18a73', 'organ'], ['kidney_r', 'Right kidney', 'dog_kidneys', '#8d4a3c', 'organ'], ['kidney_l', 'Left kidney', 'dog_kidneys', '#8d4a3c', 'organ'], ['bladder', 'Urinary bladder', 'dog_bladder', '#e6c7a0', 'organ']];
  for (const [k, n, nd, c, cf] of OG) add(k, n, 'organs', nd, c, k, { cutFace: cf, priority: 1.6, solid: k !== 'diaphragm', ...(k.startsWith('lung') ? { opacity_max: .5 } : {}) });
  meshes.tracheal_rings = og.tracheal_rings; add('tracheal_rings', 'Tracheal cartilage rings', 'organs', 'dog_trachea', '#e9e4ee', 'tracheal_rings', { priority: 1.7, solid: false });
  // nerves, vessels
  const nv = nerves(), vs = vessels(); Object.assign(meshes, nv, vs);
  add('brain_n', 'Brain', 'nervous', 'dog_brain', '#e3c6c0', 'brain', { cutFace: 'brain', priority: 1.6 }); add('bulbs_n', 'Olfactory bulbs', 'nervous', 'dog_bulbs', '#f0d896', 'bulbs', { priority: 1.7 });
  add('spinal_cord', 'Spinal cord', 'cord', 'dog_spinal_cord', '#f3e9c7', 'spinal_cord', { priority: 1.6 });
  add('nerves_fore', 'Nerves of the foreleg (brachial plexus)', 'nervous', 'dog_nerves_fore', '#efd66a', 'nerves_fore', { priority: 1.6, solid: false });
  add('nerves_hind', 'Sciatic nerve and nerves of the hindleg', 'nervous', 'dog_nerves_hind', '#efd66a', 'nerves_hind', { priority: 1.6, solid: false });
  add('vagus', 'Vagus nerves', 'nervous', 'dog_vagus', '#e8c14e', 'vagus', { priority: 1.6, solid: false });
  add('optic', 'Optic nerves', 'nervous', 'dog_optic', '#f0d896', 'optic', { priority: 1.7, solid: false });
  add('tail_nerves', 'Tail nerves', 'nervous', 'dog_nerves_hind', '#efd66a', 'tail_nerves', { priority: 1.6, solid: false });
  add('eyes_n', 'Eyes', 'nervous', 'dog_eye', '#6b4a2a', 'eye_globe', { priority: 1.9, solid: false, double: true });
  add('arteries', 'Arteries (carry blood away from the heart)', 'vessels', 'dog_arteries', '#d6362d', 'arteries', { priority: 1.6, solid: false });
  add('veins', 'Veins (carry blood back to the heart)', 'vessels', 'dog_veins', '#3f63b8', 'veins', { priority: 1.6, solid: false });
  add('heart_v', 'Heart', 'vessels', 'dog_heart', '#b04a45', 'heart', { priority: 1.7, cutFace: 'organ' });
  add('lung_r_v', 'Right lung', 'vessels', 'dog_lungs', '#e8a8a4', 'lung_r', { priority: 1.5, opacity_max: .35 }); add('lung_l_v', 'Left lung', 'vessels', 'dog_lungs', '#e8a8a4', 'lung_l', { priority: 1.5, opacity_max: .35 });
  // inside the heart
  add('heart_d', 'Heart muscle (cut open)', 'd_heart', 'dog_heart', '#b9524a', 'heart', { priority: 1.6, cutFace: 'muscle' });
  add('h_lv', 'Left ventricle (cavity)', 'd_heart', 'dog_lv', '#e0463c', 'h_lv', { parent: 'heart', cutFace: 'blood_l', priority: 2.2 }); add('h_rv', 'Right ventricle (cavity)', 'd_heart', 'dog_rv', '#4f6fb5', 'h_rv', { parent: 'heart', cutFace: 'blood_r', priority: 2.2 });
  add('h_la', 'Left atrium (cavity)', 'd_heart', 'dog_la', '#e0463c', 'h_la', { parent: 'heart', cutFace: 'blood_l', priority: 2.2 }); add('h_ra', 'Right atrium (cavity)', 'd_heart', 'dog_ra', '#4f6fb5', 'h_ra', { parent: 'heart', cutFace: 'blood_r', priority: 2.2 });
  add('h_valves', 'Heart valves', 'd_heart', 'dog_valves', '#f1ecd9', 'h_valves', { parent: 'heart', solid: false, double: true, priority: 2.3 });
  // inside the eye
  const EY = [['eye_sclera', 'Sclera (white of the eye)', 'dog_sclera', '#d6c9ae'], ['eye_choroid', 'Choroid (dark layer)', 'dog_choroid', '#2a201c'], ['eye_tapetum', 'Tapetum lucidum', 'dog_tapetum', '#3fae6a'], ['eye_retina', 'Retina', 'dog_retina', '#c4585a'], ['eye_vitreous', 'Vitreous body', 'dog_vitreous', '#8db6d6'], ['eye_lens', 'Lens', 'dog_lens', '#e9c860'], ['eye_cornea', 'Cornea', 'dog_cornea', '#dfeef5'], ['eye_iris', 'Iris and pupil', 'dog_iris', '#8a5a2b']];
  for (const [k, n, nd, c] of EY) { meshes[k] = ey[k]; add(k, n, 'd_eye', nd, c, k, { ...(k === 'eye_tapetum' || k === 'eye_retina' ? { deeper: { type: 'tissue2', id: 'dog_retina', D: 2.8e-4, button: 'Look inside the retina and tapetum' } } : {}), solid: k === 'eye_vitreous' || k === 'eye_lens', double: true, priority: k === 'eye_tapetum' ? 2.2 : 2.0, parent: 'eyes', cutFace: k === 'eye_lens' ? 'bone' : 'organ', opacity_max: k === 'eye_vitreous' ? .45 : k === 'eye_cornea' ? .35 : 1, noink: k !== 'eye_lens' }); }
  // inside the nose and ear
  const tb = X.turbinates(); meshes.turb_plate = X.plateMeshX(); instances.turb_olf = tb.olf; instances.turb_resp = tb.resp;
  parts.push({ id: 'turb_olf', name: 'Ethmoturbinates (smell lining)', system: 'd_nose', node: 'dog_turb_olf', color: '#e3a58e', instances: 'turb_olf', double: true, parent: 'skull', priority: 2.2, deeper: { type: 'tissue2', id: 'dog_olfactory_epithelium', D: 2.8e-4, button: 'Look inside the smell lining' } });
  parts.push({ id: 'turb_resp', name: 'Maxilloturbinates (airway lining)', system: 'd_nose', node: 'dog_turb_resp', color: '#d9c9ce', instances: 'turb_resp', double: true, parent: 'skull', priority: 2.2 });
  const ei = X.earInner(); Object.assign(meshes, ei);
  for (const [k, n, nd, c] of [['ear_canal', 'Ear canal', 'dog_ear_canal', '#e8b3a0'], ['ear_drum', 'Eardrum', 'dog_eardrum', '#f4e3d0'], ['ear_bulla', 'Middle ear (bulla)', 'dog_bulla', '#d8ccb0'], ['ear_cochlea', 'Cochlea', 'dog_cochlea', '#9cc1d9'], ['ear_canals', 'Balance canals', 'dog_cochlea', '#7fa6c4']]) add(k, n, 'd_ear', nd, c, k, { solid: false, double: true, parent: 'skull', priority: 2.2 });
  // hotspots
  const hs = (id, node, at, label, modes, r = .012) => thing.hotspots.push({ id, node, at, label, modes, r });
  hs('hs_lv', 'dog_lv', [.079, .35, -.006], 'Left ventricle: the strong pump', ['cut_heart'], .011); hs('hs_rv', 'dog_rv', [.094, .358, .022], 'Right ventricle: pumps to the lungs', ['cut_heart'], .009);
  hs('hs_valves', 'dog_valves', [.102, .384, -.009], 'Valves keep the blood moving one way', ['cut_heart'], .008);
  hs('hs_tap', 'dog_tapetum', [.4075, .648, .0435], 'Tapetum lucidum: the dog has it, people do not', ['cut_eye'], .0018); hs('hs_lens', 'dog_lens', [.4215, .634, .0455], 'Lens', ['cut_eye'], .0018); hs('hs_ret', 'dog_retina', [.4065, .634, .0425], 'Retina: two kinds of cones', ['cut_eye'], .0018);
  hs('hs_olf', 'dog_turb_olf', [.435, .593, 0], 'Smell lining on the scrolls at the back', ['cut_nose'], .008); hs('hs_resp', 'dog_turb_resp', [.48, .592, 0], 'Scrolls that warm and moisten air', ['cut_nose'], .008);
  hs('hs_ear_canal', 'dog_ear_canal', [.3595, .625, .0645], 'Ear canal: an L-shaped tube', ['cut_ear'], .005); hs('hs_drum', 'dog_eardrum', [.355, .602, .043], 'Eardrum', ['cut_ear'], .004); hs('hs_cochlea', 'dog_cochlea', [.354, .607, .029], 'Cochlea: hearing from 67 Hz to about 45 kHz', ['cut_ear'], .004);
  hs('hs_brain', 'dog_brain', [.365, .634, 0], 'Brain with its big olfactory bulbs', ['cut_half'], .015); hs('hs_heart_c', 'dog_heart', [.083, .358, 0], 'Heart', ['cut_half'], .015); hs('hs_tongue', 'dog_tongue', [.4, .54, 0], 'Tongue', ['cut_half'], .012);
  thing.parts = parts; log('assembled');
  return { thing, meshes, instances };
}

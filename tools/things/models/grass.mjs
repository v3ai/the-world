// Perennial ryegrass (Lolium perenne): one tussock built procedurally from typical measurements. Facts and sources: tools/things/content/grass_*.py and notes/grass.md
import * as L from '../lib/index.mjs';
import { buildPlant, M } from './grass_plant.mjs';
import { buildSpecimens } from './grass_spec.mjs';
import { buildThing } from './grass_thing.mjs';

export default function build() {
  const R = L.rng(7771), ctx = { meshes: {}, instances: {}, unit: { meristems: 'meristem', root_hairs: 'root_hair', root_tips: 'root_cap', lemmas: 'lemma', glumes: 'glume', spikelet_lens: 'spikelet_lens', anthers: 'anther', filaments: 'filament', stigmas: 'stigma' }, R, stats: {}, hot: [] };
  // instances need their unit mesh key: I() in the builders reads ctx.unit
  buildPlant(ctx);
  buildSpecimens(ctx);
  const thing = buildThing(ctx, M);
  console.log('grass model:', JSON.stringify(ctx.stats));
  return { thing, meshes: ctx.meshes, instances: ctx.instances };
}

// usage: node dump.mjs in.glb outdir   (input glb is untrusted data; only parsed)
import fs from 'fs';
import {MeshoptDecoder} from 'meshoptimizer';
const [,, inp, outdir]=process.argv;
await MeshoptDecoder.ready;
const b=fs.readFileSync(inp);
const jl=b.readUInt32LE(12); const j=JSON.parse(b.slice(20,20+jl).toString());
let off=20+jl; const bl=b.readUInt32LE(off); const bin=b.slice(off+8,off+8+bl);
const views=j.bufferViews.map(bv=>{
  const e=bv.extensions&&bv.extensions.EXT_meshopt_compression;
  if(!e) return null;
  const src=new Uint8Array(bin.buffer,bin.byteOffset+e.byteOffset,e.byteLength);
  const out=new Uint8Array(e.count*e.byteStride);
  MeshoptDecoder.decodeGltfBuffer(out,e.count,e.byteStride,src,e.mode,e.filter||'NONE');
  return out;
});
const CT={5120:[Int8Array,1,127],5121:[Uint8Array,1,255],5122:[Int16Array,2,32767],5123:[Uint16Array,2,65535],5125:[Uint32Array,4,1],5126:[Float32Array,4,1]};
const NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
function acc(k){
  const a=j.accessors[k], bv=j.bufferViews[a.bufferView], v=views[a.bufferView];
  const [T,sz,mx]=CT[a.componentType], n=NC[a.type]; const st=bv.byteStride||sz*n;
  const dv=new DataView(v.buffer,v.byteOffset,v.byteLength);
  const out=new Float64Array(a.count*n);
  for(let i=0;i<a.count;i++)for(let c=0;c<n;c++){
    const o=(a.byteOffset||0)+i*st+c*sz; let x;
    switch(a.componentType){case 5120:x=dv.getInt8(o);break;case 5121:x=dv.getUint8(o);break;case 5122:x=dv.getInt16(o,true);break;case 5123:x=dv.getUint16(o,true);break;case 5125:x=dv.getUint32(o,true);break;default:x=dv.getFloat32(o,true);}
    if(a.normalized) x=Math.max(x/mx,-1);
    out[i*n+c]=x;
  }
  return out;
}
function mat(n){ // column-major 4x4
  if(n.matrix) return n.matrix.slice();
  const t=n.translation||[0,0,0], q=n.rotation||[0,0,0,1], s=n.scale||[1,1,1];
  const [x,y,z,w]=q;
  const r=[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),0, 2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),0, 2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y),0, 0,0,0,1];
  for(let i=0;i<3;i++)for(let k=0;k<3;k++) r[i*4+k]*=s[i];
  r[12]=t[0];r[13]=t[1];r[14]=t[2];return r;
}
function mul(a,b){const o=new Array(16).fill(0);for(let i=0;i<4;i++)for(let k=0;k<4;k++){let s=0;for(let m=0;m<4;m++)s+=a[m*4+k]*b[i*4+m];o[i*4+k]=s;}return o;}
fs.mkdirSync(outdir,{recursive:true});
const man=[];
function walk(ni,pm,path){
  const n=j.nodes[ni]; const m=mul(pm,mat(n));
  if(n.mesh!==undefined){
    const prim=j.meshes[n.mesh].primitives[0];
    const P=acc(prim.attributes.POSITION), I=acc(prim.indices);
    const pos=new Float32Array(P.length);
    for(let i=0;i<P.length/3;i++){const x=P[i*3],y=P[i*3+1],z=P[i*3+2];
      pos[i*3]=m[0]*x+m[4]*y+m[8]*z+m[12];pos[i*3+1]=m[1]*x+m[5]*y+m[9]*z+m[13];pos[i*3+2]=m[2]*x+m[6]*y+m[10]*z+m[14];}
    const idx=new Uint32Array(I.length); for(let i=0;i<I.length;i++) idx[i]=I[i];
    const name=n.name||('mesh'+ni);
    fs.writeFileSync(`${outdir}/${name}.pos.f32`,Buffer.from(pos.buffer));
    fs.writeFileSync(`${outdir}/${name}.idx.u32`,Buffer.from(idx.buffer));
    man.push({name,group:path[path.length-1]||null,nv:pos.length/3,nt:idx.length/3});
  }
  for(const c of n.children||[]) walk(c,m,[...path,n.name]);
}
const I4=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
for(const r of j.scenes[0].nodes) walk(r,I4,[]);
fs.writeFileSync(`${outdir}/manifest.json`,JSON.stringify(man));
console.log(man.length,'meshes');

import json,struct,numpy as np,sys
import meshoptimizer as mo
CT={5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def read_glb(path):
    b=open(path,'rb').read()
    l=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+l])
    off=20+l; assert b[off+4:off+8]==b'BIN\x00'
    bl=struct.unpack('<I',b[off:off+4])[0]; bin0=b[off+8:off+8+bl]
    return j,bin0
def decode_views(j,bin0):
    views=[]
    for bv in j['bufferViews']:
        e=bv.get('extensions',{}).get('EXT_meshopt_compression')
        if not e: views.append(None); continue
        src=bin0[e['byteOffset']:e['byteOffset']+e['byteLength']]
        cnt,st=e['count'],e['byteStride']
        if e['mode']=='ATTRIBUTES':
            d=mo.decode_vertex_buffer(cnt,st,src,dtype=np.uint8)
            d=np.ascontiguousarray(d)
            f=e.get('filter','NONE')
            if f=='OCTAHEDRAL': d=mo.decode_filter_oct(d,cnt,st)
            elif f=='EXPONENTIAL': d=mo.decode_filter_exp(d,cnt,st)
            elif f=='QUATERNION': d=mo.decode_filter_quat(d,cnt,st)
            views.append(np.ascontiguousarray(d).tobytes())
        elif e['mode']=='TRIANGLES':
            d=mo.decode_index_buffer(cnt,st,src)
            views.append(np.asarray(d).tobytes())
        else: raise Exception(e['mode'])
    return views
def accessor(j,views,k):
    a=j['accessors'][k]; v=views[a['bufferView']]
    dt=CT[a['componentType']]; n=NC[a['type']]
    bv=j['bufferViews'][a['bufferView']]; st=bv.get('byteStride',0)
    isz=np.dtype(dt).itemsize*n
    if st and st!=isz:
        raw=np.frombuffer(v,np.uint8)
        o=a.get('byteOffset',0)
        rows=np.stack([raw[o+i*st:o+i*st+isz] for i in range(0)]) if False else np.lib.stride_tricks.as_strided(raw[o:],shape=(a['count'],isz),strides=(st,1))
        arr=np.ascontiguousarray(rows).view(dt).reshape(a['count'],n)
        return arr if n>1 else arr[:,0]
    arr=np.frombuffer(v,dt,a['count']*n,a.get('byteOffset',0))
    return arr.reshape(a['count'],n) if n>1 else arr

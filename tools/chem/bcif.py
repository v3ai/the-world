import msgpack, numpy as np, struct
DT={1:'i1',2:'i2',3:'i4',4:'u1',5:'u2',6:'u4',32:'f4',33:'f8'}
def decode(enc_data):
    data=enc_data['data']
    for e in reversed(enc_data['encoding']):
        k=e['kind']
        if k=='ByteArray': data=np.frombuffer(data,dtype='<'+DT[e['type']])
        elif k=='FixedPoint': data=np.asarray(data,dtype='f8')/e['factor']
        elif k=='IntervalQuantization':
            n=e['numSteps'];data=e['min']+np.asarray(data,dtype='f8')*(e['max']-e['min'])/(n-1)
        elif k=='RunLength':
            data=np.repeat(data[0::2],data[1::2])
        elif k=='Delta': data=np.cumsum(data)+e['origin']
        elif k=='IntegerPacking':
            d=np.asarray(data); 
            if e['isUnsigned']:
                lim=np.iinfo(d.dtype).max; 
            else: lim=np.iinfo(d.dtype).max
            # unpack: values equal to max (or min) are continuation
            out=[];acc=0
            mx=np.iinfo(d.dtype).max; mn=np.iinfo(d.dtype).min
            for v in d.tolist():
                if (v==mx and True) or (not e['isUnsigned'] and v==mn):
                    acc+=v
                else:
                    out.append(acc+v);acc=0
            data=np.array(out,dtype='<i4')
        elif k=='StringArray':
            offs=decode({'data':e['offsets'],'encoding':e['offsetEncoding']})
            idx=decode({'data':data,'encoding':e['dataEncoding']}) if False else None
            raise
        else: raise ValueError(k)
    return data
def strarray(col):
    d=col['data']; enc=d['encoding'][0]
    assert enc['kind']=='StringArray'
    offs=decode({'data':enc['offsets'],'encoding':enc['offsetEncoding']})
    idx=decode({'data':d['data'],'encoding':enc['dataEncoding']})
    s=enc['stringData']
    table=[s[offs[i]:offs[i+1]] for i in range(len(offs)-1)]
    return [table[i] if i>=0 else '' for i in idx]
def load(path):
    f=msgpack.unpackb(open(path,'rb').read(),raw=False)
    blk=f['dataBlocks'][0]; cats={c['name'].lstrip('_'):c for c in blk['categories']}
    return cats
def col(cats,cat,name):
    c=[x for x in cats[cat]['columns'] if x['name']==name][0]
    if c['data']['encoding'] and c['data']['encoding'][0]['kind']=='StringArray': return strarray(c)
    return list(decode(c['data']))

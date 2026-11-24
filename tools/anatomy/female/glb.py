"""A plain glTF 2.0 (.glb) reader: positions and triangle indices of every mesh node, with the node transforms composed.

The Human Reference Atlas files use no extension (no Draco, no meshopt), so nothing else is needed. Each mesh node is returned
with its path: the names of its ancestors and its own, joined with '/', with the 'VH_F_' prefix taken off, so a row of
parts_f.tsv can select a whole subtree by an ancestor's name.
"""
import json, struct
import numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def _node_matrix(n):
    if 'matrix' in n:
        return np.array(n['matrix'], np.float64).reshape(4, 4).T
    M = np.eye(4)
    if 'scale' in n:
        M = np.diag(list(n['scale']) + [1.0]) @ M
    if 'rotation' in n:
        x, y, z, w = n['rotation']
        R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                      [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                      [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
        R4 = np.eye(4); R4[:3, :3] = R; M = R4 @ M
    if 'translation' in n:
        T = np.eye(4); T[:3, 3] = n['translation']; M = T @ M
    return M


class GLB:
    def __init__(self, path):
        b = open(path, 'rb').read()
        assert b[:4] == b'glTF', path + ': not a binary glTF file'
        jl = struct.unpack('<I', b[12:16])[0]
        self.j = json.loads(b[20:20 + jl])
        assert not self.j.get('extensionsRequired'), 'extensions required: ' + str(self.j.get('extensionsRequired'))
        o = 20 + jl
        bl = struct.unpack('<I', b[o:o + 4])[0]
        self.bin = b[o + 8:o + 8 + bl]
        self.nodes = []   # (name, path, node index, world matrix)

        def walk(i, P, path):
            n = self.j['nodes'][i]; M = P @ _node_matrix(n); name = n.get('name') or ('node%d' % i)
            p = path + [name.replace('VH_F_', '')]
            self.nodes.append((name, '/'.join(p), i, M))
            for c in n.get('children', []):
                walk(c, M, p)
        for r in self.j['scenes'][self.j.get('scene', 0)]['nodes']:
            walk(r, np.eye(4), [])

    def _acc(self, k):
        a = self.j['accessors'][k]; bv = self.j['bufferViews'][a['bufferView']]
        dt = CT[a['componentType']]; n = NC[a['type']]; off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        st = bv.get('byteStride', 0); isz = np.dtype(dt).itemsize * n
        if st and st != isz:
            raw = np.frombuffer(self.bin, np.uint8)[off:]
            return np.lib.stride_tricks.as_strided(raw, shape=(a['count'], isz), strides=(st, 1)).copy().view(dt).reshape(a['count'], n)
        return np.frombuffer(self.bin, dt, a['count'] * n, off).reshape(a['count'], n)

    def meshes(self):
        """[(name, path, V (n,3) float64 metres, F (m,3) int64)] for every node that has a mesh."""
        out = []
        for name, path, i, M in self.nodes:
            n = self.j['nodes'][i]
            if 'mesh' not in n:
                continue
            vs, fs, o = [], [], 0
            for pr in self.j['meshes'][n['mesh']]['primitives']:
                if pr.get('mode', 4) != 4:
                    continue
                v = self._acc(pr['attributes']['POSITION']).astype(np.float64)
                f = self._acc(pr['indices']).reshape(-1, 3).astype(np.int64) if 'indices' in pr else np.arange(len(v)).reshape(-1, 3)
                v = (M @ np.c_[v, np.ones(len(v))].T).T[:, :3]
                vs.append(v); fs.append(f + o); o += len(v)
            if vs:
                out.append((name, path, np.vstack(vs), np.vstack(fs)))
        return out

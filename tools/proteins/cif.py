"""Minimal mmCIF reader for the replication-fork models: the _atom_site loop and entity names, nothing else.
Pure Python, no dependencies. Used by make_replisome.py."""
import gzip, shlex


def _tokens(line):
    try:
        return shlex.split(line, posix=True)
    except ValueError:
        return line.split()


def read(path):
    op = gzip.open if path.endswith('.gz') else open
    with op(path, 'rt') as f:
        lines = f.read().split('\n')
    atoms, names, i, n = [], {}, 0, len(lines)
    while i < n:
        if lines[i].startswith('loop_'):
            j = i + 1; cols = []
            while j < n and lines[j].startswith('_'):
                cols.append(lines[j].strip()); j += 1
            if cols and cols[0].startswith('_atom_site.'):
                key = [c.split('.', 1)[1] for c in cols]; ix = {k: key.index(k) for k in key}
                while j < n and lines[j] and not lines[j].startswith(('#', 'loop_', '_')):
                    t = lines[j].split()
                    if len(t) == len(key):
                        g = lambda k: t[ix[k]]
                        if g('pdbx_PDB_model_num') == '1':
                            atoms.append(dict(group=g('group_PDB'), el=g('type_symbol'), name=g('label_atom_id').strip('"'), res=g('label_comp_id'),
                                              chain=g('auth_asym_id'), entity=g('label_entity_id'), seq=g('auth_seq_id'),
                                              x=float(g('Cartn_x')), y=float(g('Cartn_y')), z=float(g('Cartn_z'))))
                    j += 1
            elif cols and cols[0].startswith('_entity.'):
                key = [c.split('.', 1)[1] for c in cols]
                buf = []
                while j < n and not lines[j].startswith(('#', 'loop_')) and not (lines[j].startswith('_') and buf == []):
                    buf.append(lines[j]); j += 1
                toks = []
                k = 0
                while k < len(buf):
                    L = buf[k]
                    if L.startswith(';'):
                        s = [L[1:]]; k += 1
                        while k < len(buf) and not buf[k].startswith(';'):
                            s.append(buf[k]); k += 1
                        toks.append(' '.join(s).strip()); k += 1; continue
                    toks += _tokens(L); k += 1
                for r in range(0, len(toks) - len(key) + 1, len(key)):
                    row = dict(zip(key, toks[r:r + len(key)]))
                    names[row.get('id')] = row.get('pdbx_description')
            i = j
        else:
            i += 1
    return atoms, names

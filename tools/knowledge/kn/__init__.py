N=[]
def n(id,title,lvl,scale,cert,dom,basics,deeper,expert,regime,em="",ev="",refs="",sim="",fr="",fref="",ex=""):
    N.append(dict(id=id,title=title,level=lvl,scale_m=list(scale) if scale else None,certainty=cert,domain=dom,
      basics=basics,deeper=deeper,expert=expert,regime=regime,
      emerges_from=em.split(),explains=ex.split(),evidence=[e.strip() for e in ev.split('|') if e.strip()],
      frontier=[dict(text=x.split('~')[0].strip(),status=(x.split('~')[1].strip() if '~' in x else 'open'),as_of="2023-12") for x in fr.split('|') if x.strip()],
      refs_raw=[r.strip() for r in refs.split(';') if r.strip()],sim=sim.split(),frontier_ref=fref.split()))

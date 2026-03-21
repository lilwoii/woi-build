const STOP = new Set(["the","a","an","of","to","in","on","and","or","for","with","will","vs","by","at","is","are","be"]);

export function tokenize(s){
  return String(s||"").toLowerCase()
    .replace(/[^a-z0-9\s]/g," ")
    .split(/\s+/).filter(t=>t && !STOP.has(t) && t.length>2);
}

export function basketize(markets){
  const out = [];
  const seen = new Set();
  const toks = markets.map(m=>({
    m,
    words: new Set(tokenize(m.title || m.question || "")),
  }));

  for (let i=0;i<toks.length;i++){
    if (seen.has(i)) continue;
    const base = toks[i];
    const group = [base.m];
    seen.add(i);
    for (let j=i+1;j<toks.length;j++){
      if (seen.has(j)) continue;
      const cand = toks[j];
      let inter = 0;
      for (const w of cand.words) if (base.words.has(w)) inter++;
      if (inter >= 2) { // shared keywords threshold
        group.push(cand.m);
        seen.add(j);
      }
    }
    out.push({
      key: (base.m.market_id || base.m.id || `basket_${i}`),
      title: group[0].title || group[0].question || "Basket",
      items: group
    });
  }

  // sort largest baskets first
  out.sort((a,b)=> (b.items?.length||0) - (a.items?.length||0));
  return out;
}

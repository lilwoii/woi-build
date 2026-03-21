function fmt(ts){
  try{
    const d = new Date(ts);
    return d.toLocaleString();
  }catch{return "";}
}

function render(items, filter){
  const root = document.getElementById("list");
  root.innerHTML = "";
  const q = (filter || "").toLowerCase().trim();

  const shown = (items || []).filter(it => {
    if(!q) return true;
    return (it.text||"").toLowerCase().includes(q) || (it.title||"").toLowerCase().includes(q) || (it.url||"").toLowerCase().includes(q);
  });

  if(shown.length === 0){
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="text">No history yet.</div><div class="meta">Highlight text → right click → send.</div>`;
    root.appendChild(div);
    return;
  }

  for(const it of shown){
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="top">
        <div class="text">${escapeHtml((it.text||"").slice(0,160))}</div>
        <div class="${it.ok ? "ok" : "bad"}">${it.ok ? "✓" : "!"}</div>
      </div>
      <div class="meta">${escapeHtml(it.title || it.url || "")}</div>
      <div class="meta">${fmt(it.ts)}</div>
    `;
    div.addEventListener("click", () => {
      if(it.url) chrome.tabs.create({ url: it.url });
    });
    root.appendChild(div);
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function load(){
  chrome.storage.local.get({ history: [] }, (obj) => {
    const history = Array.isArray(obj.history) ? obj.history : [];
    const filter = document.getElementById("filter").value;
    render(history, filter);
  });
}

document.getElementById("filter").addEventListener("input", load);
document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.set({ history: [] }, load);
});

load();

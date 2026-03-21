// Service worker
const API_BASE = "http://127.0.0.1:8000"; // change if your backend runs elsewhere

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "woi_send_selection",
    title: "Send selection to Woi AI",
    contexts: ["selection"]
  });
});

async function logInteraction(payload) {
  try {
    const res = await fetch(`${API_BASE}/interactions/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "woi_send_selection") return;

  const text = (info.selectionText || "").trim();
  if (!text) return;

  const payload = {
    question: text,
    context: tab?.url ? `Source: ${tab.url}` : undefined,
    outcome: "Captured via Chrome extension",
    source: "extension",
    meta: {
      url: tab?.url || null,
      title: tab?.title || null,
      ts: Date.now(),
    }
  };

  const result = await logInteraction(payload);

  // store local history for popup
  chrome.storage.local.get({ history: [] }, (obj) => {
    const history = Array.isArray(obj.history) ? obj.history : [];
    history.unshift({
      ts: Date.now(),
      text,
      url: tab?.url || "",
      title: tab?.title || "",
      ok: !!result.ok,
    });
    chrome.storage.local.set({ history: history.slice(0, 200) });
  });

  // tiny user feedback
  try {
    chrome.action.setBadgeText({ text: result.ok ? "✓" : "!" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1200);
  } catch {}
});

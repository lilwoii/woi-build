from __future__ import annotations
import base64
from typing import Any, Dict, List, Optional

def _emo(x: float) -> str:
    return "🟩" if x > 0 else "🟥" if x < 0 else "🟨"

def _fmt(x, nd=4):
    try:
        return f"{float(x):.{nd}f}"
    except Exception:
        return str(x)

def render_trade_card_png(*, title: str, pnl_total: float, positions: List[Dict[str, Any]], fills: List[Dict[str, Any]], risk: Dict[str, Any], strategy: str) -> bytes:
    # server-side image using PIL
    from PIL import Image, ImageDraw, ImageFont

    W, H = 980, 620
    img = Image.new("RGB", (W, H), (11, 15, 20))
    draw = ImageDraw.Draw(img)

    # fonts
    try:
        f1 = ImageFont.truetype("arial.ttf", 26)
        f2 = ImageFont.truetype("arial.ttf", 18)
        f3 = ImageFont.truetype("arial.ttf", 16)
    except Exception:
        f1 = ImageFont.load_default()
        f2 = ImageFont.load_default()
        f3 = ImageFont.load_default()

    pad = 24
    emo = _emo(pnl_total)
    draw.text((pad, pad), f"WOI Trade Card {emo}", fill=(220, 245, 240), font=f1)
    draw.text((pad, pad + 38), title[:80], fill=(170, 190, 200), font=f2)

    # top stats
    y = pad + 78
    stats = [
        ("Strategy", strategy or "auto"),
        ("Total PnL", _fmt(pnl_total, 4)),
        ("Risk: exposure", _fmt(risk.get("exposure", 0), 4)),
        ("Risk: max_loss_est", _fmt(risk.get("max_loss_est", 0), 4)),
    ]
    x = pad
    for k, v in stats:
        draw.rectangle([x, y, x + 230, y + 58], outline=(40, 55, 65), width=2, fill=(14, 20, 26))
        draw.text((x + 12, y + 10), k, fill=(160, 175, 185), font=f3)
        draw.text((x + 12, y + 30), str(v)[:24], fill=(230, 245, 240), font=f2)
        x += 240

    # sections
    sec_y = y + 78
    draw.text((pad, sec_y), "Open Positions", fill=(220, 245, 240), font=f2)
    draw.text((pad + 480, sec_y), "Last Fills", fill=(220, 245, 240), font=f2)

    # tables
    table_y = sec_y + 30
    # positions table
    px = pad
    draw.rectangle([px, table_y, px + 450, table_y + 480], outline=(40, 55, 65), width=2, fill=(10, 14, 18))
    headers = ["token", "side", "avg_px", "qty"]
    hx = px + 12
    hy = table_y + 10
    for h in headers:
        draw.text((hx, hy), h, fill=(150, 170, 180), font=f3)
        hx += 110
    row_y = hy + 24
    for r in positions[:12]:
        hx = px + 12
        vals = [str(r.get("token_id",""))[:10], str(r.get("side",""))[:5], _fmt(r.get("avg_price", r.get("price", 0))), _fmt(r.get("qty", r.get("size", 0)))]
        for v in vals:
            draw.text((hx, row_y), v, fill=(220, 245, 240), font=f3)
            hx += 110
        row_y += 22

    # fills table
    fx = pad + 480
    draw.rectangle([fx, table_y, fx + 476, table_y + 480], outline=(40, 55, 65), width=2, fill=(10, 14, 18))
    headers2 = ["ts", "token", "side", "px", "qty"]
    hx = fx + 12
    for h in headers2:
        draw.text((hx, hy), h, fill=(150, 170, 180), font=f3)
        hx += 92
    row_y = hy + 24
    for r in fills[:14]:
        hx = fx + 12
        ts = str(r.get("ts_utc",""))[-8:]
        vals = [ts, str(r.get("token_id",""))[:10], str(r.get("side",""))[:5], _fmt(r.get("price", 0)), _fmt(r.get("size", r.get("qty", 0)))]
        for v in vals:
            draw.text((hx, row_y), v, fill=(220, 245, 240), font=f3)
            hx += 92
        row_y += 22

    # footer
    draw.text((pad, H - 34), "WOI — Discord Trade Card (auto-safe, rate-limited)", fill=(120, 140, 150), font=f3)

    import io
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def png_bytes_to_data_url(png: bytes) -> str:
    return "data:image/png;base64," + base64.b64encode(png).decode("utf-8")

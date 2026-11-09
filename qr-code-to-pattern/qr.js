// Looprel QR pattern — text → QR (error correction H) → stitchable grid
// 依赖 vendor/qrcode.js（MIT, kazuhikoarase/qrcode-generator）

const state = { qr: null, modules: 0, scale: 2 };

function generate() {
  const text = document.getElementById("qrtext").value.trim();
  const err = document.getElementById("qterr");
  err.textContent = "";
  if (!text) { err.textContent = "Type some text or a link first."; return; }
  let qr;
  try {
    qr = qrcode(0, "H"); // typeNumber 0 = 自动选最小版本；H = 最高纠错(30%可恢复)
    qr.addData(text);
    qr.make();
  } catch (e) {
    err.textContent = "That text is too long for one QR code — try a shorter link.";
    return;
  }
  state.qr = qr;
  state.modules = qr.getModuleCount();
  document.getElementById("resultSection").style.display = "block";
  render();
}

function render() {
  const m = state.modules, s = state.scale;
  const total = m * s;
  document.getElementById("qrstats").textContent =
    `${total} × ${total} squares · QR version for ${m}×${m} modules · scale ${s}× per module · 2 colors (DMC 310 black + blanc) · ${total} stitches per side`;

  // ---- 1) 针织网格图（含行列编号，打印主体）----
  const canvas = document.createElement("canvas");
  const cellPx = Math.max(8, Math.min(18, Math.floor(880 / total)));
  canvas.width = total * cellPx + 30;
  canvas.height = total * cellPx;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      if (!state.qr.isDark(r, c)) continue;
      ctx.fillStyle = "#111111";
      ctx.fillRect(c * s * cellPx, r * s * cellPx, s * cellPx - 0.6, s * cellPx - 0.6);
    }
  }
  // 行列编号（每 5 标，10 起步变 10/15/20…）
  ctx.font = `${Math.max(8, cellPx - 3)}px sans-serif`;
  ctx.fillStyle = "#666";
  ctx.textAlign = "left";
  for (let n = 4; n < total; n += 5) {
    ctx.fillText(String(n + 1), total * cellPx + 4, n * cellPx + cellPx); // 列号右侧
  }
  ctx.textAlign = "right";
  for (let n = 4; n < total; n += 5) {
    ctx.fillText(String(n + 1), 26, n * cellPx + cellPx); // 行号左侧
  }
  const wrap = document.getElementById("qrgrid");
  wrap.innerHTML = "";
  wrap.appendChild(canvas);

  // ---- 2) 可扫自证图：网格线叠加版二维码（用户当场手机扫）----
  const scan = document.getElementById("scanCanvas");
  const px = Math.max(6, Math.floor(340 / m));
  scan.width = scan.height = m * px;
  const sctx = scan.getContext("2d");
  sctx.fillStyle = "#fff";
  sctx.fillRect(0, 0, scan.width, scan.height);
  for (let r = 0; r < m; r++) for (let c = 0; c < m; c++) {
    if (state.qr.isDark(r, c)) { sctx.fillStyle = "#111"; sctx.fillRect(c * px, r * px, px, px); }
  }
  // 细网格线：证明「被格线切碎的二维码依然可扫」
  sctx.strokeStyle = "rgba(120,120,160,.28)";
  sctx.lineWidth = 1;
  for (let i = 1; i < m; i++) {
    sctx.beginPath(); sctx.moveTo(i * px + .5, 0); sctx.lineTo(i * px + .5, m * px); sctx.stroke();
    sctx.beginPath(); sctx.moveTo(0, i * px + .5); sctx.lineTo(m * px, i * px + .5); sctx.stroke();
  }
  document.getElementById("scanSection").style.display = "block";
}

document.getElementById("genBtn").addEventListener("click", generate);
document.getElementById("qrtext").addEventListener("keydown", e => { if (e.key === "Enter") generate(); });
document.querySelectorAll("input[name=scale]").forEach(r =>
  r.addEventListener("change", e => { state.scale = +e.target.value; if (state.qr) render(); }));
document.getElementById("qrPrintBtn").addEventListener("click", () => window.print());
document.getElementById("buyBtn").addEventListener("click", () => {
  document.getElementById("buyHint").style.display = "inline";
});

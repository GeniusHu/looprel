// Looprel — photo to crochet chart / cross stitch pattern
// 核心：图片 → 网格取样 → 最近毛线色量化 → 三种针法风格渲染 → 打印
// MVP 全部浏览器端，零服务端依赖

// ---- 色板：通用毛线色（MVP 用通用色名，品牌色号后续扩充）----
const PALETTE = [
  // 红系
  { name: "Bright Red", hex: "#d12229" }, { name: "Crimson", hex: "#9e2b25" },
  { name: "Wine", hex: "#6b2737" }, { name: "Rust", hex: "#b7410e" },
  // 粉系
  { name: "Bubblegum", hex: "#f4a7b9" }, { name: "Rose", hex: "#e56b8c" },
  { name: "Dusty Rose", hex: "#c48b93" },
  // 橙系
  { name: "Orange", hex: "#f27f16" }, { name: "Pumpkin", hex: "#e56b1f" },
  { name: "Peach", hex: "#f8c3a3" },
  // 肤色
  { name: "Skin Light", hex: "#f5d5b8" }, { name: "Skin Medium", hex: "#dcab8b" },
  // 黄系
  { name: "Yellow", hex: "#f7d002" }, { name: "Mustard", hex: "#dbab27" },
  { name: "Butter", hex: "#f7e7a0" },
  // 绿系
  { name: "Green", hex: "#2e7d43" }, { name: "Forest", hex: "#1f5136" },
  { name: "Sage", hex: "#a8c0a0" }, { name: "Mint", hex: "#c8e6c4" },
  // 青系
  { name: "Teal", hex: "#227d8f" }, { name: "Aqua", hex: "#7fd0d6" },
  // 蓝系
  { name: "Blue", hex: "#2858a6" }, { name: "Navy", hex: "#1c2e52" },
  { name: "Sky", hex: "#8fc3e8" }, { name: "Baby Blue", hex: "#c9e2f2" },
  // 紫系
  { name: "Purple", hex: "#6b3fa0" }, { name: "Lavender", hex: "#c5b3e0" },
  { name: "Plum", hex: "#5c3358" },
  // 棕系
  { name: "Brown", hex: "#7a4a2b" }, { name: "Chocolate", hex: "#4c3018" },
  { name: "Taupe", hex: "#a89383" }, { name: "Camel", hex: "#c9a06a" },
  { name: "Coffee", hex: "#6f5545" },
  // 大地
  { name: "Sand", hex: "#e3d1b1" }, { name: "Cream", hex: "#f5efe0" },
  { name: "Olive", hex: "#8a8457" }, { name: "Moss", hex: "#5d6b4a" },
  // 灰阶 + 黑白
  { name: "White", hex: "#f9f9f7" }, { name: "Ivory", hex: "#efe9dc" },
  { name: "Silver", hex: "#c9c9c9" }, { name: "Grey", hex: "#8f8f8f" },
  { name: "Charcoal", hex: "#4a4a4a" }, { name: "Black", hex: "#1e1e1e" },
];

const PALETTE_RGB = PALETTE.map(c => hexToRgb(c.hex));

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// 人眼加权距离（绿最敏感）
function colorDist(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

function nearestYarn(rgb) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < PALETTE_RGB.length; i++) {
    const d = colorDist(rgb, PALETTE_RGB[i]);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

// ---- 状态 ----
// symbols：cross stitch 惯例的符号网格（每色一格符号，方便数针）；mode: crochet|crossstitch
const state = { img: null, grid: null, cols: 60, rows: 0, style: "tapestry", symbols: false };
const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+△○◇□";

// ---- 上传 → 网格化（cells 存量化后的色板索引）----
function buildGrid(img, cols) {
  const scale = cols / img.width;
  const rows = Math.max(1, Math.round(img.height * scale));
  const off = document.createElement("canvas");
  off.width = cols; off.height = rows;
  const ctx = off.getContext("2d");
  ctx.drawImage(img, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      row.push(nearestYarn([data[i], data[i + 1], data[i + 2]]));
    }
    cells.push(row);
  }
  return { cols, rows, cells };
}

// filet 模式：按色板色亮度阈值化到黑白
function toFilet(grid) {
  const out = { cols: grid.cols, rows: grid.rows, cells: [] };
  for (const row of grid.cells) {
    out.cells.push(row.map(idx => {
      const [r, g, b] = PALETTE_RGB[idx];
      return (r + g + b) / 3 < 128 ? "B" : "W";
    }));
  }
  return out;
}

// ---- 渲染 ----
function renderChart() {
  const wrap = document.getElementById("chart");
  wrap.innerHTML = "";
  if (!state.grid) return;
  const g = state.style === "filet" ? toFilet(state.grid) : state.grid;
  const canvas = document.createElement("canvas");
  const cellPx = Math.max(10, Math.min(24, Math.floor(900 / g.cols)));
  canvas.width = g.cols * cellPx;
  canvas.height = g.rows * cellPx;
  const ctx = canvas.getContext("2d");
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const cell = g.cells[r][c];
      const fill = state.style === "filet"
        ? (cell === "B" ? "#1e1e1e" : "#f9f9f7")
        : PALETTE[cell].hex;
      ctx.fillStyle = fill;
      ctx.fillRect(c * cellPx, r * cellPx, cellPx - 1, cellPx - 1);
      // filet 实心格画 X（网状针标识）
      if (state.style === "filet" && cell === "B") {
        ctx.strokeStyle = "rgba(255,255,255,.75)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c * cellPx + 2, r * cellPx + 2);
        ctx.lineTo((c + 1) * cellPx - 3, (r + 1) * cellPx - 3);
        ctx.stroke();
      }
      // 符号网格（cross stitch 惯例：浅色格用深符号、深色格用白符号）
      if (state.symbols && state.style !== "filet") {
        const [pr, pg, pb] = PALETTE_RGB[cell];
        const lum = (pr * 0.3 + pg * 0.6 + pb * 0.1) / 255;
        ctx.fillStyle = lum > 0.55 ? "rgba(0,0,0,.55)" : "rgba(255,255,255,.75)";
        ctx.font = `${Math.max(8, cellPx - 6)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(SYMBOLS[cell % SYMBOLS.length], (c + 0.5) * cellPx, (r + 0.5) * cellPx);
      }
    }
  }
  // 行号（左侧）
  ctx.font = `${Math.max(8, cellPx - 4)}px sans-serif`;
  ctx.fillStyle = "#555";
  const rowStep = g.rows > 60 ? 5 : 1;
  for (let r = 0; r < g.rows; r += rowStep) {
    ctx.fillText(String(r + 1), 2, r * cellPx + cellPx - 2);
  }
  // C2C：叠加对角线参考与对角行号（corner-to-corner 的真实读法）
  if (state.style === "c2c") {
    const total = g.cols + g.rows - 1;
    ctx.strokeStyle = "rgba(0,0,0,.14)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const step = total > 120 ? 10 : total > 60 ? 5 : 1;
    for (let d = 0; d < total; d += step) {
      // 对角线 d：从 (d,0) 向 (d-k, k)，画在网格范围内部
      ctx.beginPath();
      let started = false;
      for (let k = 0; k <= Math.min(d, g.rows - 1); k++) {
        const c = d - k;
        if (c < 0 || c >= g.cols) continue;
        const x = (c + 1) * cellPx - 1, y = k * cellPx;
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      if (started) ctx.stroke();
      // 对角行号标在这条对角线的右上端
      const cTop = Math.min(d, g.cols - 1), rTop = d - cTop;
      if (rTop >= 0 && rTop < g.rows) {
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.font = `${Math.max(9, cellPx - 5)}px sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(String(d + 1), cTop * cellPx + cellPx - 2, rTop * cellPx + Math.max(9, cellPx - 5));
        ctx.setLineDash([4, 4]);
      }
    }
    ctx.setLineDash([]);
  }
  wrap.appendChild(canvas);
  renderLegend(g);
  document.getElementById("chartSection").style.display = "block";
}

function renderLegend(g) {
  const el = document.getElementById("legend");
  if (state.style === "filet") {
    el.innerHTML = "<b>Legend:</b> ■ solid block = 3 double crochet · □ open block = 3 chains";
    return;
  }
  const counts = new Map();
  for (const row of g.cells) for (const c of row) counts.set(c, (counts.get(c) || 0) + 1);
  const used = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  let total = g.cols * g.rows;
  el.innerHTML = used.map(([idx, n]) =>
    `<span class="lg"><i style="background:${PALETTE[idx].hex}"></i>${PALETTE[idx].name} <em>${n} (${Math.round(n * 100 / total)}%)</em></span>`
  ).join("");
  document.getElementById("stats").textContent =
    `${g.cols} × ${g.rows} squares · ${used.length} colors · ${total} stitches total`;
}

// C2C：把行号标注改成斜向读法提示
function styleHint() {
  const hints = {
    tapestry: "Tapestry (rows): start at row 1 and work across in single crochet — right-side rows read right-to-left on the chart, wrong-side rows are its mirror.",
    c2c: "C2C (corner-to-corner): start at the bottom-right corner and work diagonal rows upward (the dashed guides with numbers on the chart mark each diagonal).",
    filet: "Filet: solid blocks are 3 double crochet, open blocks are 3 chains — the whole picture uses just two block types.",
  };
  document.getElementById("styleHint").textContent = hints[state.style] || "";
}

// ---- 事件 ----
document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    state.img = img;
    rebuild();
    document.getElementById("editorSection").style.display = "block";
  };
  img.src = URL.createObjectURL(file);
});

function rebuild() {
  if (!state.img) return;
  state.grid = buildGrid(state.img, state.cols);
  renderChart();
  styleHint();
}

document.getElementById("cols").addEventListener("change", e => {
  state.cols = +e.target.value; rebuild();
});
document.querySelectorAll("input[name=style]").forEach(r =>
  r.addEventListener("change", e => { state.style = e.target.value; renderChart(); styleHint(); })
);
const symBox = document.getElementById("symbols");
if (symBox) {
  // 页面可用 data-symbols="on" 设默认（cross stitch 页开）
  if (document.body.dataset.symbols === "on") { symBox.checked = true; state.symbols = true; }
  symBox.addEventListener("change", e => { state.symbols = e.target.checked; renderChart(); });
}
document.getElementById("printBtn").addEventListener("click", () => window.print());

// Looprel lightbox — 点击图片/网格查看大图（1108 hu 需求）
// 覆盖：hero 示例图（img）+ 生成的网格图（canvas → toDataURL）
;(() => {
  const lb = document.createElement("div");
  lb.id = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-label", "Image preview — click anywhere or press Esc to close");
  lb.innerHTML = '<img alt="Preview">';
  document.body.appendChild(lb);
  const img = lb.querySelector("img");

  function open(src) {
    img.src = src;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    img.src = "";
  }
  lb.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  function watch(container, selector) {
    const root = container || document;
    const bind = el => {
      if (el.dataset.lbBound) return;
      el.dataset.lbBound = "1";
      el.style.cursor = "zoom-in";
      el.title = "Click to view full size";
      el.addEventListener("click", () => {
        if (el.tagName === "CANVAS") open(el.toDataURL("image/png"));
        else open(el.src);
      });
    };
    // 已存在的
    root.querySelectorAll(selector).forEach(bind);
    // 动态生成的（网格 canvas 是上传后才创建的）
    new MutationObserver(muts => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (!(n instanceof HTMLElement)) continue;
        if (n.matches(selector)) bind(n);
        n.querySelectorAll?.(selector).forEach(bind);
      }
    }).observe(root === document ? document.body : root, { childList: true, subtree: true });
  }

  // hero 示例图
  watch(document, "img.hero-shot");
  // 生成的网格（crochet 系页与 QR 页容器不同，都覆盖）
  watch(document.getElementById("chart"), "#chart canvas");
  watch(document.getElementById("qrgrid"), "#qrgrid canvas");
})();

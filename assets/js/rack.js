/* 행거 위젯 — [data-rack] 요소 안에 5색 맨투맨을 건다. (레퍼런스 영상의 동작 그대로)
   기본: 옆에서 본 좁은 모습 / 마우스·포커스: 정면으로 바뀌며 커진다 / 클릭: 바로 상세로 이동.
   휴대폰(마우스 없음): 첫 탭 = 정면 펼침, 같은 옷 한 번 더 탭 = 상세로 이동.
   다른 사이트에 넣을 때도 이 파일 + data.js + site.css 만 있으면 된다. */
(function () {
  const D = window.KSEP;
  const touch = window.matchMedia("(hover: none)").matches;

  // 레일에 걸린 가는 철사 고리. 옷걸이 몸체는 그리지 않는다 — 옷 안에 숨어 있는 것처럼 보이게.
  // 철사 끝은 옷깃 뒤(옷 이미지 아래 층)로 몇 px 들어가서 목 뒤판에 가려진다.
  const HOOK = '<svg class="rack-hook" viewBox="0 0 12 46" aria-hidden="true">' +
    '<path d="M6 46 V13 C6 7.5 10.6 7.4 10.6 4 C10.6 1.6 8.8 .6 7 1.2" fill="none" stroke="#8d9094" stroke-width="1.4" stroke-linecap="round"/></svg>';

  function build(root) {
    const link = root.dataset.link || "product.html";
    root.innerHTML =
      '<div class="rack-rail"></div>' +
      '<div class="rack-scroll"><div class="rack-row" role="list"></div></div>' +
      '<div class="rack-info">' +
      '  <div><div class="eyebrow">Crewneck</div>' +
      '  <p class="rack-info-name"></p><p class="rack-info-color"></p></div>' +
      '  <a class="btn-line rack-more" href="#">자세히 보기 <span aria-hidden="true">→</span></a>' +
      '</div>';

    const row = root.querySelector(".rack-row");
    const nameEl = root.querySelector(".rack-info-name");
    const colorEl = root.querySelector(".rack-info-color");
    const more = root.querySelector(".rack-more");
    let current = null;

    const show = (c) => {
      nameEl.textContent = D.product.nameKo;
      colorEl.innerHTML = `<span class="swatch" style="background:${c.swatch}"></span>${c.name} / ${c.ko}`;
      more.href = `${link}?color=${c.id}`;
    };

    const items = D.colors.map((c) => {
      const b = document.createElement("a");
      b.className = "rack-item";
      b.href = `${link}?color=${c.id}`;
      b.setAttribute("role", "listitem");
      b.setAttribute("aria-label", `${D.product.nameKo} ${c.ko} — 상세 보기`);
      b.dataset.id = c.id;
      b.innerHTML = HOOK +
        '<span class="rack-garment">' +
        `<img class="g-side" src="${D.img(c.id, "side")}" alt="" draggable="false">` +
        `<img class="g-front" src="${D.img(c.id, "front")}" alt="${D.product.nameKo} ${c.ko} 정면" draggable="false">` +
        "</span>";
      row.appendChild(b);

      // 사진 비율에서 접힘·펼침 폭을 계산한다. 정면은 옆모습보다 --grow 배 크게 그린다.
      const side = b.querySelector(".g-side"), front = b.querySelector(".g-front");
      const fit = () => {
        const cs = getComputedStyle(root);
        const h = side.getBoundingClientRect().height || parseFloat(cs.getPropertyValue("--h")) || 300;
        const grow = parseFloat(cs.getPropertyValue("--grow")) || 1.12;
        if (side.naturalWidth) b.style.setProperty("--ws", Math.round(h * side.naturalWidth / side.naturalHeight * 0.94) + "px");
        if (front.naturalWidth) b.style.setProperty("--wf", Math.round(h * grow * front.naturalWidth / front.naturalHeight) + "px");
      };
      side.addEventListener("load", fit); front.addEventListener("load", fit);
      if (side.complete && front.complete) fit();
      b._fit = fit;

      const open = () => {
        items.forEach((x) => x !== b && x.classList.remove("is-open"));
        b.classList.add("is-open"); current = b; show(c);
      };
      b.addEventListener("mouseenter", open);
      b.addEventListener("focus", open);
      b.addEventListener("click", (e) => {
        // 마우스: 링크 그대로 상세로 간다. 휴대폰: 처음 누른 옷은 펼치기만 한다.
        if (touch && current !== b) {
          e.preventDefault(); open();
          b.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      });
      return b;
    });

    // 행거에서 마우스가 떠나면 전부 옆모습으로 돌아간다 (영상과 같은 동작)
    if (!touch) row.addEventListener("mouseleave", () => {
      items.forEach((x) => x.classList.remove("is-open"));
      current = null;
    });

    // 키보드: 좌우 화살표로 옷 사이 이동, Enter 로 상세
    row.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length].focus();
    });

    window.addEventListener("resize", () => items.forEach((b) => b._fit()));
    show(D.colors[0]);
  }

  document.querySelectorAll("[data-rack]").forEach(build);
})();

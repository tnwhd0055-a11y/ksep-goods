/* 메인 — 행거 아래 '지금 보는 옷' 줄, 자수·나염 그리드, 구매 안내를 채운다. */
(function () {
  const D = window.KSEP, P = D.product, S = P.sale;
  const $ = (id) => document.getElementById(id);

  const now = (c) => {
    $("rail-sw").style.background = c.swatch;
    $("rail-name").textContent = `${P.nameKo} — ${c.ko}`;
    $("rail-now").href = `product.html?color=${c.id}`;
  };
  document.querySelector("[data-rail]").addEventListener("railfocus", (e) => now(e.detail));
  now(D.color(D.rail ? D.rail[0] : D.colors[0].id));

  $("grid").innerHTML = D.colors.map((c) => `
    <a class="h-card" href="product.html?color=${c.id}">
      <div class="shot"><img src="${D.img(c.id, "model-front")}" alt="${P.nameKo} ${c.ko} 착용" loading="lazy"></div>
      <div class="h-card-meta"><span>${P.nameKo} — ${c.ko}</span><span>${c.price} · ${c.pair}</span></div>
    </a>`).join("");

  $("buy-until").textContent = `~ ${S.until}`;
  $("buy-list").innerHTML = `
    ${D.colors.map((c) => `<dt>${c.ko}</dt><dd>${c.price} · ${c.pair}</dd>`).join("")}
    <dt>증정</dt><dd>${P.gift}</dd>
    <dt>사이즈</dt><dd>${P.sizes.map((z) => `${z.label} (${z.chest}) ${z.qty}`).join(" · ")}</dd>
    <dt>판매 기간</dt><dd>~ ${S.until}</dd>
    <dt>구매 방법</dt><dd>구매하기 → 신청서 작성 → ${S.method} → ${S.delivery}</dd>
    <dt>결제 계좌</dt><dd>${S.account} (${S.holder})</dd>`;

  // 구매하기: 신청 폼으로. 주소가 아직 없으면 잠가 둔다 (data.js 의 sale.formUrl)
  const b = $("buy-btn");
  if (S.formUrl) b.href = S.formUrl;
  else {
    b.setAttribute("aria-disabled", "true");
    b.removeAttribute("target");
    $("buy-btn-label").textContent = "구매 신청 준비 중";
    b.addEventListener("click", (e) => e.preventDefault());
  }
})();

/* 상세페이지 — ?color= 로 색을 받아 사진·이름을 채운다. (레퍼런스 영상의 상세 구성 그대로)
   색을 바꾸면 주소도 같이 바뀌어서, 그 상태로 링크를 공유하거나 새로고침해도 같은 색이 열린다. */
(function () {
  const D = window.KSEP, P = D.product, S = P.sale;
  const $ = (id) => document.getElementById(id);
  let color = D.color(new URLSearchParams(location.search).get("color"));
  let photos = [], idx = 0;
  const pad2 = (n) => String(n).padStart(2, "0");

  // 한 색의 사진 묶음 — 사진 아래 캡션과 썸네일 이름도 여기서 나온다
  const shots = (c) => [
    { src: D.img(c.id, "model-front"),  cap: "정면 착용",     fit: "cover",   bg: "#fff" },
    { src: D.img(c.id, "model-side"),   cap: "측면 착용",     fit: "cover",   bg: "#fff" },
    { src: D.img(c.id, "front"),        cap: "제품",          fit: "contain", bg: "var(--panel)", pad: true },
    { src: D.img(c.id, "detail-print"), cap: c.id === "emb" ? "자수 디테일" : "프린트 디테일", fit: "cover", bg: "var(--panel)" },
  ].map((p) => ({ ...p, alt: `${P.nameKo} ${c.ko} ${p.cap}` }));

  // ── 고정 문구 ──
  $("cat").textContent = P.category;
  $("no").textContent = P.no;
  $("crumb-no").textContent = P.no;
  $("name").textContent = P.nameKo;
  $("desc").textContent = P.lead;
  $("spec").innerHTML =
    `<div><span class="eyebrow">Size</span><p>${P.sizes.map((z) => `${z.label} (${z.chest})`).join(" · ")}</p></div>` +
    `<div><span class="eyebrow">Price</span><p id="price"></p></div>`;
  $("acc").innerHTML = `
    <details><summary>스타일링 노트</summary><div class="acc-body">${P.fabric}과 ${P.fit}. ${P.desc}</div></details>
    <details><summary>사이즈 안내</summary><div class="acc-body"><dl>${P.sizes.map((z) => `<dt>${z.label} (${z.chest})</dt><dd>${z.qty}</dd>`).join("")}</dl></div></details>
    <details><summary>구매 안내</summary><div class="acc-body">
      <dl>${D.colors.map((c) => `<dt>${c.ko}</dt><dd>${c.price} · ${c.pair}</dd>`).join("")}
      <dt>증정</dt><dd>${P.gift}</dd>
      <dt>판매 기간</dt><dd>~ ${S.until}</dd>
      <dt>구매 방법</dt><dd>구매하기 → 신청서 작성 → ${S.method} → ${S.delivery}</dd>
      <dt>결제 계좌</dt><dd>${S.account} (${S.holder})</dd></dl></div></details>`;
  $("ang-text").textContent = P.desc;
  $("piece-text").textContent = `${P.fabric}과 ${P.fit}. ${P.lead}`;

  // ── 로고 방식 선택 (나염 / 자수) ──
  $("dots").innerHTML = D.colors.map((c) =>
    `<button class="type-chip" type="button" data-id="${c.id}" aria-pressed="false">${c.ko}</button>`).join("");
  $("dots").addEventListener("click", (e) => {
    const b = e.target.closest(".type-chip");
    if (!b) return;
    color = D.color(b.dataset.id);
    history.replaceState(null, "", `?color=${color.id}`);
    render();
  });

  // ── 갤러리 ──
  function setMain(i) {
    idx = (i + photos.length) % photos.length;
    const p = photos[idx], img = $("main-img");
    img.style.opacity = 0;
    img.onload = () => (img.style.opacity = 1);
    img.src = p.src; img.alt = p.alt;
    img.style.objectFit = p.fit;
    img.style.padding = p.pad ? "10%" : "0";
    $("main").style.background = p.bg;
    $("count").textContent = `${pad2(idx + 1)} / ${pad2(photos.length)}`;
    $("cap").textContent = `${pad2(idx + 1)} · ${p.cap}`;
    $("cap-no").textContent = `Photo / ${pad2(idx + 1)}`;
    document.querySelectorAll(".thumb").forEach((t, j) => t.setAttribute("aria-current", j === idx ? "true" : "false"));
  }

  function render() {
    photos = shots(color);
    document.title = `${P.nameKo} (${color.ko}) — KSEP`;
    // 가격은 고른 버전(나염/자수)에 따라 바뀐다
    $("price").innerHTML = `${color.price}<small>${color.pair} · ${P.gift}</small>`;
    document.querySelectorAll(".type-chip").forEach((d) => d.setAttribute("aria-pressed", d.dataset.id === color.id ? "true" : "false"));

    $("thumbs").innerHTML = photos.map((p, i) =>
      `<button class="thumb" type="button" role="listitem" data-i="${i}" aria-label="${p.alt}">
         <span class="t-img" style="background:${p.bg}"><img src="${p.src}" alt="" style="object-fit:${p.fit};${p.pad ? "padding:8%" : ""}"></span>
         <small>${p.cap}</small></button>`).join("");
    setMain(0);

    $("ang-a").src = D.img(color.id, "model-front"); $("ang-a").alt = photos[0].alt;
    $("ang-b").src = D.img(color.id, "model-side");  $("ang-b").alt = photos[1].alt;
    $("piece-img").src = D.img(color.id, "front");   $("piece-img").alt = photos[2].alt;

    const det = [["print", color.id === "emb" ? "가슴 자수" : "가슴 프린트", ""]];   // 라벨 사진(목·밑단)은 라벨을 없애기로 해서 뺐다 (2026-10-29)
    $("details").innerHTML = det.map(([k, t, cls]) =>
      `<button type="button" class="${cls}" data-src="${D.img(color.id, "detail-" + k)}" aria-label="${t} 크게 보기">
         <img src="${D.img(color.id, "detail-" + k)}" alt="${P.nameKo} ${color.ko} ${t}" loading="lazy"></button>`).join("");

    // 지금 보는 색은 빼고 나머지 네 색만
    $("others").innerHTML = D.colors.filter((c) => c.id !== color.id).map((c) => `
      <a class="edit-card" href="product.html?color=${c.id}">
        <div class="edit-card-img"><img src="${D.img(c.id, "model-front")}" alt="${P.nameKo} ${c.ko}" loading="lazy"></div>
        <div class="edit-card-meta"><span>${P.nameKo} — ${c.ko}</span><span>${c.name}</span></div>
      </a>`).join("");
  }

  $("thumbs").addEventListener("click", (e) => { const t = e.target.closest(".thumb"); if (t) setMain(+t.dataset.i); });

  // ── 라이트박스 ──
  const lb = $("lb"); let lbList = [], lbI = 0, lastFocus = null;
  function lbShow(i) {
    lbI = (i + lbList.length) % lbList.length;
    $("lb-img").src = lbList[lbI].src; $("lb-img").alt = lbList[lbI].alt;
    $("lb-count").textContent = `${pad2(lbI + 1)} / ${pad2(lbList.length)}`;
    $("lb-prev").hidden = $("lb-next").hidden = lbList.length < 2;
  }
  function lbOpen(list, i) {
    lbList = list; lastFocus = document.activeElement;
    lb.classList.add("is-open"); document.body.style.overflow = "hidden";
    lbShow(i); $("lb-close").focus();
  }
  function lbClose() {
    lb.classList.remove("is-open"); document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  $("main").addEventListener("click", () => lbOpen(photos, idx));
  // ── 구매하기: 신청 폼으로. 주소가 아직 없으면 잠가 둔다 ──
  if (S.formUrl) $("buy").href = S.formUrl;
  else {
    $("buy").setAttribute("aria-disabled", "true");
    $("buy").removeAttribute("target");
    $("buy-label").textContent = "구매 신청 준비 중";
    $("buy").addEventListener("click", (e) => e.preventDefault());
  }
  $("details").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const list = [...$("details").querySelectorAll("button")].map((x) => ({ src: x.dataset.src, alt: x.querySelector("img").alt }));
    lbOpen(list, list.findIndex((x) => x.src === b.dataset.src));
  });
  $("lb-close").addEventListener("click", lbClose);
  $("lb-prev").addEventListener("click", () => lbShow(lbI - 1));
  $("lb-next").addEventListener("click", () => lbShow(lbI + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowRight") lbShow(lbI + 1);
    if (e.key === "ArrowLeft") lbShow(lbI - 1);
    if (e.key === "Tab") {  // 포커스를 창 안에 가둔다
      const f = [...lb.querySelectorAll("button:not([hidden])")];
      e.preventDefault();
      f[(f.indexOf(document.activeElement) + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  render();
})();

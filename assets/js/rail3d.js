/* 회전 행거 — [data-rail] 안에 5색 맨투맨을 건다.
   옷마다 힉스필드로 만든 360° 턴테이블 영상에서 뽑은 연속 사진(assets/turn/{색}/NN.webp)을
   캔버스에 한 장씩 그려서 실제로 도는 것처럼 보이게 한다.
     · 평소: 레일에 옆모습으로 걸려 있다 (레퍼런스 영상과 같은 진열)
     · 커서를 올리거나 포커스: 정면까지 돌아온다 / 떠나면 다시 옆모습으로
     · 정면인 옷을 좌우로 끌면 360° 돌려볼 수 있다. 놓으면 가까운 정면으로 돌아온다
     · 클릭: 상세로 이동. 휴대폰은 첫 탭 = 정면으로 돌리기, 한 번 더 탭 = 상세
   돌면서 옷 폭이 바뀌면 칸 폭도 같이 바뀌어서 옆 옷들이 밀려난다.
   프레임 정보(장수, 비율, 프레임별 옷 폭)는 assets/turn/turn.js 가 window.KSEP_TURN 에 둔다. */
(function () {
  const D = window.KSEP, T = window.KSEP_TURN || {};
  const touch = window.matchMedia("(hover: none)").matches;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PUFF = 2;   // 옆모습 굵기 배율 (영상 그대로 = 1)

  // 레일에 걸린 가는 철사 고리. 끝이 옷깃 바로 위에서 멈춰서 옷 안으로 들어간 것처럼 보인다.
  const HOOK = '<svg class="rail-hook" viewBox="0 0 14 34" aria-hidden="true">' +
    '<path d="M7 34 V12 C7 7 12 7 12 3.8 C12 1.6 10.2 .6 8.2 1.1" fill="none" stroke="#9a9ea2" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function build(root) {
    const link = root.dataset.link || "product.html";
    root.innerHTML = '<div class="rail-bar"></div><div class="rail-row" role="list"></div>';
    const row = root.querySelector(".rail-row");
    // 정면으로 돈 옷이 바뀌면 알린다 (메인의 '지금 보는 색' 줄이 듣는다)
    const emit = (c) => root.dispatchEvent(new CustomEvent("railfocus", { detail: c }));

    // D.rail = 거는 순서(버전 id). 같은 버전을 여러 벌 걸 수 있다 — 사진은 브라우저가 한 번만 받는다
    const items = (D.rail || D.colors.map((c) => c.id)).map((id) => D.color(id)).filter((c) => T[c.turn || c.id]).map((c, k) => {
      const key = c.turn || c.id;
      const M = T[key];                      // { n, aspect, widths[], side }
      const a = document.createElement("a");
      a.className = "rail-item";
      a.href = `${link}?color=${c.id}`;
      a.setAttribute("role", "listitem");
      a.setAttribute("aria-label", `${D.product.nameKo} ${c.ko} — 상세 보기`);
      a.draggable = false;
      // 캔버스 = 회전 프레임, rail-still = 레일에 걸려 있을 때 보이는 선명한 옆모습 사진 (둘을 겹쳐 놓고 서로 넘긴다)
      a.innerHTML = HOOK + '<canvas aria-hidden="true"></canvas>' +
        (M.stillW ? '<img class="rail-still" alt="" aria-hidden="true" draggable="false">' : '') +
        '<span class="rail-shadow"></span>';
      // 같은 버전이 연달아 걸리면 한 묶음(rail-group)으로 모으고, 묶음 아래 가운데에 '나염 라인' 같은 이름을 단다.
      // 옆모습만 봐선 자수·나염이 구분되지 않기 때문이다.
      let grp = row.lastElementChild;
      if (!grp || grp.dataset.id !== c.id) {
        grp = document.createElement("div");
        grp.className = "rail-group";
        grp.dataset.id = c.id;
        grp.innerHTML = '<span class="rail-tag">' + c.ko + ' 라인</span>';
        row.appendChild(grp);
      }
      grp.insertBefore(a, grp.querySelector(".rail-tag"));

      const cv = a.querySelector("canvas"), g = cv.getContext("2d");
      const st = a.querySelector(".rail-still");
      let stillReady = false;
      const n = M.n, side = M.side;          // side = 옆모습 프레임 번호
      const frames = new Array(n);
      let loaded = 0, pos = side, target = side, raf = 0, drawn = -1;

      const src = (i) => `assets/turn/${key}/${String(i).padStart(2, "0")}.webp`;
      const wrap = (i) => ((Math.round(i) % n) + n) % n;

      const draw = () => {
        const i = wrap(pos), im = frames[i];
        if (im && im.complete && im.naturalWidth && i !== drawn) {
          if (cv.width !== im.naturalWidth) { cv.width = im.naturalWidth; cv.height = im.naturalHeight; }
          g.clearRect(0, 0, cv.width, cv.height);
          g.drawImage(im, 0, 0);
          drawn = i;
        }
        // 옆모습이 판자처럼 얇아 보여서 옆으로 부풀린다. 정확히 옆일 때 PUFF 배, 정면으로 갈수록 1배.
        // 옷 폭 기준으로 정하므로 앞·뒤 어느 쪽 옆모습이든 똑같이 적용되고, 세제곱이라 비스듬한 각도는 거의 안 늘어난다.
        const w = M.widths[i], t = Math.min(1, Math.max(0, (1 - w) / (1 - M.widths[side]))) ** 3;
        const sx = 1 + ((M.puff || PUFF) - 1) * t;   // 버전마다 옆모습 굵기가 달라서 배율은 turn.js 의 puff 를 쓴다
        cv.style.transform = `translateX(-50%) scaleX(${sx.toFixed(3)})`;
        // 옆모습 근처(±1.5프레임)에서는 선명한 정지 사진으로 넘긴다. 걸려 있을 땐 사진만, 돌기 시작하면 영상 프레임으로.
        const dd = (((pos - side) % n) + n) % n, d = Math.min(dd, n - dd);
        const op = stillReady ? Math.min(1, Math.max(0, 1 - d / 1.5)) : 0;
        if (st) { st.style.opacity = op.toFixed(3); cv.style.opacity = (1 - op).toFixed(3); }
        // 칸 폭 = 지금 보이는 옷 폭(부풀린 만큼 포함). 옆모습이면 좁고 정면이면 넓다
        const h = cv.getBoundingClientRect().height || 300;
        const wf = h * M.aspect * w * sx, ws = st ? h * M.aspect * M.stillW : wf;
        a.style.setProperty("--w", Math.round(wf + (ws - wf) * op + 8) + "px");
        // 고리 끝을 이 프레임의 옷깃 높이에 맞춘다 (옷이 돌면서 깃 높이가 조금씩 바뀐다)
        if (M.tops) a.style.setProperty("--neck", Math.round(h * M.tops[i] + 2) + "px");
      };

      if (st) { st.onload = () => { stillReady = true; draw(); }; st.src = `assets/turn/${key}/side.webp`; }

      // 옆모습·정면부터 먼저 받고, 나머지는 그다음에 받는다
      const order = [side, 0, ...Array.from({ length: n }, (_, i) => i).filter((i) => i !== side && i !== 0)];
      order.forEach((i) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => { loaded++; if (i === wrap(pos)) { drawn = -1; draw(); } };
        im.src = src(i);
        frames[i] = im;
      });

      // pos 를 target 까지 일정 속도로 옮긴다 (프레임 수 기준, 4분의 1바퀴 ≈ 0.7초)
      const speed = n / 4 / 0.7;
      let last = 0;
      const tick = (t) => {
        const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
        last = t;
        const d = target - pos, step = speed * dt;
        pos = Math.abs(d) <= step ? target : pos + Math.sign(d) * step;
        draw();
        if (pos !== target) raf = requestAnimationFrame(tick);
        else { raf = 0; last = 0; }
      };
      const go = (to) => {
        target = to;
        if (still) { pos = to; draw(); return; }
        if (!raf) raf = requestAnimationFrame(tick);
      };

      // 정면 = side 에서 가까운 쪽 0 (옆모습에서 4분의 1바퀴 돌아오는 방향)
      const front = () => (side <= n / 2 ? 0 : n);
      const isOpen = () => a.classList.contains("is-open");
      const open = () => {
        items.forEach((x) => x !== api && x.close());
        a.classList.add("is-open");
        // 지난번 드래그로 다른 각도에 있으면 가장 가까운 정면으로
        go(Math.round(pos / n) * n);
        emit(c);
      };
      const close = () => {
        if (!isOpen()) return;
        a.classList.remove("is-open");
        // 지금 각도에서 가장 가까운 옆모습으로 (돌아가는 거리가 짧은 쪽)
        const base = Math.floor(pos / n) * n;
        const cand = [base + side, base - n + side, base + n + side];
        go(cand.reduce((b, x) => (Math.abs(x - pos) < Math.abs(b - pos) ? x : b)));
      };

      // ── 드래그로 360° 돌려보기 ──
      let drag = null;
      a.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        // 누르는 순간 이미 정면이었는지 기억한다. 탭하면 focus 가 click 보다 먼저 와서 옷을 열어버리기 때문
        a._wasOpen = isOpen();
        drag = { x: e.clientX, p: pos, moved: false, id: e.pointerId };
      });
      a.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        if (!drag.moved && Math.abs(dx) < 6) return;
        if (!drag.moved) { drag.moved = true; a.setPointerCapture(e.pointerId); if (!isOpen()) open(); }
        cancelAnimationFrame(raf); raf = 0; last = 0;
        pos = target = drag.p - dx / 9;      // 9px 마다 한 프레임
        draw();
        e.preventDefault();
      });
      const endDrag = () => {
        if (!drag) return;
        const moved = drag.moved; drag = null;
        if (moved) {
          a._justDragged = true; setTimeout(() => (a._justDragged = false), 0);
          go(Math.round(pos / n) * n);       // 가까운 정면으로 마무리
        }
      };
      a.addEventListener("pointerup", endDrag);
      a.addEventListener("pointercancel", endDrag);

      a.addEventListener("mouseenter", () => { if (!touch) open(); });
      a.addEventListener("focus", open);
      a.addEventListener("click", (e) => {
        if (a._justDragged) { e.preventDefault(); return; }
        // 휴대폰: 처음 누른 옷은 정면으로 돌리기만 한다
        if (touch && !a._wasOpen) { e.preventDefault(); open(); a.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }
      });

      const api = { el: a, color: c, open, close, go, isOpen, get side() { return side; }, front, redraw: () => { drawn = -1; draw(); } };
      draw();
      return api;
    });

    // 행거에서 커서가 떠나면 전부 옆모습으로 (레퍼런스 영상과 같은 동작)
    if (!touch) row.addEventListener("mouseleave", () => items.forEach((x) => x.close()));

    // 키보드: 좌우 화살표로 옷 사이 이동, Enter 로 상세
    row.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const i = items.findIndex((x) => x.el === document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      items[(i + (e.key === "ArrowRight" ? 1 : -1) + items.length) % items.length].el.focus();
    });

    window.addEventListener("resize", () => items.forEach((x) => x.redraw()));

    // 처음 들어왔을 때 한 번: 옷들이 차례로 20°쯤 고개를 돌렸다 돌아온다 (돌아간다는 걸 알려준다).
    // 끝까지 정면으로 돌리면 다섯 벌이 한꺼번에 넓어져 레일 밖으로 넘친다.
    if (!still) {
      let touched = false;
      row.addEventListener("pointerenter", () => (touched = true), { once: true });
      items.forEach((x, k) => {
        setTimeout(() => { if (!touched && !x.isOpen()) x.go(x.side - 2); }, 600 + k * 220);
        setTimeout(() => { if (!touched && !x.isOpen()) x.go(x.side); }, 1300 + k * 220);
      });
    }
    root._items = items;
  }

  document.querySelectorAll("[data-rail]").forEach(build);
})();

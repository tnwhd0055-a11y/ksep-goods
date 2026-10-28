/* 첫 화면 — 학회 마크와 '한국운동생리학회 굿즈샵'이 화면을 꽉 채우고 (SIK 인트로처럼),
   스크롤(또는 클릭·키)하면 새떼가 오른쪽 아래에서 몰려와 화면을 휩쓸고 지나가며 쇼핑몰이 드러난다.
   새는 _gen/birds.cjs 가 사진에서 오려 만든 스프라이트(assets/img/birds.png + birds.js).
   탭(브라우저 창)마다 한 번만 뜬다. ?nointro=1 이면 건너뛴다 (화면 확인용). */
(function () {
  const intro = document.getElementById("intro");
  const cv = document.getElementById("flock");
  if (!intro || !cv) return;
  const SEEN = "ksep:intro-seen";
  const skip = /[?&]nointro=1/.test(location.search) || (() => { try { return sessionStorage.getItem(SEEN); } catch (e) { return false; } })();
  const done = () => {
    intro.remove(); cv.remove();
    document.documentElement.classList.remove("intro-lock");
    try { sessionStorage.setItem(SEEN, "1"); } catch (e) {}
  };
  if (skip) { done(); return; }

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const B = window.KSEP_BIRDS || [];
  const sheet = new Image();
  sheet.src = "assets/img/birds.png";
  document.documentElement.classList.add("intro-lock");     // 인트로가 떠 있는 동안 아래 페이지가 스크롤되지 않게

  const g = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const size = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = () => Math.floor(Math.random() * B.length);
  const base = () => Math.max(0.32, Math.min(0.62, W / 2400));   // 스프라이트(원본 2배) → 화면 크기 배율

  // 새 한 마리 그리기. dir: 진행 방향(-1 왼쪽, 1 오른쪽). 까마귀 사진은 오른쪽을 보고 있어 왼쪽으로 갈 땐 뒤집는다.
  const drawBird = (b, x, y, t, dir, tilt) => {
    const s = B[b.i]; if (!s) return;
    const k = b.z * base();
    const w = s.w * k, h = s.h * k;
    const flap = 0.72 + 0.28 * Math.sin(t * b.f + b.ph);         // 날갯짓 — 세로로만 접었다 편다
    g.save();
    g.globalAlpha = b.a;
    if (b.z > 1.45) g.filter = "blur(1.6px)";                     // 카메라 바로 앞을 지나는 새는 살짝 흐리게 (거리감)
    g.translate(x, y);
    g.rotate(tilt);
    g.scale(s.k === "crow" && dir < 0 ? -1 : 1, flap);
    g.drawImage(sheet, s.x, s.y, s.w, s.h, -w / 2, -h / 2, w, h);
    g.restore();
  };

  // ── 기다리는 동안: 멀리서 몇 마리가 천천히 지나간다 ──
  const idle = Array.from({ length: 6 }, (_, n) => ({
    i: pick(), z: rnd(0.28, 0.5), a: rnd(0.25, 0.45), f: rnd(9, 12), ph: rnd(0, 6),
    x: rnd(-0.2, 1.1), y: rnd(0.08, 0.42), v: rnd(0.018, 0.035), bob: rnd(0, 6),
  }));

  // ── 몰려오는 새떼 ──
  // 오른쪽 아래 화면 밖 → 화면 가운데를 휘어 지나 → 왼쪽 위 화면 밖. 가까운 새(z 큼)일수록 크고 빠르다.
  const flock = Array.from({ length: 74 }, () => {
    const z = 0.38 + Math.pow(Math.random(), 1.7) * 1.7;
    return {
      i: pick(), z, a: Math.min(1, 0.55 + z * 0.35), f: rnd(11, 15) - z * 1.5, ph: rnd(0, 6),
      sx: rnd(1.05, 1.5), sy: rnd(0.5, 1.3),
      cx: rnd(0.3, 0.75), cy: rnd(0.2, 0.75),
      ex: rnd(-0.6, -0.15), ey: rnd(-0.45, 0.35),
      d: Math.pow(Math.random(), 1.3) * 0.75,                     // 출발 시각(초) — 앞쪽이 빽빽하게
      T: 1.55 - (z - 1) * 0.3 + rnd(-0.15, 0.25),                  // 지나가는 데 걸리는 시간(초)
    };
  });
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);
  const bez = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;

  let mode = "idle", t0 = performance.now(), go = 0, raf = 0;
  const frame = (now) => {
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, W, H);
    if (sheet.complete && sheet.naturalWidth) {
      if (mode === "idle") {
        for (const b of idle) {
          const x = (((b.x + t * b.v) % 1.3) + 1.3) % 1.3 - 0.15;
          drawBird(b, x * W, (b.y + Math.sin(t * 0.6 + b.bob) * 0.01) * H, t, 1, 0);
        }
      } else {
        const tt = (now - go) / 1000;
        let alive = 0;
        // 멀리 있는 새부터 그려서 가까운 새가 위에 오게
        for (const b of flock) {
          const u = (tt - b.d) / b.T;
          if (u < 0) { alive++; continue; }
          if (u > 1) continue;
          alive++;
          const e = ease(u), e2 = ease(Math.min(1, u + 0.01));
          const x = bez(b.sx, b.cx, b.ex, e) * W, y = bez(b.sy, b.cy, b.ey, e) * H;
          const vx = bez(b.sx, b.cx, b.ex, e2) * W - x, vy = bez(b.sy, b.cy, b.ey, e2) * H - y;
          // 왼쪽 위로 올라갈수록 머리(왼쪽)를 든다. 캔버스에선 양(+) 회전이 왼쪽을 들어 올린다
          const tilt = Math.max(-0.45, Math.min(0.45, (-vy / (Math.abs(vx) + 1e-3)) * 0.35));
          drawBird(b, x, y, tt, -1, tilt);
        }
        if (!alive) { cancelAnimationFrame(raf); done(); return; }
      }
    }
    raf = requestAnimationFrame(frame);
  };
  flock.sort((a, b) => a.z - b.z);
  raf = requestAnimationFrame(frame);

  // ── 입장 ──
  let entered = false;
  const enter = () => {
    if (entered) return; entered = true;
    if (still) { intro.classList.add("is-gone"); setTimeout(done, 450); return; }
    mode = "flock"; go = performance.now();
    // 새떼가 화면 가운데를 덮는 순간 첫 화면을 걷어낸다 → 새가 지나간 자리에 쇼핑몰이 남는다
    setTimeout(() => intro.classList.add("is-gone"), 650);
    setTimeout(() => {
      intro.style.display = "none";
      document.documentElement.classList.remove("intro-lock");
      window.scrollTo(0, 0);
    }, 1500);
  };
  addEventListener("wheel", (e) => { if (e.deltaY > 0) enter(); }, { passive: true });
  let ty = null;
  addEventListener("touchstart", (e) => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener("touchmove", (e) => { if (ty != null && ty - e.touches[0].clientY > 12) enter(); }, { passive: true });
  addEventListener("keydown", (e) => { if (!entered && ["ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); enter(); } });
  intro.addEventListener("click", enter);
})();

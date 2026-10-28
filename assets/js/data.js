/* KSEP 시그니처 굿즈 — 사이트 전체가 읽는 상품 정보.
   여기 적힌 것만 화면에 나간다. 받은 판매 안내문에 없는 가격·소재·치수는 넣지 않는다. */
window.KSEP = {
  product: {
    no: "01",
    category: "TOPS / CREWNECK",
    title: ["Signature", "crewneck."],
    nameKo: "KSEP 한정판 맨투맨",
    lead: "KSEP 학회 공동체의 소속감을 담은 시그니처 굿즈입니다.",
    desc: "연구실, 강의실, 학술대회 등 어디서나 어울리는 회색으로 만들었습니다.",
    // 가격은 버전마다 다르다 → 아래 colors 의 price / pair. 여기엔 공통 혜택만
    gift: "선착순 구매자에게 KSEP Annual Meeting Book 증정",
    sizes: [
      { label: "M", chest: "100", qty: "49개" },
      { label: "L", chest: "105", qty: "20개" },
    ],
    fabric: "오래 입어도 변형이 적은 탄탄한 원단감",
    fit: "편안한 핏",
    sale: {
      until: "12월 4일(금)까지 판매",
      method: "계좌이체",
      account: "국민은행 050701-04-139618",
      holder: "한국운동생리학회",
      delivery: "택배 발송",
      // 구매하기 버튼이 여는 신청 폼 주소. 비워 두면 버튼이 '신청 준비 중'으로 잠긴다. 링크를 받으면 여기만 바꾸면 된다.
      formUrl: "",
    },
  },

  // 판매 버전 — 색은 회색 하나, 로고 방식만 둘 (2026-10-28 변경: 5색 → 회색 나염·자수)
  //   price = 1장 가격, pair = 2장 구매 시 가격
  //   img  = 사진 파일 앞머리 (assets/img/{img}-front.webp 등)
  //   turn = 회전 프레임 폴더 (assets/turn/{turn}/)
  // 이름이 colors 인 건 예전 5색 시절 구조를 그대로 쓰기 때문이다.
  colors: [
    { id: "print", name: "Screen print", ko: "나염", swatch: "#b8b8b4", img: "grey", turn: "grey", price: "45,000원", pair: "2장 구매 시 70,000원" },
    { id: "emb",   name: "Embroidery",   ko: "자수", swatch: "#b8b8b4", img: "emb",  turn: "emb",  price: "50,000원", pair: "2장 구매 시 80,000원" },
  ],

  // 행거에 거는 순서 (버전 id). 나염 2벌, 자수 2벌을 이어서 건다 — 같은 버전끼리 묶여 "나염 라인 / 자수 라인" 이름이 붙는다
  rail: ["print", "print", "emb", "emb"],
};

// 사진 경로 규칙 — 색만 바꾸면 모든 페이지가 같은 규칙으로 찾는다
window.KSEP.color = (id) => window.KSEP.colors.find((c) => c.id === id) || window.KSEP.colors[0];
window.KSEP.img = (id, kind) => {
  const v = window.KSEP.color(id);
  // 옆모습·목 라벨·밑단 라벨은 로고가 안 보여서 자수도 나염(grey) 사진을 같이 쓴다
  const shared = kind === "side" || kind === "detail-collar" || kind === "detail-hem";
  const pre = shared ? "grey" : v.img;
  const ext = kind === "model-front" || kind === "model-side" || kind.startsWith("detail-") ? "jpg" : "webp";
  return `assets/img/${pre}-${kind}.${ext}`;
};

// 페이지 전환 효과가 중간에 끊겨도(빠르게 다시 누르는 등) 콘솔에 AbortError 가 남지 않게 한다
const quiet = (e) => { const t = e.viewTransition; if (t) [t.ready, t.finished, t.updateCallbackDone].forEach((p) => p && p.catch(() => {})); };
addEventListener("pagereveal", quiet);
addEventListener("pageswap", quiet);

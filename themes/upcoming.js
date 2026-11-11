// 테마 목록. 정체(사건·인물)는 선택 화면에서 드러나지 않게 한다.
// 내부 메모: diary = 이순신·임진왜란 / harbin = 안중근 / stele = 광개토대왕 / hwarang = 김유신(화랑)
//            gate668 = 고구려 평양성 전투 / river = 살수대첩
//            snowfort = 병자호란 / paper = 3·1 운동
THEMES.push(
  {
    id: "diary", available: true, href: "diary.html", icon: "📓", year: "???",
    title: "이름 없는 일기장",
    summary: "주인의 이름이 긁혀 지워진 낡은 일기장. 첫 장을 펼치는 순간, 낯선 집 마당에서 눈을 떴다.",
    cover: "linear-gradient(135deg,#3a2f25,#120e0a)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
  {
    id: "harbin", available: true, href: "harbin.html", icon: "🕘", year: "???",
    title: "아침 아홉 시 반",
    summary: "아홉 시 반에 멈춘 회중시계, 넷째 손가락이 짧은 손도장. 태엽을 감자 시간이 거꾸로 흐른다.",
    cover: "linear-gradient(135deg,#4a3a2a,#141008)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
  {
    id: "stele", available: true, href: "stele.html", icon: "🪨", year: "???",
    title: "돌에 새긴 이름",
    summary: "거대한 비석을 떠낸 탁본. 왕의 이름이 있어야 할 자리만 닳아 지워져 있다.",
    cover: "linear-gradient(135deg,#3a4a3a,#101810)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
  {
    id: "hwarang", available: true, href: "hwarang.html", icon: "🪶", year: "???",
    title: "열다섯의 맹세",
    summary: "두 젊은이가 하늘에 맹세한 작은 돌. 옆 진열장 화랑 명패의 이름이 지워져 있다.",
    cover: "linear-gradient(135deg,#5a3a4a,#1a0e14)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
  {
    id: "gate668", available: true, href: "gate668.html", icon: "🏯", year: "???",
    title: "무너지는 성문",
    summary: "성 밖을 가득 메운 두 나라의 깃발. 성문이 열리기 전에 무엇을 지켜야 할까?",
    cover: "linear-gradient(135deg,#3b4a6b,#1a2033)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
  {
    id: "river", available: true, href: "river.html", icon: "🌊", year: "???",
    title: "물이 빠진 강",
    summary: "강물이 얕아졌다. 강을 건너오는 대군, 그리고 상류에 숨겨진 비밀.",
    cover: "linear-gradient(135deg,#2d5a6b,#142a33)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
  {
    id: "snowfort", available: false, icon: "❄️", year: "???",
    title: "눈 덮인 산성",
    summary: "산성에 갇힌 지 수십 일. 성안의 식량은 줄어들고, 결정을 내려야 한다.",
    cover: "linear-gradient(135deg,#5a5a6b,#22222b)",
  },
  {
    id: "paper", available: true, href: "paper.html", icon: "📜", year: "???",
    title: "숨겨진 종이 뭉치",
    summary: "인쇄소 바닥 밑에 숨긴 종이 수만 장. 날이 밝기 전에 전해야 한다.",
    cover: "linear-gradient(135deg,#6b3a3a,#2b1717)",
    playtime: "전 6장 · 약 1시간", level: "3D",
  },
);

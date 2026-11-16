// 함께하기(협동 모드) 설정
// 주인장이 Firebase 콘솔(프로젝트 설정 → 내 앱 → 웹 앱)의 firebaseConfig 값을 아래 null 자리에 붙여 넣으면 함께하기가 켜집니다.
// 예) export const FIREBASE_CONFIG = { apiKey: "…", authDomain: "…", databaseURL: "https://…firebasedatabase.app", projectId: "…", appId: "…" };
// databaseURL 이 꼭 들어 있어야 합니다. null 인 동안에는 '함께하기는 곧 열려요' 안내만 나옵니다 (주소 뒤에 ?local=1 을 붙이면 같은 브라우저 탭끼리 시험 가능).
// (이 값들은 웹페이지에 원래 공개되는 값입니다. 보안은 database.rules.json 규칙이 맡습니다.)
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAZYUSl1N8jGR54Q6uJ-S-Bxzv6spfb6RM",
  authDomain: "korean-history-escape.firebaseapp.com",
  databaseURL: "https://korean-history-escape-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "korean-history-escape",
  storageBucket: "korean-history-escape.firebasestorage.app",
  messagingSenderId: "658708366725",
  appId: "1:658708366725:web:9645140676ead9bb25b0ec",
};

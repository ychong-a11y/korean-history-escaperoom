// 함께하기(협동 모드) 설정
// 주인장이 Firebase 콘솔(프로젝트 설정 → 내 앱 → 웹 앱)의 firebaseConfig 값을 아래 null 자리에 붙여 넣으면 함께하기가 켜집니다.
// 예) export const FIREBASE_CONFIG = { apiKey: "…", authDomain: "…", databaseURL: "https://…firebasedatabase.app", projectId: "…", appId: "…" };
// databaseURL 이 꼭 들어 있어야 합니다. null 인 동안에는 '함께하기는 곧 열려요' 안내만 나옵니다 (주소 뒤에 ?local=1 을 붙이면 같은 브라우저 탭끼리 시험 가능).
export const FIREBASE_CONFIG = null;

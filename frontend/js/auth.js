// 토큰 저장
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

// 토큰 가져오기
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// 토큰 삭제
function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

// 사용자 ID 저장
function saveUserId(userId) {
  localStorage.setItem(USER_ID_KEY, userId);
}

// 사용자 ID 가져오기
function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

// 로그인 여부 확인
function isLoggedIn() {
  return !!getToken();
}

// 로그인 필요 페이지 체크 (로그인 안되어 있으면 로그인 페이지로 이동)
function requireAuth() {
  if (!isLoggedIn()) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// 로그아웃
function logout() {
  removeToken();
  showToast(SUCCESS_MESSAGES.LOGOUT, 'success');
  window.location.href = 'login.html';
}

// 현재 로그인한 사용자 ID와 비교
function isCurrentUser(userId) {
  return getUserId() === String(userId);
}
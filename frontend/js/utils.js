// 날짜 포맷팅 (2025-01-01T12:00:00 → 2025년 1월 1일)
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

// 상대적 시간 표시 (방금 전, 5분 전, 1시간 전, 1일 전 등)
function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000); // 초 단위

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  
  return formatDate(dateString);
}

// 텍스트 자르기 (긴 텍스트를 지정된 길이로 자르고 ... 추가)
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 숫자 포맷팅 (1000 → 1,000)
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 조회수 포맷팅 (1000 → 1K, 1000000 → 1M)
function formatViewCount(count) {
  if (count < 1000) return count.toString();
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K';
  return (count / 1000000).toFixed(1) + 'M';
}

// 이메일 유효성 검사
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 비밀번호 유효성 검사 (8자 이상, 영문, 숫자, 특수문자 포함)
function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false; // 영문
  if (!/[0-9]/.test(password)) return false; // 숫자
  if (!/[!@#$%^&*]/.test(password)) return false; // 특수문자
  return true;
}

// 사용자 이름 유효성 검사 (2-20자, 영문/한글/숫자/_만 가능)
function isValidUsername(username) {
  if (username.length < 2 || username.length > 20) return false;
  const usernameRegex = /^[A-Za-z가-힣0-9_]+$/;
  return usernameRegex.test(username);
}

// URL 파라미터 가져오기
function getUrlParam(paramName) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName);
}

// URL 파라미터 설정
function setUrlParam(paramName, paramValue) {
  const url = new URL(window.location);
  url.searchParams.set(paramName, paramValue);
  window.history.pushState({}, '', url);
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 줄바꿈을 <br>로 변환
function nl2br(text) {
  return text.replace(/\n/g, '<br>');
}
// 이미 로그인된 상태면 홈으로 리다이렉트
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

// 에러 메시지 표시 함수
function showErrorMessage(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    
    // 입력 필드에 에러 스타일 추가
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput) emailInput.classList.add('error');
    if (passwordInput) passwordInput.classList.add('error');
  }
}

// 에러 메시지 숨기기 함수
function hideErrorMessage() {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) {
    errorDiv.classList.remove('show');
  }
  
  // 입력 필드의 에러 스타일 제거
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (emailInput) emailInput.classList.remove('error');
  if (passwordInput) passwordInput.classList.remove('error');
}

// 입력 필드에 포커스될 때 에러 메시지 숨기기
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
if (emailInput) emailInput.addEventListener('focus', hideErrorMessage);
if (passwordInput) passwordInput.addEventListener('focus', hideErrorMessage);

// 로그인 폼 제출 처리
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 기존 에러 메시지 숨기기
  hideErrorMessage();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // 유효성 검사
  if (!email) {
    showErrorMessage('이메일을 입력해주세요.');
    return;
  }
  
  if (!isValidEmail(email)) {
    showErrorMessage('올바른 이메일 형식이 아닙니다.');
    return;
  }
  
  if (!password) {
    showErrorMessage('비밀번호를 입력해주세요.');
    return;
  }
  
  try {
    showLoading();
    
    // API 호출
    const response = await login(email, password);
    
    // 토큰 저장
    saveToken(response.access_token);
    
    // 사용자 ID 가져와서 저장
    try {
      // JWT 디코딩으로 user_id 추출
      const tokenParts = response.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.sub) {
          saveUserId(payload.sub);
        }
      }
    } catch (error) {
      console.error('Failed to extract user ID:', error);
    }
    
    hideLoading();
    
    // 홈 페이지로 이동
    window.location.href = 'index.html';
    
  } catch (error) {
    hideLoading();
    
    // 에러 메시지 표시
    let errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.';
    
    if (error.status === 401 || error.status === 400) {
      errorMessage = '이메일 또는 비밀번호가 일치하지 않습니다.';
    } else if (error.status === 404) {
      errorMessage = '등록되지 않은 이메일입니다.';
    } else if (error.status === 429) {
      errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.status >= 500) {
      errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showErrorMessage(errorMessage);
  }
});
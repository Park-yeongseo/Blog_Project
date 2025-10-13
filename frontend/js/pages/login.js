// 이미 로그인된 상태면 홈으로 리다이렉트
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

// 로그인 폼 제출 처리
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  // 유효성 검사
  if (!email) {
    showToast('이메일을 입력해주세요.', 'warning');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('올바른 이메일 형식이 아닙니다.', 'warning');
    return;
  }
  
  if (!password) {
    showToast('비밀번호를 입력해주세요.', 'warning');
    return;
  }
  
  try {
    showLoading();
    
    // API 호출
    const response = await login(email, password);
    
    // 토큰 저장
    saveToken(response.access_token);
    
    // 사용자 ID 가져와서 저장 (프로필 등에서 사용)
    // JWT에서 user_id를 추출하거나, 별도 API로 가져올 수 있음
    // 여기서는 간단히 사용자 정보를 가져와서 저장
    try {
      // 토큰으로 현재 사용자 정보 가져오기
      // 백엔드에 /auth/me 같은 엔드포인트가 있다면 사용
      // 없다면 일단 로그인만 하고, 필요할 때 사용자 정보를 가져옴
      
      // JWT 디코딩으로 user_id 추출 (간단한 방법)
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
    showToast(SUCCESS_MESSAGES.LOGIN, 'success');
    
    // 홈 페이지로 이동
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
});
// 이미 로그인된 상태면 홈으로 리다이렉트
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

// 회원가입 폼 제출 처리
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const passwordTest = document.getElementById('passwordTest').value;
  const bio = document.getElementById('bio').value.trim();
  
  // 유효성 검사
  if (!username) {
    showToast('사용자 이름을 입력해주세요.', 'warning');
    return;
  }
  
  if (!isValidUsername(username)) {
    showToast('사용자 이름은 2-20자의 영문/한글/숫자/밑줄(_)만 사용 가능합니다.', 'warning');
    return;
  }
  
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
  
  if (!isValidPassword(password)) {
    showToast('비밀번호는 8자 이상이며, 영문/숫자/특수문자(!@#$%^&*)를 포함해야 합니다.', 'warning');
    return;
  }
  
  if (!passwordTest) {
    showToast('비밀번호 확인을 입력해주세요.', 'warning');
    return;
  }
  
  if (password !== passwordTest) {
    showToast('비밀번호가 일치하지 않습니다.', 'warning');
    return;
  }
  
  try {
    showLoading();
    
    // API 호출
    const userData = {
      username,
      email,
      password,
      password_test: passwordTest,
      bio: bio || null
    };
    
    await signup(userData);
    
    hideLoading();
    showToast(SUCCESS_MESSAGES.SIGNUP, 'success');
    
    // 로그인 페이지로 이동
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
});

// 실시간 비밀번호 일치 확인 (선택적 기능)
document.getElementById('passwordTest').addEventListener('input', (e) => {
  const password = document.getElementById('password').value;
  const passwordTest = e.target.value;
  
  if (passwordTest && password !== passwordTest) {
    e.target.style.borderColor = 'var(--danger-color)';
  } else {
    e.target.style.borderColor = '';
  }
});
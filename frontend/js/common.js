// 헤더 렌더링 (로그인 상태에 따라 다르게 표시)
function renderHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const loggedIn = isLoggedIn();
  const userId = getUserId();

  header.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="index.html" class="nav-logo">📚 BookReview</a>
        
        <div class="nav-menu">
          <a href="index.html" class="nav-link">홈</a>
          <a href="search.html" class="nav-link">검색</a>
          
          ${loggedIn ? `
            <a href="post-form.html" class="nav-link">글쓰기</a>
            <a href="my-page.html" class="nav-link">마이페이지</a>
            <a href="profile.html?id=${userId}" class="nav-link">프로필</a>
            <button onclick="logout()" class="nav-link btn-logout">로그아웃</button>
          ` : `
            <a href="login.html" class="nav-link">로그인</a>
            <a href="signup.html" class="nav-link">회원가입</a>
          `}
        </div>
      </div>
    </nav>
  `;
}

// 알림 메시지 표시 (토스트)
function showToast(message, type = 'info') {
  // 기존 토스트 제거
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 새 토스트 생성
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 애니메이션을 위한 약간의 딜레이
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 3초 후 자동 제거
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 로딩 스피너 표시
function showLoading() {
  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.className = 'loading-overlay';
  loading.innerHTML = `
    <div class="loading-spinner"></div>
  `;
  document.body.appendChild(loading);
}

// 로딩 스피너 숨김
function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
}

// 확인 모달
function showConfirm(message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <p class="modal-message">${message}</p>
      <div class="modal-buttons">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">취소</button>
        <button class="btn btn-primary" id="confirmBtn">확인</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('confirmBtn').addEventListener('click', () => {
    modal.remove();
    onConfirm();
  });

  // 배경 클릭시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// 에러 처리
function handleError(error) {
  console.error('Error:', error);
  
  if (error.message) {
    showToast(error.message, 'error');
  } else {
    showToast(ERROR_MESSAGES.UNKNOWN_ERROR, 'error');
  }
}

// 페이지 로드 시 헤더 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
});
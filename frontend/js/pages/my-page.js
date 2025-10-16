// 로그인 체크
if (!requireAuth()) {
  // requireAuth에서 이미 리다이렉트 처리됨
}

let currentTab = 'likes';
let currentPage = 1;
const pageSize = 9;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  setupTabListeners();
  loadTabContent('likes');
});

// 탭 클릭 이벤트
function setupTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentTab = btn.dataset.tab;
      currentPage = 1;
      loadTabContent(currentTab);
    });
  });
}

// 탭 컨텐츠 로드
async function loadTabContent(tab) {
  const container = document.getElementById('tabContent');
  
  if (tab === 'likes') {
    await loadLikes();
  } else if (tab === 'settings') {
    renderSettings();
  }
}

// 좋아요한 글 로드
async function loadLikes() {
  try {
    showLoading();
    const posts = await getMyLikes(currentPage, pageSize);
    hideLoading();
    
    renderLikes(posts);
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 좋아요한 글 렌더링
function renderLikes(posts) {
  const container = document.getElementById('tabContent');
  
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="empty-message">좋아요한 게시글이 없습니다.</p>';
    return;
  }
  
  container.innerHTML = `
    <div class="posts-grid">
      ${posts.map(post => `
        <div class="post-card" onclick="goToPost(${post.id})">
          <div class="post-card-header">
            <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
            <span class="post-card-date">${formatRelativeTime(post.created_at)}</span>
          </div>
          
          <div class="post-card-tags">
            ${post.tags.map(tag => `
              <span class="tag">#${escapeHtml(tag.name)}</span>
            `).join('')}
          </div>
          
          <div class="post-card-footer">
            <div class="post-stats">
              <span class="stat">
                <span class="stat-icon">👁️</span>
                ${formatViewCount(post.views)}
              </span>
              <span class="stat">
                <span class="stat-icon">❤️</span>
                ${formatNumber(post.like_count)}
              </span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="pagination">
      ${currentPage > 1 ? `
        <button class="btn btn-secondary" onclick="changePage(${currentPage - 1})">이전</button>
      ` : ''}
      <span class="page-info">페이지 ${currentPage}</span>
      ${posts.length === pageSize ? `
        <button class="btn btn-secondary" onclick="changePage(${currentPage + 1})">다음</button>
      ` : ''}
    </div>
  `;
}

// 설정 페이지 렌더링
function renderSettings() {
  const container = document.getElementById('tabContent');
  
  container.innerHTML = `
    <div class="settings-container">
      <!-- 프로필 수정 -->
      <div class="card">
        <h2 class="card-header">프로필 수정</h2>
        <form id="profileForm">
          <div class="form-group">
            <label for="username" class="form-label">사용자 이름</label>
            <input 
              type="text" 
              id="username" 
              class="form-input" 
              placeholder="사용자 이름"
            >
          </div>
          
          <div class="form-group">
            <label for="bio" class="form-label">자기소개</label>
            <textarea 
              id="bio" 
              class="form-textarea" 
              placeholder="자기소개를 입력하세요"
              maxlength="500"
            ></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary">저장</button>
        </form>
      </div>
      
      <!-- 비밀번호 변경 -->
      <div class="card">
        <h2 class="card-header">비밀번호 변경</h2>
        <form id="passwordForm">
          <div class="form-group">
            <label for="currentPassword" class="form-label">현재 비밀번호</label>
            <input 
              type="password" 
              id="currentPassword" 
              class="form-input" 
              required
            >
          </div>
          
          <div class="form-group">
            <label for="newPassword" class="form-label">새 비밀번호</label>
            <input 
              type="password" 
              id="newPassword" 
              class="form-input" 
              required
            >
            <div class="form-help">8자 이상, 영문/숫자/특수문자(!@#$%^&*) 포함</div>
          </div>
          
          <div class="form-group">
            <label for="newPasswordTest" class="form-label">새 비밀번호 확인</label>
            <input 
              type="password" 
              id="newPasswordTest" 
              class="form-input" 
              required
            >
          </div>
          
          <button type="submit" class="btn btn-primary">비밀번호 변경</button>
        </form>
      </div>
      
      <!-- 회원 탈퇴 -->
      <div class="card">
        <h2 class="card-header">회원 탈퇴</h2>
        <p class="text-muted mb-2">
          회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>
        <button class="btn btn-danger" onclick="confirmWithdraw()">회원 탈퇴</button>
      </div>
    </div>
  `;
  
  // 현재 사용자 정보 로드
  loadCurrentUserInfo();
  
  // 폼 이벤트 리스너
  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);
}

// 현재 사용자 정보 로드
async function loadCurrentUserInfo() {
  try {
    const userId = getUserId();
    const user = await getUserInfo(userId);
    
    document.getElementById('username').value = user.username;
    document.getElementById('bio').value = user.bio;
    
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// 프로필 업데이트
async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const bio = document.getElementById('bio').value.trim();
  
  if (!username) {
    showToast('사용자 이름을 입력해주세요.', 'warning');
    return;
  }
  
  if (!isValidUsername(username)) {
    showToast('사용자 이름은 2-20자의 영문/한글/숫자/밑줄(_)만 사용 가능합니다.', 'warning');
    return;
  }
  
  try {
    showLoading();
    await updateUserInfo({ username, bio });
    hideLoading();
    showToast(SUCCESS_MESSAGES.PROFILE_UPDATED, 'success');
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 비밀번호 변경
async function handlePasswordUpdate(e) {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const newPasswordTest = document.getElementById('newPasswordTest').value;
  
  if (!isValidPassword(newPassword)) {
    showToast('비밀번호는 8자 이상이며, 영문/숫자/특수문자(!@#$%^&*)를 포함해야 합니다.', 'warning');
    return;
  }
  
  if (newPassword !== newPasswordTest) {
    showToast('새 비밀번호가 일치하지 않습니다.', 'warning');
    return;
  }
  
  try {
    showLoading();
    
    await updatePassword({
      password: currentPassword,
      new_password: newPassword,
      new_password_test: newPasswordTest
    });
    
    hideLoading();
    showToast(SUCCESS_MESSAGES.PASSWORD_UPDATED, 'success');
    
    // 폼 초기화
    document.getElementById('passwordForm').reset();
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 회원 탈퇴 확인
function confirmWithdraw() {
  showConfirm('정말로 회원 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.', async () => {
    // 비밀번호 입력 모달
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3 class="modal-title">비밀번호 확인</h3>
        <p class="modal-message">회원 탈퇴를 위해 비밀번호를 입력해주세요.</p>
        <input 
          type="password" 
          id="withdrawPassword" 
          class="form-input" 
          placeholder="비밀번호"
        >
        <div class="modal-buttons">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">취소</button>
          <button class="btn btn-danger" id="confirmWithdrawBtn">탈퇴</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('confirmWithdrawBtn').addEventListener('click', async () => {
      const password = document.getElementById('withdrawPassword').value;
      
      if (!password) {
        showToast('비밀번호를 입력해주세요.', 'warning');
        return;
      }
      
      try {
        showLoading();
        await withdraw(password);
        hideLoading();
        
        showToast('회원 탈퇴가 완료되었습니다.', 'success');
        
        setTimeout(() => {
          removeToken();
          window.location.href = 'index.html';
        }, 1000);
        
      } catch (error) {
        hideLoading();
        handleError(error);
      }
    });
  });
}

// 페이지 변경
function changePage(page) {
  currentPage = page;
  loadLikes();
  window.scrollTo(0, 0);
}

// 게시글로 이동
function goToPost(postId) {
  window.location.href = `post-detail.html?id=${postId}`;
}
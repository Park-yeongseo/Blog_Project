let currentUserId = null;
let currentTab = 'posts';
let isFollowing = false;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  const userId = getUrlParam('id');
  
  if (!userId) {
    showToast('사용자 ID가 필요합니다.', 'error');
    window.location.href = 'index.html';
    return;
  }
  
  currentUserId = parseInt(userId);
  
  loadProfile();
  setupTabListeners();
  loadTabContent('posts');
});

// 프로필 정보 로드
async function loadProfile() {
  try {
    showLoading();
    const user = await getUserInfo(currentUserId);
    
    // 팔로우 상태 확인 (로그인한 경우만)
    if (isLoggedIn() && !isCurrentUser(currentUserId)) {
      const status = await getFollowStatus(currentUserId);
      isFollowing = status.is_following;
    }
    
    hideLoading();
    renderProfile(user);
    
  } catch (error) {
    hideLoading();
    handleError(error);
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

// 프로필 렌더링
function renderProfile(user) {
  const container = document.getElementById('profileInfo');
  const isOwner = isLoggedIn() && isCurrentUser(currentUserId);
  
  container.innerHTML = `
    <div class="profile-main">
      <div class="profile-avatar">
        <div class="avatar-circle">${user.username.charAt(0).toUpperCase()}</div>
      </div>
      
      <div class="profile-details">
        <div class="profile-name-row">
          <h1 class="profile-name">${escapeHtml(user.username)}</h1>
          ${!isOwner && isLoggedIn() ? `
            <button 
              class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" 
              id="followBtn"
              onclick="toggleFollow()"
            >
              ${isFollowing ? '언팔로우' : '팔로우'}
            </button>
          ` : ''}
        </div>
        
        <p class="profile-bio">${escapeHtml(user.bio)}</p>
        
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">${formatViewCount(user.total_views)}</span>
            <span class="stat-label">총 조회수</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="followerCount">-</span>
            <span class="stat-label">팔로워</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="followingCount">-</span>
            <span class="stat-label">팔로잉</span>
          </div>
        </div>
        
        <div class="profile-meta">
          <span class="profile-joined">가입일: ${formatDate(user.created_at)}</span>
        </div>
      </div>
    </div>
  `;
  
  // 팔로워/팔로잉 수 로드
  loadFollowCounts();
}

// 팔로워/팔로잉 수 로드
async function loadFollowCounts() {
  try {
    const [followers, following] = await Promise.all([
      getFollowers(currentUserId),
      getFollowing(currentUserId)
    ]);
    
    document.getElementById('followerCount').textContent = followers.followers.length;
    document.getElementById('followingCount').textContent = following.follwing.length;
    
  } catch (error) {
    console.error('Failed to load follow counts:', error);
  }
}

// 팔로우 토글
async function toggleFollow() {
  if (!isLoggedIn()) {
    showToast('로그인이 필요합니다.', 'warning');
    return;
  }
  
  try {
    if (isFollowing) {
      await unfollowUser(currentUserId);
      isFollowing = false;
      showToast(SUCCESS_MESSAGES.UNFOLLOW, 'success');
    } else {
      await followUser(currentUserId);
      isFollowing = true;
      showToast(SUCCESS_MESSAGES.FOLLOW, 'success');
    }
    
    // 버튼 업데이트
    const btn = document.getElementById('followBtn');
    btn.textContent = isFollowing ? '언팔로우' : '팔로우';
    btn.className = isFollowing ? 'btn btn-secondary' : 'btn btn-primary';
    
    // 팔로워 수 업데이트
    loadFollowCounts();
    
  } catch (error) {
    handleError(error);
  }
}

// 탭 클릭 이벤트
function setupTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentTab = btn.dataset.tab;
      loadTabContent(currentTab);
    });
  });
}

// 탭 컨텐츠 로드
async function loadTabContent(tab) {
  const container = document.getElementById('tabContent');
  
  try {
    showLoading();
    
    if (tab === 'posts') {
      const posts = await getUserPosts(currentUserId);
      renderPosts(posts);
    } else if (tab === 'followers') {
      const data = await getFollowers(currentUserId);
      renderFollowList(data.followers, '팔로워');
    } else if (tab === 'following') {
      const data = await getFollowing(currentUserId);
      renderFollowList(data.follwing, '팔로잉');
    }
    
    hideLoading();
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 게시글 목록 렌더링
function renderPosts(posts) {
  const container = document.getElementById('tabContent');
  
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="empty-message">작성한 게시글이 없습니다.</p>';
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
  `;
}

// 팔로우 목록 렌더링
function renderFollowList(users, title) {
  const container = document.getElementById('tabContent');
  
  if (!users || users.length === 0) {
    container.innerHTML = `<p class="empty-message">${title}${title.endsWith('워') ? '가' : '이'} 없습니다.</p>`;
    return;
  }
  
  container.innerHTML = `
    <div class="follow-list">
      ${users.map(user => `
        <div class="follow-item" onclick="goToProfile(${user.id})">
          <div class="follow-avatar">
            <div class="avatar-circle-sm">${user.username.charAt(0).toUpperCase()}</div>
          </div>
          <div class="follow-info">
            <span class="follow-username">${escapeHtml(user.username)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 게시글로 이동
function goToPost(postId) {
  window.location.href = `post-detail.html?id=${postId}`;
}

// 프로필로 이동
function goToProfile(userId) {
  window.location.href = `profile.html?id=${userId}`;
}
let currentTab = 'popular';
let currentPage = 1;
const pageSize = 10;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // 추천글 탭은 로그인 필요
  const recommendedTab = document.getElementById('recommendedTab');
  if (!isLoggedIn()) {
    recommendedTab.style.display = 'none';
  }
  
  loadPosts();
  setupTabListeners();
});

// 탭 클릭 이벤트
function setupTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // 로그인 확인 (추천글 탭)
      if (btn.dataset.tab === 'recommended' && !isLoggedIn()) {
        showToast('로그인이 필요합니다.', 'warning');
        return;
      }
      
      // 활성 탭 변경
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 탭 변경 및 데이터 로드
      currentTab = btn.dataset.tab;
      currentPage = 1;
      loadPosts();
    });
  });
}

// 게시글 목록 로드
async function loadPosts() {
  try {
    showLoading();
    
    let posts;
    
    if (currentTab === 'popular') {
      posts = await getPopularPosts(currentPage, pageSize);
    } else if (currentTab === 'recommended') {
      posts = await getRecommendedPosts(currentPage, pageSize);
    }
    
    // 각 게시글의 user_id로 username 가져오기
    if (posts && posts.length > 0) {
      const uniqueUserIds = [...new Set(
        posts
          .map(p => p.user_id)
          .filter(id => id !== undefined && id !== null)
      )];
      
      if (uniqueUserIds.length > 0) {
        const userMap = {};
        
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const user = await getUserInfo(userId);
              userMap[userId] = user.username;
            } catch (error) {
              console.error(`Failed to load user ${userId}:`, error);
              userMap[userId] = '익명';
            }
          })
        );
        
        // 게시글에 username 추가
        posts = posts.map(post => ({
          ...post,
          username: userMap[post.user_id] || '익명'
        }));
      }
    }
    
    hideLoading();
    
    if (posts && posts.length > 0) {
      renderPosts(posts);
      renderPagination(posts.length);
      document.getElementById('emptyMessage').style.display = 'none';
    } else {
      document.getElementById('postsContainer').innerHTML = '';
      document.getElementById('pagination').innerHTML = '';
      document.getElementById('emptyMessage').style.display = 'block';
    }
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 게시글 렌더링
function renderPosts(posts) {
  const container = document.getElementById('postsContainer');
  
  container.innerHTML = posts.map(post => `
    <div class="post-card" onclick="goToPost(${post.id})">
      <div class="post-card-header">
        <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
        <div class="post-card-meta">
          <span class="post-card-author">
            ${escapeHtml(post.username || '익명')}
          </span>
          <span class="post-card-date">${formatRelativeTime(post.created_at)}</span>
        </div>
      </div>
      
      <div class="post-card-content">
        ${truncateText(stripHtmlTags(post.content), 100)}
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
  `).join('');
}

// 페이지네이션 렌더링
function renderPagination(itemCount) {
  const paginationContainer = document.getElementById('pagination');
  
  // 다음 페이지가 있는지 확인
  const hasNext = itemCount === pageSize;
  const hasPrev = currentPage > 1;
  
  let paginationHTML = '';
  
  if (hasPrev) {
    paginationHTML += `
      <button class="btn btn-secondary" onclick="changePage(${currentPage - 1})">
        이전
      </button>
    `;
  }
  
  paginationHTML += `<span class="page-info">페이지 ${currentPage}</span>`;
  
  if (hasNext) {
    paginationHTML += `
      <button class="btn btn-secondary" onclick="changePage(${currentPage + 1})">
        다음
      </button>
    `;
  }
  
  paginationContainer.innerHTML = paginationHTML;
}

// 페이지 변경
function changePage(page) {
  currentPage = page;
  loadPosts();
  window.scrollTo(0, 0);
}

// 게시글 상세 페이지로 이동
function goToPost(postId) {
  window.location.href = `post-detail.html?id=${postId}`;
}
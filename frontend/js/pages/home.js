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
        <span class="post-card-date">${formatRelativeTime(post.created_at)}</span>
      </div>
      
      <div class="post-card-content">
        ${escapeHtml(truncateText(post.content, 150))}
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
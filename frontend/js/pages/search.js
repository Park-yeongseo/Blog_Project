let currentQuery = '';
let currentPage = 1;
const pageSize = 10;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // URL에서 검색어 가져오기
  const urlQuery = getUrlParam('q');
  if (urlQuery) {
    document.getElementById('searchQuery').value = urlQuery;
    currentQuery = urlQuery;
    performSearch();
  }
  
  // 검색 폼 제출
  document.getElementById('searchForm').addEventListener('submit', handleSearch);
});

// 검색 처리
function handleSearch(e) {
  e.preventDefault();
  
  const query = document.getElementById('searchQuery').value.trim();
  
  if (!query) {
    showToast('검색어를 입력해주세요.', 'warning');
    return;
  }
  
  currentQuery = query;
  currentPage = 1;
  
  // URL 업데이트
  setUrlParam('q', query);
  
  performSearch();
}

// 검색 실행
async function performSearch() {
  try {
    showLoading();
    
    const results = await search(currentQuery, [], currentPage);
    
    hideLoading();
    
    if (results && results.length > 0) {
      renderResults(results);
      renderPagination(results.length);
    } else {
      document.getElementById('searchResults').innerHTML = `
        <p class="empty-message">
          "${escapeHtml(currentQuery)}"에 대한 검색 결과가 없습니다.
        </p>
      `;
      document.getElementById('pagination').innerHTML = '';
    }
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 검색 결과 렌더링
function renderResults(results) {
  const container = document.getElementById('searchResults');
  
  container.innerHTML = `
    <div class="search-results-header">
      <h2 class="results-title">검색 결과 (${results.length}개)</h2>
    </div>
    
    <div class="search-results-list">
      ${results.map(result => `
        <div class="search-result-item" onclick="goToPost(${result.post_id})">
          <div class="result-header">
            <h3 class="result-title">${highlightText(escapeHtml(result.title), currentQuery)}</h3>
            <span class="result-date">${formatDate(result.created_at)}</span>
          </div>
          
          <div class="result-book">
            <span class="book-icon">📚</span>
            <span class="book-title">${highlightText(escapeHtml(result.book_title), currentQuery)}</span>
          </div>
          
          ${result.tags.length > 0 ? `
            <div class="result-tags">
              ${result.tags.map(tag => `
                <span class="tag">#${highlightText(escapeHtml(tag), currentQuery)}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// 텍스트 하이라이트
function highlightText(text, query) {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 페이지네이션 렌더링
function renderPagination(itemCount) {
  const paginationContainer = document.getElementById('pagination');
  
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
  performSearch();
  window.scrollTo(0, 0);
}

// 게시글로 이동
function goToPost(postId) {
  window.location.href = `post-detail.html?id=${postId}`;
}
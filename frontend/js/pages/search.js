let currentQuery = '';
let currentPage = 1;
let selectedTags = [];
let allTags = [];
let isTagSectionExpanded = false; // 태그 섹션 펼침/접힘 상태

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
  const urlQuery = getUrlParam('q');
  
  if (urlQuery) {
    document.getElementById('searchQuery').value = urlQuery;
    performSearch(urlQuery, [], 1);
  }
  
  // 모든 태그 로드
  await loadAllTags();
  
  // 검색 폼 제출
  document.getElementById('searchForm').addEventListener('submit', handleSearch);
  
  // 태그 토글 버튼 이벤트
  document.getElementById('toggleTagsBtn').addEventListener('click', toggleTagSection);
});

// 모든 태그 로드
async function loadAllTags() {
  try {
    const tagsData = await getAllTags();
    
    // 백엔드 응답이 문자열 배열인 경우
    if (Array.isArray(tagsData) && typeof tagsData[0] === 'string') {
      allTags = tagsData;
    }
    // 백엔드 응답이 객체 배열인 경우 [{name: '판타지'}, ...]
    else if (Array.isArray(tagsData) && tagsData[0]?.name) {
      allTags = tagsData.map(tag => tag.name);
    }
    
    renderTagsCheckboxes(allTags);
    
  } catch (error) {
    console.error('태그 로드 실패:', error);
    // 에러 시 빈 배열
    allTags = [];
    document.getElementById('tagsCheckboxContainer').innerHTML = 
      '<p class="text-muted">태그를 불러올 수 없습니다.</p>';
  }
}

// 태그 섹션 토글
function toggleTagSection() {
  const container = document.getElementById('tagsCheckboxContainer');
  const btn = document.getElementById('toggleTagsBtn');
  const icon = btn.querySelector('.toggle-icon');
  
  isTagSectionExpanded = !isTagSectionExpanded;
  
  if (isTagSectionExpanded) {
    container.style.display = 'grid';
    icon.textContent = '▲';
    btn.querySelector('span:last-child').textContent = '태그 접기';  // ✅ 수정
  } else {
    container.style.display = 'none';
    icon.textContent = '▼';
    btn.querySelector('span:last-child').textContent = '태그 펼치기';  // ✅ 수정
  }
}

// 태그 체크박스 렌더링
function renderTagsCheckboxes(tags) {
  const container = document.getElementById('tagsCheckboxContainer');
  
  if (!tags || tags.length === 0) {
    container.innerHTML = '<p class="text-muted">태그가 없습니다.</p>';
    return;
  }
  
  container.innerHTML = tags.map(tag => `
    <label class="tag-checkbox">
      <input 
        type="checkbox" 
        value="${escapeHtml(tag)}" 
        onchange="handleTagChange(this)"
      >
      <span>${escapeHtml(tag)}</span>
    </label>
  `).join('');
}

// 태그 체크박스 변경 핸들러 (최대 3개 제한)
function handleTagChange(checkbox) {
  const checkboxes = document.querySelectorAll('.tag-checkbox input');
  const checkedBoxes = document.querySelectorAll('.tag-checkbox input:checked');
  
  // 최대 3개 제한
  if (checkedBoxes.length > 3) {
    checkbox.checked = false;
    showToast('태그는 최대 3개까지 선택할 수 있습니다.', 'warning');
    return;
  }
  
  // 선택된 태그 목록 업데이트
  selectedTags = Array.from(checkedBoxes).map(cb => cb.value);
  
  // 선택된 태그 개수 표시 업데이트
  updateSelectedTagsCount();

  //자동 검색
    if (selectedTags.length > 0 || currentQuery) {
      performSearch(currentQuery, selectedTags, 1);
    }
  }

// 선택된 태그 개수 표시
function updateSelectedTagsCount() {
  const countElement = document.getElementById('selectedTagsCount');
  if (selectedTags.length > 0) {
    countElement.textContent = `(${selectedTags.length}/3 선택됨)`;
    countElement.style.display = 'inline';
  } else {
    countElement.style.display = 'none';
  }
}

// 검색 폼 제출
function handleSearch(e) {
  e.preventDefault();
  
  const query = document.getElementById('searchQuery').value.trim();
  currentQuery = query;
  currentPage = 1;
  
  performSearch(query, selectedTags, 1);
}

// 검색 수행
async function performSearch(query, tags, page) {
  try {
    showLoading();
    
    const results = await search(query, tags, page);
    
    hideLoading();
    renderSearchResults(results, query);
    renderPagination(results.total_pages, page);
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 검색 결과 렌더링
function renderSearchResults(results, query) {
  const container = document.getElementById('searchResults');
  
  // ✅ 백엔드가 배열만 반환하므로 처리 방식 변경
  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="search-hint">
        <p>${query || selectedTags.length > 0 ? '검색 결과가 없습니다.' : '키워드를 입력하거나 태그를 선택해서 검색해보세요!'}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="search-results-header">
      <h2 class="results-title">
        검색 결과 ${results.length}개
        ${selectedTags.length > 0 ? `
          <span class="selected-tags-info">
            <span class="tag-label">선택된 태그:</span>
            ${selectedTags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </span>
        ` : ''}
      </h2>
    </div>
    
    <div class="search-results-list">
      ${results.map(post => `
        <div class="search-result-item" onclick="goToPost(${post.post_id})">
          <div class="result-header">
            <h3 class="result-title">${highlightText(escapeHtml(post.title), query)}</h3>
            <span class="result-date">${formatRelativeTime(post.created_at)}</span>
          </div>
          
          ${post.book_title ? `
            <div class="result-book">
              <span class="book-icon">📚</span>
              <span class="book-title">${escapeHtml(post.book_title)}</span>
            </div>
          ` : ''}
          
          ${post.tags && post.tags.length > 0 ? `
            <div class="result-tags">
              ${post.tags.map(tag => `
                <span class="tag">#${escapeHtml(tag)}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// 검색어 하이라이트
function highlightText(text, query) {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// 페이지네이션 렌더링
function renderPagination(totalPages, currentPage) {
  const container = document.getElementById('pagination');
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '';
  
  if (currentPage > 1) {
    html += `<button class="btn btn-secondary" onclick="goToPage(${currentPage - 1})">이전</button>`;
  }
  
  html += `<span class="page-info">${currentPage} / ${totalPages}</span>`;
  
  if (currentPage < totalPages) {
    html += `<button class="btn btn-secondary" onclick="goToPage(${currentPage + 1})">다음</button>`;
  }
  
  container.innerHTML = html;
}

// 페이지 이동
function goToPage(page) {
  currentPage = page;
  performSearch(currentQuery, selectedTags, page);
}

// 게시글 상세로 이동
function goToPost(postId) {
  window.location.href = `post-detail.html?id=${postId}`;
}
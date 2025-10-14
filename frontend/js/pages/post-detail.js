let currentPost = null;
let isLiked = false;
let likeCount = 0;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  const postId = getUrlParam('id');
  
  if (!postId) {
    showToast('게시글을 찾을 수 없습니다.', 'error');
    window.location.href = 'index.html';
    return;
  }
  
  loadPost(postId);
  loadComments(postId);
  loadRelatedPosts(postId);
  
  if (isLoggedIn()) {
    loadLikeStatus(postId);
  }
});

// 게시글 로드
async function loadPost(postId) {
  try {
    showLoading();
    currentPost = await getPost(postId);
    
    // 작성자 정보 추가로 불러오기
    try {
      const author = await getUserInfo(currentPost.user_id);
      currentPost.username = author.username;
    } catch (error) {
      currentPost.username = `사용자${currentPost.user_id}`;
    }
    
    hideLoading();
    
    renderPost(currentPost);
    renderCommentForm();
    
  } catch (error) {
    hideLoading();
    handleError(error);
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

// 게시글 렌더링
function renderPost(post) {
  const container = document.getElementById('postContainer');
  const isOwner = isLoggedIn() && isCurrentUser(post.user_id);
  
  container.innerHTML = `
    <article class="post-detail">
      <div class="post-header">
        <h1 class="post-title">${escapeHtml(post.title)}</h1>
        <div class="post-meta">
          <span class="post-author">작성자: ${escapeHtml(post.username || '작성자')}</span>
          <span class="post-date">📅 ${formatDate(post.created_at)}</span>
          <span class="post-views">👁️ 조회수 ${formatViewCount(post.views)}</span>
        </div>
      </div>
      

      ${post.tags && post.tags.length > 0 ? `
        <div class="post-tags">
          ${post.tags.map(tag => `
            <span class="tag">#${escapeHtml(tag.name)}</span>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="post-content">
        ${post.content}
      </div>
      
      <div class="post-actions">
        ${isLoggedIn() ? `
          <button 
            class="btn btn-like ${isLiked ? 'liked' : ''}" 
            id="likeBtn"
            onclick="handleLikeClick()"
          >
            <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
            <span id="likeCount">${post.like_count}</span>
          </button>
        ` : `
          <span class="like-count">❤️ ${post.like_count}</span>
        `}
        
        ${isOwner ? `
          <div class="post-owner-actions">
            <button class="btn btn-secondary btn-sm" onclick="editPost()">수정</button>
            <button class="btn btn-danger btn-sm" onclick="confirmDeletePost()">삭제</button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
  
  likeCount = post.like_count;
}

// 좋아요 상태 로드
async function loadLikeStatus(postId) {
  try {
    const likeData = await getPostLikes(postId);
    const currentUserId = parseInt(getUserId());
    isLiked = likeData.users.includes(currentUserId);
    likeCount = likeData.like_count;
    
    // ✅ 추가: UI가 이미 렌더링된 경우 업데이트
    const likeBtn = document.getElementById('likeBtn');
    const likeCountSpan = document.getElementById('likeCount');
    
    if (likeBtn && likeCountSpan) {
      likeBtn.classList.toggle('liked', isLiked);
      likeBtn.querySelector('.like-icon').textContent = isLiked ? '❤️' : '🤍';
      likeCountSpan.textContent = likeCount;
    }
    
  } catch (error) {
    console.error('Failed to load like status:', error);
  }
}

// 좋아요 토글
async function handleLikeClick() {
  if (!isLoggedIn()) {
    showToast('로그인이 필요합니다.', 'warning');
    return;
  }
  
  const likeBtn = document.getElementById('likeBtn');
  
  // 중복 클릭 방지
  if (likeBtn.disabled) return;
  likeBtn.disabled = true;
  
  try {
    // api.js의 toggleLike 함수 호출
    const result = await toggleLike(currentPost.id);
    
    // 전역 변수 업데이트
    isLiked = result.liked;
    likeCount = result.like_count;
    
    // UI 업데이트
    const likeIcon = likeBtn.querySelector('.like-icon');
    const likeCountSpan = document.getElementById('likeCount');
    
    if (result.liked) {
      likeBtn.classList.add('liked');
      likeIcon.textContent = '❤️';
      showToast('좋아요를 눌렀습니다! ❤️', 'success');
    } else {
      likeBtn.classList.remove('liked');
      likeIcon.textContent = '🤍';
      showToast('좋아요를 취소했습니다.', 'info');
    }
    
    likeCountSpan.textContent = likeCount;
    
  } catch (error) {
    console.error('좋아요 처리 중 오류:', error);
    handleError(error);
  } finally {
    // 버튼 다시 활성화
    likeBtn.disabled = false;
  }
}

// 댓글 작성 폼 렌더링
function renderCommentForm() {
  const container = document.getElementById('commentFormContainer');
  
  if (!isLoggedIn()) {
    container.innerHTML = '<p class="text-muted">댓글을 작성하려면 로그인해주세요.</p>';
    return;
  }
  
  container.innerHTML = `
    <form id="commentForm" class="comment-form">
      <textarea 
        id="commentContent" 
        class="form-textarea" 
        placeholder="댓글을 입력하세요..."
        maxlength="1000"
        required
      ></textarea>
      <button type="submit" class="btn btn-primary">댓글 작성</button>
    </form>
  `;
  
  document.getElementById('commentForm').addEventListener('submit', handleCommentSubmit);
}

// 댓글 작성
async function handleCommentSubmit(e) {
  e.preventDefault();
  
  const content = document.getElementById('commentContent').value.trim();
  
  if (!content) {
    showToast('댓글 내용을 입력해주세요.', 'warning');
    return;
  }
  
  try {
    await createComment(currentPost.id, { content });
    showToast(SUCCESS_MESSAGES.COMMENT_CREATED, 'success');
    
    document.getElementById('commentContent').value = '';
    loadComments(currentPost.id);
    
  } catch (error) {
    handleError(error);
  }
}

// 댓글 목록 로드
async function loadComments(postId) {
  try {
    const comments = await getComments(postId);
    
    // ✅ 각 댓글 작성자의 username 가져오기
    const uniqueUserIds = [...new Set(comments.map(c => c.user_id))];
    const userMap = {};
    
    // 모든 사용자 정보를 한 번에 가져오기
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const user = await getUserInfo(userId);
          userMap[userId] = user.username;
        } catch (error) {
          console.error(`Failed to load user ${userId}:`, error);
          userMap[userId] = `사용자${userId}`;
        }
      })
    );
    
    // 댓글에 username 추가
    const commentsWithUsername = comments.map(comment => ({
      ...comment,
      username: userMap[comment.user_id] || `사용자${comment.user_id}`
    }));
    
    renderComments(commentsWithUsername);
    
  } catch (error) {
    console.error('Failed to load comments:', error);
  }
}

// 댓글 렌더링
function renderComments(comments) {
  const container = document.getElementById('commentsContainer');
  
  if (!comments || comments.length === 0) {
    container.innerHTML = '<p class="text-muted">아직 댓글이 없습니다.</p>';
    return;
  }
  
  // 댓글과 대댓글 분리
  const topComments = comments.filter(c => c.depth === 0);
  const replies = comments.filter(c => c.depth === 1);
  
  container.innerHTML = topComments.map(comment => {
    const commentReplies = replies.filter(r => r.parent_id === comment.id);
    const isOwner = isLoggedIn() && isCurrentUser(comment.user_id);
    
    // ✅ 추가: username 처리
  const displayName = comment.username || `사용자${comment.user_id}`;

    return `
      <div class="comment">
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(displayName)}</span>
          <span class="comment-date">${formatRelativeTime(comment.created_at)}</span>
        </div>
        <div class="comment-content">${nl2br(escapeHtml(comment.content))}</div>
        <div class="comment-actions">
          ${isLoggedIn() ? `
            <button class="btn-text" onclick="showReplyForm(${comment.id})">답글</button>
          ` : ''}
          ${isOwner ? `
            <button class="btn-text" onclick="deleteCommentConfirm(${comment.id})">삭제</button>
          ` : ''}
        </div>
        
        <!-- 대댓글 목록 -->
        ${commentReplies.length > 0 ? `
          <div class="replies">
            ${commentReplies.map(reply => {
              const isReplyOwner = isLoggedIn() && isCurrentUser(reply.user_id);
              
              // 대댓글도 username 처리
              const replyDisplayName = reply.username || `사용자${reply.user_id}`;

              return `
                <div class="comment reply">
                  <div class="comment-header">
                    <span class="comment-author">${escapeHtml(replyDisplayName)}</span>
                    <span class="comment-date">${formatRelativeTime(reply.created_at)}</span>
                  </div>
                  <div class="comment-content">${nl2br(escapeHtml(reply.content))}</div>
                  ${isReplyOwner ? `
                    <div class="comment-actions">
                      <button class="btn-text" onclick="deleteCommentConfirm(${reply.id})">삭제</button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
        
        <!-- 답글 작성 폼 (숨김) -->
        <div id="replyForm${comment.id}" class="reply-form" style="display: none;">
          <form onsubmit="handleReplySubmit(event, ${comment.id})">
            <textarea 
              class="form-textarea" 
              placeholder="답글을 입력하세요..."
              maxlength="1000"
              required
            ></textarea>
            <div class="reply-form-actions">
              <button type="submit" class="btn btn-primary btn-sm">답글 작성</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="hideReplyForm(${comment.id})">취소</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }).join('');
}

// 답글 폼 표시
function showReplyForm(commentId) {
  const form = document.getElementById(`replyForm${commentId}`);
  form.style.display = 'block';
}

// 답글 폼 숨김
function hideReplyForm(commentId) {
  const form = document.getElementById(`replyForm${commentId}`);
  form.style.display = 'none';
  form.querySelector('textarea').value = '';
}

// 답글 작성
async function handleReplySubmit(e, parentId) {
  e.preventDefault();
  
  const form = e.target;
  const content = form.querySelector('textarea').value.trim();
  
  if (!content) {
    showToast('답글 내용을 입력해주세요.', 'warning');
    return;
  }
  
  try {
    await createComment(currentPost.id, { content, parent_id: parentId });
    showToast('답글이 작성되었습니다.', 'success');
    
    hideReplyForm(parentId);
    loadComments(currentPost.id);
    
  } catch (error) {
    handleError(error);
  }
}

// 댓글 삭제 확인
function deleteCommentConfirm(commentId) {
  showConfirm('댓글을 삭제하시겠습니까?', async () => {
    try {
      await deleteComment(commentId);
      showToast(SUCCESS_MESSAGES.COMMENT_DELETED, 'success');
      loadComments(currentPost.id);
    } catch (error) {
      handleError(error);
    }
  });
}

// 관련 게시글 로드
async function loadRelatedPosts(postId) {
  try {
    const posts = await getRelatedPosts(postId, 5);
    renderRelatedPosts(posts);
  } catch (error) {
    console.error('Failed to load related posts:', error);
  }
}

// 관련 게시글 렌더링
function renderRelatedPosts(posts) {
  const container = document.getElementById('relatedPostsContainer');
  
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="text-muted">관련 게시글이 없습니다.</p>';
    return;
  }
  
  container.innerHTML = posts.map(post => `
    <div class="post-card post-card-sm" onclick="goToPost(${post.id})">
      <h4 class="post-card-title">${escapeHtml(truncateText(post.title, 50))}</h4>
      <div class="post-stats">
        <span class="stat">
          <span class="stat-icon">👁️</span>
          ${formatViewCount(post.views)}
        </span>
        <span class="stat">
          <span class="stat-icon">❤️</span>
          ${post.like_count || 0}
        </span>
      </div>
    </div>
  `).join('');
}

// 게시글 수정 페이지로 이동
function editPost() {
  window.location.href = `post-form.html?id=${currentPost.id}`;
}

// 게시글 삭제 확인
function confirmDeletePost() {
  showConfirm('게시글을 삭제하시겠습니까?', async () => {
    try {
      showLoading();
      await deletePost(currentPost.id);
      hideLoading();
      showToast(SUCCESS_MESSAGES.POST_DELETED, 'success');
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      
    } catch (error) {
      hideLoading();
      handleError(error);
    }
  });
}

// 게시글 상세 페이지로 이동
function goToPost(postId) {
  window.location.href = `post-detail.html?id=${postId}`;
}
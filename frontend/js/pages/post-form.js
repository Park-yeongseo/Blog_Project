// 로그인 체크
if (!requireAuth()) {
  // requireAuth에서 이미 리다이렉트 처리됨
}

let isEditMode = false;
let editPostId = null;
let quill; // Quill 에디터 인스턴스

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // Quill 에디터 초기화
  initQuillEditor();
  
  const postId = getUrlParam('id');
  
  if (postId) {
    // 수정 모드
    isEditMode = true;
    editPostId = postId;
    document.getElementById('formTitle').textContent = '게시글 수정';
    document.getElementById('submitText').textContent = '수정하기';
    
    loadPostForEdit(postId);
  }
  
  // 폼 제출 이벤트
  document.getElementById('postForm').addEventListener('submit', handleSubmit);
});

// Quill 에디터 초기화
function initQuillEditor() {
  const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ];

  quill = new Quill('#editor', {
    modules: {
      toolbar: toolbarOptions
    },
    placeholder: '독서 후기를 작성해주세요...\n\n책의 내용, 느낀 점, 인상 깊었던 구절 등을 자유롭게 작성하세요.',
    theme: 'snow'
  });
}

// 게시글 수정을 위한 데이터 로드
async function loadPostForEdit(postId) {
  try {
    showLoading();
    const post = await getPost(postId);
    hideLoading();
    
    // 본인의 게시글인지 확인
    if (!isCurrentUser(post.user_id)) {
      showToast('수정 권한이 없습니다.', 'error');
      setTimeout(() => {
        window.location.href = `post-detail.html?id=${postId}`;
      }, 1000);
      return;
    }
    
    // 폼에 데이터 채우기
    document.getElementById('title').value = post.title;
    
    // Quill 에디터에 내용 설정 (HTML 그대로)
    quill.root.innerHTML = post.content;
    
    // 책 정보는 수정 시 숨김 처리
    document.getElementById('bookInfoSection').style.display = 'none';
    
  } catch (error) {
    hideLoading();
    handleError(error);
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

// 폼 제출 처리
async function handleSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('title').value.trim();
  
  // Quill 에디터에서 HTML 가져오기
  const content = quill.root.innerHTML.trim();
  
  // 빈 내용 체크 (Quill은 <p><br></p>를 기본값으로 가짐)
  const textContent = quill.getText().trim();
  
  // 유효성 검사
  if (!title) {
    showToast('제목을 입력해주세요.', 'warning');
    return;
  }
  
  if (!textContent) {
    showToast('내용을 입력해주세요.', 'warning');
    return;
  }
  
  if (isEditMode) {
    // 수정
    await handleUpdate(title, content);
  } else {
    // 작성
    await handleCreate(title, content);
  }
}

// 게시글 작성
async function handleCreate(title, content) {
  const isbn = document.getElementById('isbn').value.trim();
  const bookTitle = document.getElementById('bookTitle').value.trim();
  const bookAuthor = document.getElementById('bookAuthor').value.trim();
  
  // ISBN 유효성 검사
  if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
    showToast('ISBN은 10자리 또는 13자리 숫자여야 합니다.', 'warning');
    return;
  }
  
  if (!/^\d+$/.test(isbn)) {
    showToast('ISBN은 숫자만 입력 가능합니다.', 'warning');
    return;
  }
  
  if (!bookTitle) {
    showToast('책 제목을 입력해주세요.', 'warning');
    return;
  }
  
  if (!bookAuthor) {
    showToast('저자를 입력해주세요.', 'warning');
    return;
  }
  
  try {
    showLoading();
    
    const postData = {
      title,
      content, // HTML 형식으로 저장
      isbn,
      book_title: bookTitle,
      book_author: bookAuthor
    };
    
    const newPost = await createPost(postData);
    
    hideLoading();
    showToast(SUCCESS_MESSAGES.POST_CREATED, 'success');
    
    // 작성된 게시글 페이지로 이동
    setTimeout(() => {
      window.location.href = `post-detail.html?id=${newPost.id}`;
    }, 1000);
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 게시글 수정
async function handleUpdate(title, content) {
  try {
    showLoading();
    
    const postData = {
      title,
      content // HTML 형식으로 저장
    };
    
    await updatePost(editPostId, postData);
    
    hideLoading();
    showToast(SUCCESS_MESSAGES.POST_UPDATED, 'success');
    
    // 수정된 게시글 페이지로 이동
    setTimeout(() => {
      window.location.href = `post-detail.html?id=${editPostId}`;
    }, 1000);
    
  } catch (error) {
    hideLoading();
    handleError(error);
  }
}

// 취소 버튼
function goBack() {
  if (isEditMode) {
    window.location.href = `post-detail.html?id=${editPostId}`;
  } else {
    window.location.href = 'index.html';
  }
}
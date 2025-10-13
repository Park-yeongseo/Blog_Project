// API 요청 래퍼 함수
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // 토큰이 있으면 헤더에 추가
  const token = getToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // 응답이 JSON이 아닐 수 있으므로 체크
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // 에러 처리
      const errorMessage = data.detail || ERROR_MESSAGES.UNKNOWN_ERROR;
      
      if (response.status === 401) {
        // 인증 실패 - 로그인 페이지로 이동
        removeToken();
        window.location.href = 'login.html';
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }
      
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      throw error;
    }
    
    // 네트워크 에러
    if (!navigator.onLine) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    throw error;
  }
}

// ===== 인증 API =====

// 로그인
async function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// 회원가입
async function signup(userData) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// 로그아웃
async function apiLogout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}

// 회원탈퇴
async function withdraw(password) {
  return apiRequest('/auth/withdraw', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

// ===== 사용자 API =====

// 사용자 정보 조회
async function getUserInfo(userId) {
  return apiRequest(`/user/${userId}`);
}

// 비밀번호 변경
async function updatePassword(passwordData) {
  return apiRequest('/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
}

// 사용자 정보 수정
async function updateUserInfo(userData) {
  return apiRequest('/userinfo', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

// ===== 게시글 API =====

// 게시글 상세 조회
async function getPost(postId) {
  return apiRequest(`/posts/${postId}`);
}

// 관련 게시글 조회
async function getRelatedPosts(postId, limit = 5) {
  return apiRequest(`/posts/${postId}/related?limit=${limit}`);
}

// 특정 사용자의 게시글 목록
async function getUserPosts(userId) {
  return apiRequest(`/posts/users/${userId}`);
}

// 게시글 작성
async function createPost(postData) {
  return apiRequest('/posts/', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
}

// 게시글 수정
async function updatePost(postId, postData) {
  return apiRequest(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
}

// 게시글 삭제
async function deletePost(postId) {
  return apiRequest(`/posts/${postId}`, {
    method: 'DELETE',
  });
}

// ===== 댓글 API =====

// 댓글 목록 조회
async function getComments(postId) {
  return apiRequest(`/posts/${postId}/comments`);
}

// 댓글 작성
async function createComment(postId, commentData) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
}

// 댓글 수정
async function updateComment(commentId, content) {
  return apiRequest(`/posts/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// 댓글 삭제
async function deleteComment(commentId) {
  return apiRequest(`/posts/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ===== 좋아요 API =====

// 내가 좋아요한 게시글 목록
async function getMyLikes(page = 1, limit = 10) {
  return apiRequest(`/likes/user?page=${page}&limit=${limit}`);
}

// 게시글의 좋아요 정보
async function getPostLikes(postId) {
  return apiRequest(`/likes/${postId}/likes`);
}

// 좋아요 토글
async function toggleLike(postId) {
  return apiRequest(`/likes/${postId}/like`, {
    method: 'POST',
  });
}

// ===== 팔로우 API =====

// 팔로우
async function followUser(userId) {
  return apiRequest(`/users/${userId}/follow`, {
    method: 'POST',
  });
}

// 언팔로우
async function unfollowUser(userId) {
  return apiRequest(`/users/${userId}/unfollow`, {
    method: 'DELETE',
  });
}

// 팔로워 목록
async function getFollowers(userId) {
  return apiRequest(`/users/${userId}/followers`);
}

// 팔로잉 목록
async function getFollowing(userId) {
  return apiRequest(`/users/${userId}/following`);
}

// 팔로우 상태 확인
async function getFollowStatus(userId) {
  return apiRequest(`/users/${userId}/follow-status`);
}

// ===== 추천 API =====

// 인기 게시글
async function getPopularPosts(page = 1, limit = 10) {
  return apiRequest(`/recommendation/popular?page=${page}&limit=${limit}`);
}

// 개인화 추천 게시글
async function getRecommendedPosts(page = 1, limit = 10) {
  return apiRequest(`/recommendation/?page=${page}&limit=${limit}`);
}

// ===== 검색 API =====

// 통합 검색
async function search(query = '', tags = [], page = 1) {
  let url = `/search/?q=${encodeURIComponent(query)}&page=${page}`;
  
  // 태그 파라미터 추가
  tags.forEach(tag => {
    url += `&tags=${encodeURIComponent(tag)}`;
  });
  
  return apiRequest(url);
}
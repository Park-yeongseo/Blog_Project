// API 기본 설정
const API_BASE_URL = 'http://localhost:8000';

// 로컬 스토리지 키
const TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';

// 페이지네이션 기본값
const DEFAULT_PAGE_SIZE = 10;

// 에러 메시지
const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
};

// 성공 메시지
const SUCCESS_MESSAGES = {
  LOGIN: '로그인되었습니다.',
  LOGOUT: '로그아웃되었습니다.',
  SIGNUP: '회원가입이 완료되었습니다.',
  POST_CREATED: '게시글이 작성되었습니다.',
  POST_UPDATED: '게시글이 수정되었습니다.',
  POST_DELETED: '게시글이 삭제되었습니다.',
  COMMENT_CREATED: '댓글이 작성되었습니다.',
  COMMENT_UPDATED: '댓글이 수정되었습니다.',
  COMMENT_DELETED: '댓글이 삭제되었습니다.',
  FOLLOW: '팔로우했습니다.',
  UNFOLLOW: '언팔로우했습니다.',
  PASSWORD_UPDATED: '비밀번호가 변경되었습니다.',
  PROFILE_UPDATED: '프로필이 수정되었습니다.'
};
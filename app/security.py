from passlib.context import CryptContext

# bycrypt 알고리즘을 사용하는 해싱 컨텍스트 생성
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordHasher:

    @staticmethod
    def hash_password(password: str) -> str:
    # 사용자 비밀번호를 bcrypt 알고리즘 해싱
    # 내부적으로 랜덤한 salt 자동 생성, 해시 결과는 문자영로 반환

        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
    # 입력된 비밀번호가 저장된 해시값과 일치하는지 검증
    # 저장된 해시값에서 salt, 알고리즘 정보를 추출해 비교
    
        return pwd_context.verify(password, hashed)

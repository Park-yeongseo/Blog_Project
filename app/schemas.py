import datetime
import re
from typing import Annotated, List, Optional
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field, StringConstraints, field_validator

def strip_string(a: str):
    '''
    문자열 앞뒤 공백 제거
    '''
    if isinstance(a, str):
        return a.strip()
    return a

def normalize_str(a: str):
    '''
    앞뒤 공백 제거, 연속 공백 제거
    '''
    if isinstance(a, str):
        a = a.strip()
        return re.sub(r'\s+',' ',a)
    return a
        

Username = Annotated[
    str, StringConstraints(max_length=20, min_length=2, pattern=r"^[A-Za-z가-힣]+$")
]
TrimmedStr = Annotated[str, BeforeValidator(strip_string)]
Normalizedstr = Annotated[str,BeforeValidator(normalize_str)]


class Login(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str):
        """
        비밀번호 유효성 검증: 유효한 값인지 확인
        """
        password = password.strip()
        if not password:
            raise ValueError("비밀 번호를 입력해 주세요")
        return password


class UserCreate(BaseModel):
    username: Username
    email: EmailStr
    password: str
    bio: Optional[str] = Field(default=None, max_length=500)

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str):
        if " " in password:
            raise ValueError("공백은 포함할 수 없습니다.")
        if len(password) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        if not any(c.isalpha() for c in password):
            raise ValueError("영문을 포함해야 합니다.")
        if not any(c.isdigit() for c in password):
            raise ValueError("숫자를 포함해야 합니다.")
        if not any(c in "!@#$%^&*" for c in password):
            raise ValueError("특수문자를 포함해야 합니다.")
        return password


class User(BaseModel):
    username: Username
    email: EmailStr
    bio : Optional[str] = Field(default=None, max_length=500)
    

class UserResponse(BaseModel):
    id : int 
    username: str
    email : str
    bio : str 
    total_views: int
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)
    
    
class Comment(BaseModel):
    content: TrimmedStr = Field(max_length=1000)
    
class CommentCreate(Comment):
    post_id: int
    parent_id : Optional[int] = Field(default=None, gt=0)
    
class CommentResponse(BaseModel):
    id : int
    post_id : int
    user_id : int
    parent_id : Optional[int]=None
    content : str
    depth: int
    created_at : datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)
    
class TagResponse(BaseModel):
    id : int
    name : str
    
    model_config = ConfigDict(from_attributes=True)
    
class FollowResponse(BaseModel):
    '''
    팔로우, 팔로잉 하는 유저 이름을 가져올땐 조인으로 가져와야 합니다.
    '''
    follower_id : int
    following_id : int
    created_at : datetime.datetime
    follower_username: Optional[str]= None
    following_username: Optional[str]= None
    
    model_config = ConfigDict(from_attributes=True)
    
class Book(BaseModel):
    isbn:str
    title : Normalizedstr =Field(min_length=1, max_length=200)
    author: Normalizedstr =Field(min_length=1, max_length=100)
    
    @field_validator('isbn')
    @classmethod
    def validate_isbn(cls, isbn: str):
        isbn = isbn.strip()
        if not (len(isbn)==13 or len(isbn)==10):
            raise ValueError('숫자 13자리 혹은 10자리(하이픈 미포함)으로 입력해 주세요')
        if not isbn.isdigit():
            raise ValueError('isbn은 숫자로 이루어져 있어야 합니다.')
        return isbn
    
class BookResponse(BaseModel):
    id: int
    isbn: str
    title: str
    author : str
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)
    

class PostCreate(BaseModel):
    title: TrimmedStr
    content: str
    isbn : str
    book_title : Normalizedstr
    book_author :Normalizedstr
    
    @field_validator('isbn')
    @classmethod
    def validate_isbn(cls, isbn: str):
        isbn = isbn.strip()
        if not (len(isbn)==13 or len(isbn)==10):
            raise ValueError('숫자 13자리 혹은 10자리(하이픈 미포함)으로 입력해 주세요')
        if not isbn.isdigit():
            raise ValueError('isbn은 숫자로 이루어져 있어야 합니다.')
        return isbn
    
class PostUpdate(BaseModel):
    title: Optional[Normalizedstr] = None
    content: Optional[str] = None
    

class Post(BaseModel):
    id: int
    user_id : int
    title: str
    content: str
    isbn : str
    views : int
    like_count : int
    created_at : datetime.datetime
    tags : List[TagResponse]
    
    model_config = ConfigDict(from_attributes=True)
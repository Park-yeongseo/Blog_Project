from datetime import datetime
from sqlalchemy import VARCHAR, Column, DateTime, ForeignKey, Integer, Text
from app.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(VARCHAR(50), unique=True)
    email = Column(VARCHAR(100), unique=True)
    password_hash = Column(VARCHAR(255))
    bio = Column(Text, default='사용자가 소개를 입력하지 않았습니다.') # 여기에서 원래는 소개가 선택사항이었는데 디폴트 값으로 "사용자가 소개를 입력하지 않았습니다."로 출력되게 바꿨어요
    total_views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now) #여기도 timestamp->datetime으로 바꿨어요
    posts = relationship("Post", back_populates='user')
    comments = relationship("Comment", back_populates='user')
    likes = relationship('Like', back_populates='user')

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(VARCHAR(200))
    content = Column(Text)
    isbn = Column(VARCHAR(13),ForeignKey("books.isbn"))
    views = Column(Integer, default=0)
    created_at = Column(DateTime,default=datetime.now) # 여기도 datetime으로 바꿨어요
    
    user = relationship('User', back_populates='posts')
    comments = relationship('Comment', back_populates='post')
    posttags = relationship('PostTag', back_populates='posts')
    book = relationship("Book", back_populates='posts')
    likes = relationship('Like', back_populates='post')
    


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True)
    name = Column(VARCHAR(50), unique=True)
    
    posttags = relationship("PostTag", back_populates='tags')
    
    
class PostTag(Base):
    __tablename__ = "posttags"
    post_id = Column(Integer, ForeignKey("posts.id", primary_key=True))
    tag_id = Column(Integer, ForeignKey("tags.id", primary_key=True))
    
    tags = relationship('Tag', back_populates='posttags')
    posts = relationship('Post', back_populates='posttags')
    
    

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True) # null이면 댓글, 값이 있으면 대댓글
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    depth = Column(Integer, default=0) # 깊이 1까지 허용
    
    post = relationship('Post', back_populates='comments')
    user = relationship("User", back_populates='comments')
    parent = relationship("Comment", remote_side=[id], backref='replies')
    
    
class Like(Base):
    __tablename__ = "likes"
    user_id = Column(Integer, ForeignKey("users.id", primary_key=True))
    post_id = Column(Integer, ForeignKey("posts.id", primary_key=True))
    created_at = Column(DateTime, default=datetime.now)
    
    user = relationship('User', back_populates='likes')
    post = relationship('Post', back_populates='likes')
    

class Follow(Base):
    __tablename__ = 'follows'
    follower_id = Column(Integer, ForeignKey("users.id", primary_key=True))   # 팔로우 하는 사람
    following_id = Column(Integer, ForeignKey("users.id", primary_key=True))  # 팔로우 당하는 사람
    created_at = Column(DateTime, default=datetime.now)
    
class Book(Base):
    __tablename__ = 'books'
    id = Column(Integer, primary_key=True)
    isbn = Column(VARCHAR(13), unique=True)
    title = Column(VARCHAR(200))
    author = Column(VARCHAR(100))
    created_at = Column(DateTime, default=datetime.now)
    
    posts = relationship("Post", back_populates="book")
    

class UserTagPreference(Base):
    __tablename__ = "usertagpreferences"
    user_id = Column(Integer, ForeignKey("users.id", primary_key=True))
    tag_id = Column(Integer, ForeignKey("tags.id", primary_key=True))
    frequency = Column(Integer, default=0)
    
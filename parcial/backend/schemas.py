from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# Schemas de Usuario
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

# Schemas de Comentarios
class CommentCreate(BaseModel):
    text: str

class CommentOut(BaseModel):
    id: int
    text: str
    user_id: int
    created_at: datetime
    owner: Optional[UserOut] = None

    class Config:
        from_attributes = True

# Schemas de Video
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: str

class VideoCreate(VideoBase):
    user_id: int

class VideoOut(VideoBase):
    id: int
    user_id: int
    created_at: datetime
    owner: Optional[UserOut] = None
    comments: List[CommentOut] = []

    class Config:
        from_attributes = True
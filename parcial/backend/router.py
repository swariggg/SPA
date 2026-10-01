import uuid
import boto3
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel import Session, select
from passlib.context import CryptContext

from backend.database import get_session, User, Video, Comment
from backend.config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
s3_client = boto3.client('s3', region_name=settings.AWS_REGION)


# --- HELPER S3 ---
def upload_to_s3(file: UploadFile, bucket: str) -> str:
    key = f"{uuid.uuid4()}-{file.filename}"
    try:
        s3_client.upload_fileobj(
            file.file,
            bucket,
            key,
            ExtraArgs={"ContentType": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir archivo a S3: {str(e)}")
    return f"https://{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"


# --- ESQUEMAS DTO (Pydantic) ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    name: str
    email: str

class UserProfileRead(UserRead):
    total_videos: int

class CommentCreate(BaseModel):
    content: str
    user_id: int

class CommentRead(BaseModel):
    id: int
    content: str
    created_at: datetime
    user_id: int
    user_name: str

class VideoRead(BaseModel):
    id: int
    title: str
    description: str
    video_url: str
    thumbnail_url: str
    views: int
    user_id: int
    user_name: str

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# ==================== USUARIOS & AUTH ====================

@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya esta registrado.")
    
    hashed_pwd = pwd_context.hash(user_data.password)
    new_user = User(name=user_data.name, email=user_data.email, password_hash=hashed_pwd)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.post("/login", response_model=UserRead, tags=["Usuarios"])
def login_user(credentials: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == credentials.email)).first()
    if not user or not pwd_context.verify(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")
    return user


@router.get("/users/{id}", response_model=UserProfileRead, tags=["Usuarios"])
def get_user_profile(id: int, session: Session = Depends(get_session)):
    user = session.get(User, id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    total_videos = len(user.videos) if user.videos else 0
    return UserProfileRead(
        id=user.id,
        name=user.name,
        email=user.email,
        total_videos=total_videos
    )


# ==================== VIDEOS ====================

@router.post("/videos", response_model=VideoRead, status_code=status.HTTP_201_CREATED, tags=["Videos"])
def create_video(
    title: str = Form(...),
    description: str = Form(...),
    user_id: int = Form(...),
    video_file: UploadFile = File(...),
    thumbnail_file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    video_url = upload_to_s3(video_file, settings.S3_BUCKET_VIDEOS)
    thumbnail_url = upload_to_s3(thumbnail_file, settings.S3_BUCKET_THUMBNAILS)

    new_video = Video(
        title=title,
        description=description,
        video_url=video_url,
        thumbnail_url=thumbnail_url,
        user_id=user_id
    )
    session.add(new_video)
    session.commit()
    session.refresh(new_video)

    return VideoRead(
        id=new_video.id,
        title=new_video.title,
        description=new_video.description,
        video_url=new_video.video_url,
        thumbnail_url=new_video.thumbnail_url,
        views=new_video.views,
        user_id=new_video.user_id,
        user_name=new_video.user.name if new_video.user else "Desconocido"
    )


@router.get("/videos", response_model=List[VideoRead], tags=["Videos"])
def get_videos(session: Session = Depends(get_session)):
    videos = session.exec(select(Video)).all()
    return [
        VideoRead(
            id=v.id, title=v.title, description=v.description,
            video_url=v.video_url, thumbnail_url=v.thumbnail_url,
            views=v.views, user_id=v.user_id,
            user_name=v.user.name if v.user else "Desconocido"
        ) for v in videos
    ]


@router.get("/videos/{id}", response_model=VideoRead, tags=["Videos"])
def get_video_by_id(id: int, session: Session = Depends(get_session)):
    video = session.get(Video, id)
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado.")
    
    video.views += 1
    session.add(video)
    session.commit()
    session.refresh(video)

    return VideoRead(
        id=video.id, title=video.title, description=video.description,
        video_url=video.video_url, thumbnail_url=video.thumbnail_url,
        views=video.views, user_id=video.user_id,
        user_name=video.user.name if video.user else "Desconocido"
    )


@router.put("/videos/{id}", response_model=VideoRead, tags=["Videos"])
def update_video(id: int, video_data: VideoUpdate, session: Session = Depends(get_session)):
    video = session.get(Video, id)
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado.")
    
    if video_data.title is not None:
        video.title = video_data.title
    if video_data.description is not None:
        video.description = video_data.description

    session.add(video)
    session.commit()
    session.refresh(video)

    return VideoRead(
        id=video.id, title=video.title, description=video.description,
        video_url=video.video_url, thumbnail_url=video.thumbnail_url,
        views=video.views, user_id=video.user_id,
        user_name=video.user.name if video.user else "Desconocido"
    )


@router.delete("/videos/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Videos"])
def delete_video(id: int, session: Session = Depends(get_session)):
    video = session.get(Video, id)
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado.")
    session.delete(video)
    session.commit()
    return None


# ==================== COMENTARIOS ====================

@router.post("/videos/{id}/comments", response_model=CommentRead, tags=["Comentarios"])
def add_comment(id: int, comment_data: CommentCreate, session: Session = Depends(get_session)):
    comment = Comment(content=comment_data.content, user_id=comment_data.user_id, video_id=id)
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return CommentRead(
        id=comment.id, content=comment.content, created_at=comment.created_at,
        user_id=comment.user_id, user_name=comment.user.name if comment.user else "Desconocido"
    )


@router.get("/videos/{id}/comments", response_model=List[CommentRead], tags=["Comentarios"])
def get_comments(id: int, session: Session = Depends(get_session)):
    comments = session.exec(select(Comment).where(Comment.video_id == id)).all()
    return [
        CommentRead(
            id=c.id, content=c.content, created_at=c.created_at,
            user_id=c.user_id, user_name=c.user.name if c.user else "Desconocido"
        ) for c in comments
    ]
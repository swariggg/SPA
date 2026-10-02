from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import get_db

router = APIRouter()

# ================= AUTENTICACIÓN Y USUARIOS =================

@router.post("/users/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.password != credentials.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    return {"message": "Login exitoso", "user": {"id": user.id, "username": user.username, "email": user.email}}

@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


# ================= VIDEOS =================

@router.get("/videos/", response_model=List[schemas.VideoOut])
def get_videos(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Video)
    if user_id:
        query = query.filter(models.Video.user_id == user_id)
    return query.all()

@router.get("/videos/{video_id}", response_model=schemas.VideoOut)
def get_video_by_id(video_id: int, db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return video

@router.post("/videos/", response_model=schemas.VideoOut, status_code=status.HTTP_201_CREATED)
def create_video(video: schemas.VideoCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == video.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    new_video = models.Video(
        title=video.title,
        description=video.description,
        video_url=video.video_url,
        user_id=video.user_id
    )
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    return new_video


# ================= COMENTARIOS =================

@router.post("/videos/{video_id}/comments/", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(video_id: int, comment: schemas.CommentCreate, user_id: int, db: Session = Depends(get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    
    new_comment = models.Comment(
        text=comment.text,
        video_id=video_id,
        user_id=user_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/videos/{video_id}/comments/", response_model=List[schemas.CommentOut])
def get_video_comments(video_id: int, db: Session = Depends(get_db)):
    return db.query(models.Comment).filter(models.Comment.video_id == video_id).all()
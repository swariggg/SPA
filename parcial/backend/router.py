from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter()

@router.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(email=user.email, hashed_password=user.password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/videos/")
def create_video(video: schemas.VideoCreate, db: Session = Depends(get_db)):
    db_video = models.Video(title=video.title, s3_url=video.s3_url, owner_id=video.owner_id)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video

@router.get("/videos/")
def get_videos(db: Session = Depends(get_db)):
    return db.query(models.Video).all()
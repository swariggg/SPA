import os
import uuid
import boto3
from typing import Optional
from fastapi import FastAPI, Depends, File, Form, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, database

# Crear tablas en RDS si no existen
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Streaming API")

# Configuración de CORS para comunicación con S3 / Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables de AWS S3
AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
BUCKET_VIDEOS = os.getenv("BUCKET_VIDEOS", "videosappi")
BUCKET_MINIATURAS = os.getenv("BUCKET_MINIATURAS", "miniaturasbucketapi")

# Cliente S3 (USA el Rol IAM asignado a la EC2)
s3_client = boto3.client("s3", region_name=AWS_REGION)

# ----------------------------------------------------
# SCHEMAS (Pydantic)
# ----------------------------------------------------
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class CommentCreate(BaseModel):
    text: str
    user_id: int
    video_id: int

# ----------------------------------------------------
# ENDPOINTS PRINCIPALES
# ----------------------------------------------------
@app.get("/")
def read_root():
    return {"message": "API corriendo exitosamente"}

# ----------------------------------------------------
# ENDPOINTS DE USUARIOS Y AUTENTICACIÓN
# ----------------------------------------------------
@app.post("/users/", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        password=user.password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login/")
def login(credentials: UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    return {"message": "Login exitoso", "user": user}

@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# ----------------------------------------------------
# ENDPOINTS DE VIDEOS
# ----------------------------------------------------
@app.get("/videos/")
def get_videos(user_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Video)
    if user_id:
        query = query.filter(models.Video.user_id == user_id)
    return query.all()

@app.get("/videos/{video_id}")
def get_video(video_id: int, db: Session = Depends(database.get_db)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return video

@app.post("/videos/", status_code=status.HTTP_201_CREATED)
async def upload_video(
    title: str = Form(...),
    description: str = Form(""),
    user_id: int = Form(...),
    video_file: UploadFile = File(...),
    thumbnail_file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    try:
        # Generar nombres únicos
        v_ext = video_file.filename.split(".")[-1]
        t_ext = thumbnail_file.filename.split(".")[-1]

        v_key = f"videos/{uuid.uuid4()}.{v_ext}"
        t_key = f"thumbnails/{uuid.uuid4()}.{t_ext}"

        # 1. Subida del video a S3 (videosappi)
        s3_client.upload_fileobj(
            video_file.file,
            BUCKET_VIDEOS,
            v_key,
            ExtraArgs={"ContentType": video_file.content_type}
        )
        video_url = f"https://{BUCKET_VIDEOS}.s3.{AWS_REGION}.amazonaws.com/{v_key}"

        # 2. Subida de la miniatura a S3 (miniaturasbucketapi)
        s3_client.upload_fileobj(
            thumbnail_file.file,
            BUCKET_MINIATURAS,
            t_key,
            ExtraArgs={"ContentType": thumbnail_file.content_type}
        )
        thumbnail_url = f"https://{BUCKET_MINIATURAS}.s3.{AWS_REGION}.amazonaws.com/{t_key}"

        # 3. Guardar registro en la Base de Datos RDS
        db_video = models.Video(
            title=title,
            description=description,
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            user_id=user_id
        )
        db.add(db_video)
        db.commit()
        db.refresh(db_video)

        return db_video

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar la subida a S3: {str(e)}"
        )

# ----------------------------------------------------
# ENDPOINTS DE COMENTARIOS
# ----------------------------------------------------
@app.get("/comments/{video_id}")
def get_comments(video_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Comment).filter(models.Comment.video_id == video_id).all()

@app.post("/comments/", status_code=status.HTTP_201_CREATED)
def create_comment(comment: CommentCreate, db: Session = Depends(database.get_db)):
    new_comment = models.Comment(
        text=comment.text,
        user_id=comment.user_id,
        video_id=comment.video_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
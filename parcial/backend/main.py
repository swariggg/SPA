import os
import uuid
import boto3
from fastapi import FastAPI, Depends, File, Form, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variables desde el .env
AWS_REGION = os.getenv("AWS_REGION", "us-east-2")
BUCKET_VIDEOS = os.getenv("BUCKET_VIDEOS", "videosappi")
BUCKET_MINIATURAS = os.getenv("BUCKET_MINIATURAS", "miniaturasbucketapi")

# boto3 usa automáticamente el Rol IAM asignado a la EC2
s3_client = boto3.client("s3", region_name=AWS_REGION)

@app.get("/")
def read_root():
    return {"message": "API corriendo exitosamente"}

# Endpoint para subir video e imagen directamente a S3
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
        # Generar nombres únicos para evitar sobrescribir archivos
        v_ext = video_file.filename.split(".")[-1]
        t_ext = thumbnail_file.filename.split(".")[-1]

        v_key = f"videos/{uuid.uuid4()}.{v_ext}"
        t_key = f"thumbnails/{uuid.uuid4()}.{t_ext}"

        # 1. Subida del archivo de Video a S3 (videosappi)
        s3_client.upload_fileobj(
            video_file.file,
            BUCKET_VIDEOS,
            v_key,
            ExtraArgs={"ContentType": video_file.content_type}
        )
        video_url = f"https://{BUCKET_VIDEOS}.s3.{AWS_REGION}.amazonaws.com/{v_key}"

        # 2. Subida de la Miniatura a S3 (miniaturasbucketapi)
        s3_client.upload_fileobj(
            thumbnail_file.file,
            BUCKET_MINIATURAS,
            t_key,
            ExtraArgs={"ContentType": thumbnail_file.content_type}
        )
        thumbnail_url = f"https://{BUCKET_MINIATURAS}.s3.{AWS_REGION}.amazonaws.com/{t_key}"

        # 3. Guardar registro en la Base de Datos RDS (PostgreSQL)
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
            detail=f"Error procesando la subida a S3: {str(e)}"
        )
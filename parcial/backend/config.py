import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/videodb")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-2")
    S3_BUCKET_VIDEOS: str = os.getenv("S3_BUCKET_VIDEOS", "mi-bucket-videos")
    S3_BUCKET_THUMBNAILS: str = os.getenv("S3_BUCKET_THUMBNAILS", "mi-bucket-miniaturas")

settings = Settings()
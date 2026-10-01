from pydantic import BaseModel

class UserCreate(BaseModel):
    email: str
    password: str

class VideoCreate(BaseModel):
    title: str
    s3_url: str
    owner_id: int
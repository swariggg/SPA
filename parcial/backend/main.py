from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
import router

# Crea las tablas automáticamente en PostgreSQL si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Video App API")

# Configurar CORS para permitir peticiones desde React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router.router)

@app.get("/")
def read_root():
    return {"message": "API corriendo exitosamente"}
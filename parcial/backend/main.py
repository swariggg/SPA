from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from router import router

# Crea las tablas en AWS RDS al arrancar
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluye las rutas que definiste en router.py
app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API conectada a AWS RDS y rutas operativas"}
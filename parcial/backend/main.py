# pyright: reportMissingImports=false
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db
from backend.router import router

app = FastAPI(
    title="Plataforma de Videos API",
    description="API RESTful para la plataforma de streaming alojada en AWS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(router)

@app.get("/", tags=["HealthCheck"])
def root():
    return {"status": "ok", "message": "API de Plataforma de Videos activa"}
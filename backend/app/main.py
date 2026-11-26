from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .config import FRONTEND_ORIGIN
from .routes import auth_routes, repository_routes, history_routes, settings_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SustainScore API", version="1.0.0",
              description="Sustainable cloud infrastructure repository maturity assessment.")
app.add_middleware(CORSMiddleware, allow_origins=[FRONTEND_ORIGIN],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_routes.router)
app.include_router(repository_routes.router)
app.include_router(history_routes.router)
app.include_router(settings_routes.router)

@app.get("/")
def root():
    return {"message": "SustainScore API is running."}

@app.get("/health")
def health():
    return {"status": "ok"}

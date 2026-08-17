from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import reports, auth, users, comments, ai
 
app = FastAPI(title="Sorun Var API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(comments.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"message": "Sorun Var API"}
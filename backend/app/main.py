from fastapi import FastAPI

from app.routes import ai, auth, comments, reports, users

app = FastAPI(
    title="Sorun Burada API",
    version="1.0.0",
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(comments.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"message": "Sorun Burada API"}
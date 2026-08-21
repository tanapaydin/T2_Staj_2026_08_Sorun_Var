from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes import reports, auth, users, comments, ai
from app.services.email_service import EmailDeliveryError
 
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


@app.exception_handler(EmailDeliveryError)
def email_delivery_error_handler(_request: Request, exc: EmailDeliveryError):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.get("/")
def root():
    return {"message": "Sorun Var API"}

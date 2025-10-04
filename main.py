from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError


app= FastAPI()

@app.exception_handler(ValidationError)
def validation_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error_code": "ValidationError",
            "errors": exc.errors()
        }
    )
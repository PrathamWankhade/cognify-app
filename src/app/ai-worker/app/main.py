# cognify/apps/ai-worker/app/main.py
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from .processor import DocumentProcessor
import asyncio
from dotenv import load_dotenv

load_dotenv() # Load environment variables for FastAPI app

app = FastAPI()
processor = DocumentProcessor()

class ProcessDocumentRequest(BaseModel):
    documentId: str
    documentUrl: str
    userId: str
    courseId: str
    fileType: str # e.g., "PDF", "TEXT", "YOUTUBE_URL"

@app.post("/process-document")
async def process_document_endpoint(request: ProcessDocumentRequest, background_tasks: BackgroundTasks):
    """
    Receives a request to process a document and adds it to background tasks.
    """
    # Validate required fields
    if not request.documentId or not request.documentUrl or not request.userId or not request.courseId:
        raise HTTPException(status_code=400, detail="Missing required document information.")

    # Schedule the document processing in the background
    # This prevents the HTTP request from timing out during long processing
    background_tasks.add_task(
        processor.process_document,
        request.documentId,
        request.documentUrl,
        request.userId,
        request.courseId,
        request.fileType
    )
    
    return {"message": "Document processing started in background."}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
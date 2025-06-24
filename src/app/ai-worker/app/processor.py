# cognify/apps/ai-worker/app/processor.py
import os
import requests
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LangchainDocument
from .vector_db import VectorDBClient
import asyncio # For async operations if needed, or remove
import httpx # For async http requests
from dotenv import load_dotenv

load_dotenv() # Load env vars for this service

# Setup database client for updating document status
# You'd typically use a proper ORM client like SQLAlchemy or psycopg2 here.
# For simplicity, we'll use direct DB interaction or a simple HTTP client if you had a separate DB service.
# For now, let's assume direct psycopg2-binary for status updates
import psycopg2

def update_document_status_in_db(document_id: str, status: str):
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute(
            "UPDATE \"Document\" SET status = %s WHERE id = %s;",
            (status, document_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        print(f"Document {document_id} status updated to {status}")
    except Exception as e:
        print(f"Error updating document status for {document_id}: {e}")
        # In a real app, you'd have more robust error handling / retry mechanisms

class DocumentProcessor:
    def __init__(self):
        self.vector_db_client = VectorDBClient()
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )

    async def process_document(self, document_id: str, document_url: str, user_id: str, course_id: str, file_type: str):
        try:
            print(f"Processing document {document_id} from {document_url}...")
            update_document_status_in_db(document_id, "PROCESSING")

            # 1. Download the document
            async with httpx.AsyncClient() as client:
                response = await client.get(document_url)
                response.raise_for_status() # Raise an exception for HTTP errors
                file_content = response.content

            # 2. Extract text based on file type
            text = ""
            if file_type == "PDF":
                reader = PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    text += page.extract_text() or ""
            # TODO: Add more file types (e.g., DOCX, TXT, video transcription)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

            if not text:
                raise ValueError("No text extracted from document.")

            # 3. Chunk the extracted text
            chunks = self.text_splitter.split_text(text)
            print(f"Split document into {len(chunks)} chunks.")

            # 4. Generate embeddings and prepare for vector DB upsert
            vectors_to_upsert = []
            for i, chunk in enumerate(chunks):
                embedding = self.vector_db_client.get_embedding(chunk)
                vectors_to_upsert.append({
                    "id": f"{document_id}-{i}", # Unique ID for each chunk
                    "values": embedding,
                    "metadata": {
                        "document_id": document_id,
                        "user_id": user_id,
                        "course_id": course_id,
                        "chunk_index": i,
                        "text": chunk, # Store the original text of the chunk
                    }
                })

            # 5. Upsert vectors to Pinecone
            self.vector_db_client.upsert_vectors(vectors_to_upsert)

            # 6. Update document status to COMPLETED
            update_document_status_in_db(document_id, "COMPLETED")
            print(f"Document {document_id} processed successfully.")

        except Exception as e:
            print(f"Failed to process document {document_id}: {e}")
            update_document_status_in_db(document_id, "FAILED")
            # In a real system, you'd send an alert or retry
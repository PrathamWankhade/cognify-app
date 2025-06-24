# cognify/apps/ai-worker/app/vector_db.py
import os
from pinecone import Pinecone, Index
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env

class VectorDBClient:
    def __init__(self):
        self.pinecone_api_key = os.getenv("PINECONE_API_KEY")
        self.pinecone_environment = os.getenv("PINECONE_ENVIRONMENT") # Or PINECONE_CLOUD if new Pinecone
        self.index_name = os.getenv("PINECONE_INDEX_NAME", "cognify-documents") # Default index name

        if not self.pinecone_api_key or not self.pinecone_environment:
            raise ValueError("PINECONE_API_KEY and PINECONE_ENVIRONMENT must be set in .env")

        self.pc = Pinecone(api_key=self.pinecone_api_key)
        self.index: Index = self._init_index()
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) # For embeddings

    def _init_index(self):
        # Create index if it doesn't exist
        if self.index_name not in self.pc.list_indexes():
            print(f"Creating Pinecone index: {self.index_name}")
            self.pc.create_index(
                name=self.index_name,
                dimension=1536,  # 1536 is the dimension for OpenAI's text-embedding-ada-002
                metric='cosine',
                spec=os.getenv("PINECONE_INDEX_SPEC", "serverless") # Use serverless for new accounts
            )
        return self.pc.Index(self.index_name)

    def get_embedding(self, text: str):
        # This function sends text to OpenAI to get its vector representation
        response = self.openai_client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding

    def upsert_vectors(self, vectors: list):
        # Upserts (inserts or updates) vectors into the Pinecone index
        # Each vector in the list should be a tuple or dict: (id, embedding, metadata)
        self.index.upsert(vectors=vectors)
        print(f"Upserted {len(vectors)} vectors to Pinecone.")

    def query_vectors(self, query_embedding: list, top_k: int = 5, filter: dict = None):
        # Queries the Pinecone index for similar vectors
        return self.index.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter,
            include_metadata=True
        )

# Important: Add these to your cognify/.env file for the worker
# PINECONE_API_KEY=your_pinecone_api_key
# PINECONE_ENVIRONMENT=your_pinecone_environment # e.g., us-east-1 (or remove for serverless)
# OPENAI_API_KEY=your_openai_api_key
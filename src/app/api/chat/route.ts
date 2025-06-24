// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai'; // For Gemini
import { StreamingTextResponse, LangChainStream } from 'ai'; // From Vercel AI SDK

// IMPORTANT: Assuming you have a way to call your Python AI Worker's embedding function
// For a Next.js full-stack app, you might consider having the embedding model directly in JS
// if you use a JS-based embedding library, or call the Python worker's embedding endpoint.
// For simplicity, for chat query, we'll assume a direct call to a _separate_ embedding API
// or that Gemini itself can handle embedding the query.
// Let's create a utility to get embeddings for the query.
// We'll call the HuggingFace Inference API directly from Next.js for the query embedding.

const HF_INFERENCE_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";
const HF_TOKEN = process.env.HF_TOKEN;

async function getEmbedding(text: string): Promise<number[]> {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is not set in environment variables.");
  }
  const response = await fetch(HF_INFERENCE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Hugging Face Embedding API Error:", errorData);
    throw new Error(`Failed to get embedding from Hugging Face: ${response.statusText}`);
  }
  const embedding = await response.json();
  return embedding as number[];
}

// --- Pinecone Client (in JS for query) ---
// For querying, it's efficient to have the Pinecone client in JS directly.
// This requires `npm install @pinecone-database/pinecone`
// And your Pinecone API keys in the .env for Next.js.
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!, // or cloud: process.env.PINECONE_CLOUD, depending on your setup
});
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME || "cognify-documents");


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { messages, courseId } = await req.json(); // messages is an array of chat history
  const userQuestion = messages[messages.length - 1].content; // Get the latest user message

  try {
    // 1. Generate embedding for the user's question
    const queryEmbedding = await getEmbedding(userQuestion);

    // 2. Query Pinecone for relevant document chunks
    const pineconeResponse = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 5, // Get top 5 most relevant chunks
      filter: {
        // Filter by user ID and course ID to ensure security and relevance
        user_id: { '$eq': session.user.id },
        course_id: { '$eq': courseId },
      },
      includeMetadata: true,
    });

    const context = pineconeResponse.matches?.map(match => (match.metadata as any)?.text).join("\n\n") || "No specific context found.";

    // 3. Prepare the prompt for the LLM with context
    const fullPrompt = `You are a helpful AI study assistant named Cognify. 
    Your goal is to answer questions based on the provided course material.
    
    Course Material Context:
    ${context}

    User's Question: ${userQuestion}
    
    If the answer is not available in the provided context, state that you don't have enough information from the material. Do not make up answers.`;

    // 4. Initialize Google Gemini Pro
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro for text generation

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    // 5. Stream the response back to the client using Vercel AI SDK
    const { stream } = LangChainStream(); // LangChainStream doesn't directly support Gemini streaming yet,
                                      // so we'll use a simple Response constructor for now.
                                      // For true streaming with Gemini, you'd integrate its streaming API.

    // A simple non-streaming response for now, will implement streaming in chat UI directly later
    return new StreamingTextResponse(new ReadableStream({
      async start(controller) {
        controller.enqueue(text);
        controller.close();
      }
    }));


  } catch (error) {
    console.error("AI_TUTOR_ERROR", error);
    return new NextResponse('Internal Server Error while processing AI query.', { status: 500 });
  }
}
from langchain_pinecone import PineconeVectorStore
import os
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.tools import tool
from huggingface_hub import InferenceClient

load_dotenv()

# ------------------------------------------------------------------
# Environment Variables & API Clients
# ------------------------------------------------------------------
HF_TOKEN = os.getenv("HF_TOKEN")

embedding_model = HuggingFaceEmbeddings(
    model_name=os.getenv("HF_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
)
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=PINECONE_API_KEY)
pinecone_index = pc.Index(PINECONE_INDEX_NAME)
hf_client = InferenceClient(api_key=HF_TOKEN)

@tool
def retrieval_from_docs(user_id: int, query: str) -> str:
    """
    Search the user's uploaded documents and return the most relevant information
    for answering the user's question.
    """

    vector_store = PineconeVectorStore(
        index=pinecone_index,
        embedding=embedding_model,
        namespace=f"user_id_{user_id}_documents",
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 5})

    docs = retriever.invoke(query)

    return "\n\n".join(doc.page_content for doc in docs)
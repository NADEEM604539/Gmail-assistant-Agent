from langchain_pinecone import PineconeVectorStore
from langchain_core.embeddings import Embeddings
from huggingface_hub import InferenceClient
from pinecone import Pinecone
from langchain.tools import tool
from dotenv import load_dotenv
import numpy as np
import os

load_dotenv()

# ------------------------------------------------------------------
# Environment Variables
# ------------------------------------------------------------------
HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# ------------------------------------------------------------------
# Clients
# ------------------------------------------------------------------
pc = Pinecone(api_key=PINECONE_API_KEY)
pinecone_index = pc.Index(PINECONE_INDEX_NAME)

hf_client = InferenceClient(api_key=HF_TOKEN)


# ------------------------------------------------------------------
# HuggingFace API Embeddings
# ------------------------------------------------------------------
class HFInferenceEmbeddings(Embeddings):

    def __init__(self, client, model):
        self.client = client
        self.model = model

    def _mean_pool(self, output):
        arr = np.array(output)

        if arr.ndim == 3:
            return np.mean(arr, axis=1)[0].tolist()

        elif arr.ndim == 2:
            return np.mean(arr, axis=0).tolist()

        return arr.tolist()

    def embed_query(self, text: str):
        output = self.client.feature_extraction(
            text,
            model=self.model
        )
        return self._mean_pool(output)

    def embed_documents(self, texts):
        return [self.embed_query(text) for text in texts]


embedding_model = HFInferenceEmbeddings(
    client=hf_client,
    model=HF_MODEL,
)


# ------------------------------------------------------------------
# Retrieval Tool
# ------------------------------------------------------------------
@tool
def retrieval_from_docs(user_id: int, query: str) -> str:
    """
    Search the authenticated user's uploaded documents in Pinecone and
    return the most relevant document chunks for answering the query.
    """

    vector_store = PineconeVectorStore(
        index=pinecone_index,
        embedding=embedding_model,
        namespace=f"user_id_{user_id}_documents",
    )

    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5}
    )

    docs = retriever.invoke(query)

    if not docs:
        return "No relevant documents were found."

    return "\n\n".join(doc.page_content for doc in docs)
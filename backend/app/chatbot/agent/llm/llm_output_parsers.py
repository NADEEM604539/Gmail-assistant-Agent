from app.chatbot.agent.structures import DraftEmail_parser
from dotenv import load_dotenv
from app.chatbot.agent.llm.prompts import EmailDraft_template
from app.gmail.DTO import DraftRequest
from langchain_openai import ChatOpenAI
from app.gmail.DTO import DraftRequest
from app.chatbot.agent.llm.prompts import draftEmail_prompt


load_dotenv()

llm = ChatOpenAI(
    model="gpt-4.1-mini",  
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)

def generateDraft(request: DraftRequest):
    prompt = draftEmail_prompt.format(user_query=request.model_dump_json) 
    draft = llm.invoke(prompt)
    return draft
    





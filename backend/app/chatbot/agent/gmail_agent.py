from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from app.chatbot.agent.tools import gmail_tools  


llm = ChatOpenAI(
    model="gpt-4.1-mini",
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)

tools = gmail_tools
gmail_agent = create_agent(
    model=llm,
    tools=tools
)

def gmail_Agent(user_id:int, query:str):
    result = gmail_agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": f"u have to work and call tools according with the user_id as {user_id} and the query is {query}"
            }
        ]
    }
)
    print(result)
    return result["messages"][-1].content


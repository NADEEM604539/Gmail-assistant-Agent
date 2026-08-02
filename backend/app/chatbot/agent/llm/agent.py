from langchain.agents import create_agent
from langchain_openai import ChatOpenAI


llm = ChatOpenAI(
    model="gpt-4.1-mini",
    base_url="https://openai-rg-nadeem.openai.azure.com/openai/v1",
)

tools = []
agent = create_agent(
    model=llm,
    tools=tools
)

def callagent():
    result = agent.invoke(
    {
        "messages": [
            {
                "role": "",
                "content": ""
            }
        ]
    }
)
    return ""


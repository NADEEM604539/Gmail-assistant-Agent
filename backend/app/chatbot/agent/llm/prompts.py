from langchain_core.prompts import PromptTemplate
from app.chatbot.agent.structures import DraftEmail_parser


draftEmail_prompt = PromptTemplate(
    template="""
You are an AI email planning assistant.

Analyze the user's request and extract all relevant information needed to generate an email draft.

- Infer the topic, tone, and writing context.
- Extract recipient email addresses if provided.
- Extract the subject only if explicitly mentioned.
- Extract the target word count if specified.
- Use null for unknown fields.
- Do not invent information.

{format_instructions}

User Request:
{user_query}
""",
    input_variables=["user_query"],
    partial_variables={
        "format_instructions": DraftEmail_parser.get_format_instructions()
    }
)
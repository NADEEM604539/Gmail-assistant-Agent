from langchain_core.prompts import PromptTemplate
from app.chatbot.agent.structures import DraftEmail_parser


EmailDraft_template = PromptTemplate(
    template="""
You are an AI email planning assistant.

Return a valid JSON object matching the schema below.

Important rules:
- Always include a non-empty string value for "subject".
- If the user did not provide a subject, create a short, natural subject based on the request.
- Do not leave any field as null unless the schema explicitly allows it.
- For missing recipient details, use an empty list [] rather than null.
- For missing metadata, use sensible defaults such as "friendly" tone, "normal" priority, and "English" language.
- Do not invent personal details. Use placeholders like [Your Name] only when needed for the draft body.

{format_instructions}

User Request:
{user_query}
""",
    input_variables=["user_query"],
    partial_variables={
        "format_instructions": DraftEmail_parser.get_format_instructions()
    }
)
from langchain_core.prompts import PromptTemplate
from app.chatbot.agent.structures import DraftEmail_parser, ShouldReply_parser, ReplyEmail_parser


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
- Use placeholders like [Your Name] at the end of the draft body.

{format_instructions}

User Request:
{user_query} and use {user_details} to end the mail this is the sender user_details the name of sender and email of sender
""",
    input_variables=["user_query", "user_details"],
    partial_variables={
        "format_instructions": DraftEmail_parser.get_format_instructions()
    }
)


ShouldReply_template = PromptTemplate(
    template="""
You decide whether an email should receive an automatic reply.

Reply true only if the sender is likely expecting a response.

Reply false for automated emails, notifications, newsletters, promotions, receipts, OTPs, security alerts, reminders, mailing lists, no-reply senders, spam, or emails that do not require a response.

Email:
{email}

{format_instructions}
""",
    input_variables=["email"],
    partial_variables={
        "format_instructions": ShouldReply_parser.get_format_instructions()
    }
)


EmailReply_template = PromptTemplate(
    template="""
You are an AI email assistant.

Your task is to write a natural email reply to the received email.

Guidelines:

- Read the entire email carefully.
- Understand the sender's intent before replying.
- Reply only to what is actually mentioned.
- Do not invent facts or make assumptions.
- Do not promise meetings, payments, deliveries, or actions unless they are clearly supported by the email.
- Keep the tone similar to the sender's email.
- If the sender asks a question, answer it if the information is available. Otherwise politely acknowledge it.
- If information is missing, ask a brief follow-up question instead of guessing.
- Keep the reply concise unless the email clearly requires a detailed response.
- Be polite and professional.
- Do not include markdown.
- Do not include explanations.
- Do not include notes to yourself.
- Do not include placeholders such as [Name] or [Company].
- Do not include a subject line.
- Return only the email body.

Current User:
{user_details} this is the user which is reply to the email add it at the end of the gmail.

Received Email:
{email}

{format_instructions}
""",
    input_variables=["user_details", "email"],
    partial_variables={
        "format_instructions": ReplyEmail_parser.get_format_instructions()
    }
)

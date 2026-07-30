from app.chatbot.agent.llm.llm_output_parsers import shouldReply, createReplyEmail
from app.gmail.DTO import User
def filter_and_send_messages(gmail, start_history_id, user_details: User):
    gmail_messages = gmail.get_messages_since_history_id(start_history_id)
    for message in gmail_messages:
        status = shouldReply(email=message)
        if status == True:
            email = createReplyEmail(request=message, user_details=user_details)
            gmail.auto_reply_send(message_id=message["id"], email=email)
        else:
            continue

    return {"success":True}
from app.chatbot.agent.llm.llm_output_parsers import shouldReply, createReplyEmail
from app.preferences.preferences_service import getPreferences
from app.gmail.DTO import User
from app.database.ai_action_service import log_ai_email_action


def filter_and_send_messages(gmail, start_history_id, user_details: User, user_id: int):
    gmail_messages = gmail.get_messages_since_history_id(start_history_id)
    preferences = getPreferences(user_id=user_id)

    for message in gmail_messages:
        if message["from"]["email"] != user_details.email:
            status = shouldReply(email=message)
            if status == True:
                try:
                    email = createReplyEmail(request=message, user_details=user_details, preferences=preferences)
                    gmail.auto_reply_send(message_id=message["id"], email=email)
                    log_ai_email_action(
                        user_id=user_id,
                        action_type="reply_generated",
                        status="completed",
                        input_text=str(message),
                        output_text=str(email),
                        metadata={"message_id": message.get("id"), "subject": message.get("subject")},
                        email_id=message.get("id"),
                    )
                except Exception as exc:
                    log_ai_email_action(
                        user_id=user_id,
                        action_type="reply_generated",
                        status="failed",
                        input_text=str(message),
                        error_message=str(exc),
                        metadata={"message_id": message.get("id"), "subject": message.get("subject")},
                        email_id=message.get("id"),
                    )
                    raise
            else:
                continue
        else:
            continue
    return {"success": True}
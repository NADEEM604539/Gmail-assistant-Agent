from email.utils import parseaddr, parsedate_to_datetime,  getaddresses
from datetime import datetime

def format_time(dt):
    if not dt:
        return ""

    now = datetime.now()

    if dt.date() == now.date():
        return dt.strftime("%I:%M %p")

    diff = (now.date() - dt.date()).days

    if diff == 1:
        return "Yesterday"

    if diff < 7:
        return f"{diff} days ago"

    return dt.strftime("%d %b")




def Card_email_parser(email):
    payload = email["payload"]

    headers = {
        h["name"]: h["value"]
        for h in payload.get("headers", [])
    }

    labels = email.get("labelIds", [])

    sender_name, sender_email = parseaddr(headers.get("From", ""))

    try:
        email_date = parsedate_to_datetime(headers["Date"])
    except Exception:
        email_date = None

    sender = sender_name or sender_email or "Unknown"

    avatar_name = sender.replace(" ", "+")

    return {
        "email_id": email["id"],
        "sender": sender,
        "email": sender_email,
        "avatar": f"https://ui-avatars.com/api/?name={avatar_name}",
        "subject": headers.get("Subject", ""),
        "preview": email.get("snippet", ""),
        "status": "unread" if "UNREAD" in labels else "read",
        "starred": "STARRED" in labels,
        "important": "IMPORTANT" in labels,
        "time": format_time(email_date)
    }

def get_headers(payload):
    headers = {}

    for header in payload.get("headers", []):
        headers[header["name"]] = header["value"]

    return headers

def get_email_body(payload):
    if "parts" in payload:
            # Prefer plain text
        for part in payload["parts"]:
            if part["mimeType"] == "text/plain":
                data = part["body"].get("data")
                if data:
                    return base64.urlsafe_b64decode(data + "==").decode("utf-8")

            # Fall back to HTML
        for part in payload["parts"]:
            if part["mimeType"] == "text/html":
                data = part["body"].get("data")
                if data:
                    html = base64.urlsafe_b64decode(data + "==").decode("utf-8")
                    return BeautifulSoup(html, "html.parser").get_text()

        # Single-part message
    data = payload["body"].get("data")
    if data:
        return base64.urlsafe_b64decode(data + "==").decode("utf-8")

    return ""


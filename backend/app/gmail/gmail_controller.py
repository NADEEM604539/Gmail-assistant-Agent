from fastapi import APIRouter, Depends, Request , HTTPException, Form, File, UploadFile
from fastapi.responses import Response
from app.auth.auth_service import googleLogin
from app.gmail.DTO import parse_recipients
from app.auth.DTO import GoogleLoginRequest
from app.auth.jwt.service import get_current_user
from app.chatbot.agent.objects import DraftEmail, EmailAttachment, EmailRecipient
from app.gmail.gmail import get_5_emails, getEmail, get_account, toggle_auto_reply
from app.gmail.inbox_service import get_Inbox, deleteBunch, trashBunch,manage_star_status , read_status, archive, untrash, markspam, mark_not_spam, delete, trashOne
from app.gmail.sent_service import get_Sent, draft_Sent
from app.gmail.draft_service import get_Draft
from app.gmail.DTO import DraftRequest, Attachment, DraftPayload, MessageIdsRequest, StarRequest, ReadRequest,  AutoReply, User
from app.gmail.draft_service import genAI_draft, gen_draft, update_draft, send_draft, delete_draft
from app.gmail.reply_service import create_reply_draft, forward_email, reply_to_email , update_reply_draft, send_email

router = APIRouter(
    prefix='/gmail',
    tags=['gmail']
)

@router.get('/card')
def cards(current_user= Depends(get_current_user)):
    user_id = current_user["user_id"]
    sections = [
    {
        "key": "inbox",
        "title": "Last received",
        "accent": "#4285F4",
        "items": get_5_emails(user_id, "in:inbox")
    },
    {
        "key": "sent",
        "title": "Last sent",
        "accent": "#7C3AED",
        "items": get_5_emails(user_id, "in:sent")
    },
    {
        "key": "drafts",
        "title": "Last drafts",
        "accent": "#F59E0B",
        "items": get_5_emails(user_id, "in:draft")
    },
    {
        "key": "inbox/",
        "title": "Last importants",
        "accent": "#0DB927",
        "items": get_5_emails(user_id, "is:important")
    }
]
    return sections


@router.get('/inbox')
def inbox(current_user= Depends(get_current_user)):
    messages = get_Inbox(user_id=current_user["user_id"], max_results=10)
    return messages


@router.get('/email/{email_id}')
def getMail(email_id: str, current_user = Depends(get_current_user)):
    Email = getEmail(user_id=current_user["user_id"], message_id=email_id)
    return Email


@router.get('/email/{email_id}/attachments/{attachment_id}')
def download_attachment(email_id: str, attachment_id: str, current_user=Depends(get_current_user)):
    from app.gmail.gmail_service import GmailService
    from app.database.database import SessionLocal
    from sqlalchemy import text
    import os

    db = SessionLocal()
    query = text("""
        SELECT refresh_token FROM gmail_accounts
        WHERE user_id = :user_id
    """)
    result = db.execute(query, {"user_id": current_user["user_id"]}).mappings().first()
    db.close()

    if not result:
        raise HTTPException(status_code=404, detail="No Gmail account connected")

    gmail = GmailService(
        refresh_token=result["refresh_token"],
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    )
    attachment = gmail.get_attachment(email_id, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    return Response(
        content=attachment["data"],
        media_type=attachment["mime_type"],
        headers={"Content-Disposition": f'attachment; filename="{attachment["filename"]}"'},
    )


@router.get('/sent')
def getSent(current_user = Depends(get_current_user)):
    Sents = get_Sent(user_id=current_user["user_id"])
    return Sents

@router.get('/draft')
def getDraft(current_user = Depends(get_current_user)):
    Drafts = get_Draft(user_id=current_user["user_id"])
    return Drafts

@router.post('/draft/create')
def createDraft(request: DraftRequest, current_user = Depends(get_current_user)):
    user_details = User(
    name=current_user["name"],
    email=current_user["email"]
    )
    if request.mode == "ai":
        draft = genAI_draft(request=request, user_id=current_user["user_id"], user_details=user_details)
    else:
        draft = gen_draft(request=request, user_id=current_user["user_id"])

    return draft


@router.patch('/draft/{message_id}')
async def updateDraft(message_id: str, request: Request, current_user = Depends(get_current_user)):
    form = await request.form()

    def parse_recipients(value: str):
        return [EmailRecipient(email=item.strip()) for item in (value or "").split(",") if item.strip()]

    attachments = []
    for file in form.getlist("attachments"):
        if not getattr(file, "filename", None):
            continue
        attachments.append(
            EmailAttachment(
                filename=file.filename,
                mime_type=file.content_type or "application/octet-stream",
                content=await file.read(),
            )
        )

    draft = DraftEmail(
        subject=(form.get("subject") or "Draft").strip() or "Draft",
        body=(form.get("body") or " ").strip() or " ",
        tone="professional",
        to=parse_recipients(form.get("to", "")),
        cc=parse_recipients(form.get("cc", "")),
        bcc=parse_recipients(form.get("bcc", "")),
        attachments=attachments,
    )

    return update_draft(message_id=message_id, draft=draft, user_id=current_user["user_id"])


@router.post('/draft/{message_id}/send')
def sendDraft(message_id: str, current_user = Depends(get_current_user)):
    return send_draft(message_id=message_id, user_id=current_user["user_id"])


@router.delete('/draft/{message_id}')
def deleteDraft(message_id: str, current_user = Depends(get_current_user)):
    return delete_draft(message_id=message_id, user_id=current_user["user_id"])

@router.post("/{message_id}/send_draft")
async def send_draft_route(
    message_id: str,
    subject: str = Form(""),
    body: str = Form(""),
    to: str = Form(""),
    cc: str = Form(""),
    bcc: str = Form(""),
    attachments: list[UploadFile] = File(default=[]),
    current_user = Depends(get_current_user)
):
    draft = DraftPayload(
        subject=subject,
        body=body,
        to=parse_recipients(to),
        cc=parse_recipients(cc),
        bcc=parse_recipients(bcc),
        attachments=[
            Attachment(filename=f.filename, content=await f.read(), mime_type=f.content_type)
            for f in attachments
        ],
    )

    result = draft_Sent(user_id=current_user["user_id"] ,message_id=message_id, draft=draft)
    return result


# ---------------------------------------------------------------------------
# ADDITIONS TO: your gmail router file (the one with `router = APIRouter(prefix='/gmail', ...)`)
#
# 1. Add these imports near your existing ones:
#      from app.chatbot.agent.objects import EmailRecipient, EmailAttachment
#      from app.gmail.reply_service import (
#          reply_to_email,
#          forward_email,
#          create_reply_draft,
#          update_reply_draft,
#      )
#
# 2. DELETE the existing stub at the bottom of your file:
#      @router.post('/email/{message_id}/reply')
#      def Reply():
#          pass
#
# 3. Add the four routes below in its place.
#
# Frontend contract these match (from ReplyBox.jsx):
#   POST  /gmail/email/{message_id}/reply          FormData: body, reply_all, attachments[]
#   POST  /gmail/email/{message_id}/forward         FormData: body, to[] (repeated), attachments[]
#   POST  /gmail/email/{message_id}/draft            FormData: mode, body, reply_all, to[], attachments[]
#   PATCH /gmail/email/{message_id}/draft/{draft_id} FormData: mode, body, reply_all, to[], attachments[]
#
# All four routes accept multipart/form-data, same as your existing
# /draft/{message_id} PATCH and /{message_id}/send_draft routes — so your
# frontend should send ALL of these as FormData (not JSON), even when
# there are no attachments. That keeps every draft/reply/forward endpoint
# on one consistent content type.
# ---------------------------------------------------------------------------


@router.post('/email/{message_id}/reply')
async def Reply(
    message_id: str,
    body: str = Form(...),
    reply_all: str = Form("false"),
    attachments: list[UploadFile] = File(default=[]),
    current_user=Depends(get_current_user),
):
    files = [
        EmailAttachment(
            filename=f.filename,
            mime_type=f.content_type or "application/octet-stream",
            content=await f.read(),
        )
        for f in attachments
        if getattr(f, "filename", None)
    ]

    return reply_to_email(
        message_id=message_id,
        user_id=current_user["user_id"],
        body=body,
        reply_all=reply_all.lower() == "true",
        attachments=files,
    )


@router.post('/email/{message_id}/forward')
async def Forward(
    message_id: str,
    to: list[str] = Form(...),
    body: str = Form(...),
    attachments: list[UploadFile] = File(default=[]),
    current_user=Depends(get_current_user),
):
    files = [
        EmailAttachment(
            filename=f.filename,
            mime_type=f.content_type or "application/octet-stream",
            content=await f.read(),
        )
        for f in attachments
        if getattr(f, "filename", None)
    ]
    recipients = [EmailRecipient(email=addr.strip()) for addr in to if addr and addr.strip()]

    return forward_email(
        message_id=message_id,
        user_id=current_user["user_id"],
        to=recipients,
        body=body,
        attachments=files,
    )


@router.post('/email/send')
async def SendEmail(
    subject: str = Form(...),
    body: str = Form(...),
    to: list[str] = Form(...),
    cc: list[str] = Form(default=[]),
    bcc: list[str] = Form(default=[]),
    attachments: list[UploadFile] = File(default=[]),
    current_user=Depends(get_current_user),
):
    files = [
        EmailAttachment(
            filename=f.filename,
            mime_type=f.content_type or "application/octet-stream",
            content=await f.read(),
        )
        for f in attachments
        if getattr(f, "filename", None)
    ]

    recipients = [EmailRecipient(email=addr.strip()) for addr in to if addr and addr.strip()]
    cc_recipients = [EmailRecipient(email=addr.strip()) for addr in cc if addr and addr.strip()]
    bcc_recipients = [EmailRecipient(email=addr.strip()) for addr in bcc if addr and addr.strip()]

    return send_email(
        user_id=current_user["user_id"],
        subject=subject,
        body=body,
        to=recipients,
        cc=cc_recipients,
        bcc=bcc_recipients,
        attachments=files,
    )


@router.post('/email/{message_id}/draft')
async def createReplyDraft(
    message_id: str,
    mode: str = Form(...),  # 'reply' | 'replyAll' | 'forward'
    body: str = Form(""),
    reply_all: str = Form("false"),
    to: list[str] = Form(default=[]),
    attachments: list[UploadFile] = File(default=[]),
    current_user=Depends(get_current_user),
):
    files = [
        EmailAttachment(
            filename=f.filename,
            mime_type=f.content_type or "application/octet-stream",
            content=await f.read(),
        )
        for f in attachments
        if getattr(f, "filename", None)
    ]
    recipients = [EmailRecipient(email=addr.strip()) for addr in to if addr and addr.strip()]

    return create_reply_draft(
        message_id=message_id,
        user_id=current_user["user_id"],
        mode=mode,
        body=body,
        reply_all=reply_all.lower() == "true",
        to=recipients,
        attachments=files,
    )

# ---------------------------------------------------------------------------
# REPLACES the earlier PATCH /email/{message_id}/draft/{draft_id} route.
#
# New route: PATCH /email/{message_id}/draft
#   -> `message_id` here is the DRAFT's own message id (the one returned
#      as "id" by POST /email/{message_id}/draft when the draft was
#      created). Only one id, as requested.
#
# The POST /email/{message_id}/draft route (create) is UNCHANGED — that one
# still needs the ORIGINAL email's message_id, since that's the one place
# we genuinely have to look up what's being replied to.
# ---------------------------------------------------------------------------

@router.patch('/email/{message_id}/draft')
async def updateReplyDraft(
    message_id: str,
    body: str = Form(""),
    to: list[str] = Form(default=[]),
    attachments: list[UploadFile] = File(default=[]),
    current_user=Depends(get_current_user),
):
    files = [
        EmailAttachment(
            filename=f.filename,
            mime_type=f.content_type or "application/octet-stream",
            content=await f.read(),
        )
        for f in attachments
        if getattr(f, "filename", None)
    ]

    # Only override recipients if the frontend actually sent some
    # (forward mode). For reply/reply-all, `to` is omitted and the
    # existing recipients on the draft are reused automatically.
    recipients = [EmailRecipient(email=addr.strip()) for addr in to if addr and addr.strip()]
    recipients = recipients or None

    return update_reply_draft(
        message_id=message_id,
        user_id=current_user["user_id"],
        body=body,
        to=recipients,
        attachments=files,
    )

# --- Request Schemas ---




# --- Email Item Endpoints ---

@router.post("/email/{id}/star")
async def toggle_star_endpoint(
    id: str,
    payload: StarRequest,
    current_user=Depends(get_current_user)
):
    """Toggle star state for a specific email."""
    result = manage_star_status(
        user_id=current_user["user_id"],
        message_id=id,
        star_status=payload.starred
    )
    return {"success": True, "starred": payload.starred, "details": result}


@router.post("/email/{id}/read")
async def toggle_read_endpoint(
    id: str,
    payload: ReadRequest,
    current_user=Depends(get_current_user)
):
    """Toggle unread/read state for a specific email."""
    result = read_status(
        user_id=current_user["user_id"],
        message_id=id,
    )
    return {"success": True, "unread": payload.unread, "details": result}


@router.post("/email/{id}/archive")
async def archive_email_endpoint(
    id: str,
    current_user=Depends(get_current_user)
):
    """Archive an email (remove from INBOX)."""
    result = archive(user_id=current_user["user_id"], message_id=id)
    return result


@router.post("/email/{id}/trash")
async def trash_email_endpoint(
    id: str,
    current_user=Depends(get_current_user)
):
    """Move a single email to Trash."""
    result = trashOne(
        user_id=current_user["user_id"],
        message_id=id
    )
    return result


@router.post("/email/{id}/untrash")
async def untrash_email_endpoint(
    id: str,
    current_user=Depends(get_current_user)
):
    """Restore a single email from Trash."""
    result = untrash(user_id=current_user["user_id"], message_id=id)
    return {"success": True, "message_id": id, "details": result}


@router.delete("/email/{id}")
async def delete_email_forever_endpoint(
    id: str,
    current_user=Depends(get_current_user)
):
    """Permanently delete a single email."""
    result = delete(
        user_id=current_user["user_id"],
        message_id=id
    )
    return result


@router.post("/email/{id}/spam")
async def mark_spam_endpoint(
    id: str,
    current_user=Depends(get_current_user)
):
    """Mark an email as spam."""
    result = markspam(user_id=current_user["user_id"], message_id=id)
    return {"success": True, "message_id": id, "details": result}


@router.post("/email/{id}/not-spam")
async def mark_not_spam_endpoint(
    id: str,
    current_user=Depends(get_current_user)
):
    """Mark an email as not spam (remove from SPAM folder)."""
    result = mark_not_spam(user_id=current_user["user_id"], message_id=id)
    return {"success": True, "message_id": id, "details": result}


# --- Bulk Operation Endpoints ---

@router.post("/messages/trash")
async def trash_messages(
    request: MessageIdsRequest,
    current_user=Depends(get_current_user),
):
    """Bulk trash multiple messages."""
    trash_status = trashBunch(current_user["user_id"], request=request)
    return trash_status


@router.post("/messages/delete")
async def delete_messages(
    request: MessageIdsRequest,
    current_user=Depends(get_current_user),
):
    """Bulk permanently delete multiple messages."""
    delete_status = deleteBunch(current_user["user_id"], request=request)
    return delete_status

@router.get('/account')
def account(current_user=Depends(get_current_user)):
    account = get_account(current_user["user_id"])
    return account

@router.patch('/account/auto-reply')
def account(reply:AutoReply, current_user=Depends(get_current_user)):
    auto_reply = toggle_auto_reply(user_id=current_user["user_id"], auto_reply_status= reply.auto_reply)
    return auto_reply
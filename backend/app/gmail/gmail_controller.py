from fastapi import APIRouter, Depends, Request , HTTPException, Form, File, UploadFile
from app.auth.auth_service import googleLogin
from app.gmail.DTO import parse_recipients
from app.auth.DTO import GoogleLoginRequest
from app.auth.jwt.service import get_current_user
from app.chatbot.agent.objects import DraftEmail, EmailAttachment, EmailRecipient
from app.gmail.gmail import get_5_emails, getEmail
from app.gmail.inbox_service import get_Inbox
from app.gmail.sent_service import get_Sent, draft_Sent
from app.gmail.draft_service import get_Draft
from app.gmail.DTO import DraftRequest, Attachment, DraftPayload
from app.gmail.draft_service import genAI_draft, gen_draft, update_draft, send_draft, delete_draft


router = APIRouter(
    prefix='/gmail',
    tags=['gmail']
)

@router.get('/card')
def cards(current_user= Depends(get_current_user)):
    user_id = current_user["user_id"]
    sections = [
    {
        "key": "received",
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
        "key": "important",
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
    if request.mode == "ai":
        draft = genAI_draft(request=request, user_id=current_user["user_id"])
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


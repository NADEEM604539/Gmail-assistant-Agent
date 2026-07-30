from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.auto_reply.reply import autoReply

scheduler = AsyncIOScheduler()

def start_scheduler():
    scheduler.add_job(
        autoReply,
        trigger="interval",
        seconds=10,
        id="gmail_auto_reply",
        replace_existing=True,
    )

    scheduler.start()

def stop_schedular():
    scheduler.shutdown()
from apscheduler.schedulers.background import BackgroundScheduler
from app.auto_reply.reply import autoReply

scheduler = BackgroundScheduler()


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(
        autoReply,
        trigger="interval",
        minutes=10,
        id="gmail_auto_reply",
        replace_existing=True,
    )

    scheduler.start()


def stop_schedular():
    if scheduler.running:
        scheduler.shutdown()

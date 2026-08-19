from celery import Celery
from app.core.config import settings

# 配置 Celery
celery_app = Celery(
    "tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        'app.schedule.celery_job',  # 主注册模块
        'app.schedule.jobs.demo',   # 示例任务
        'app.schedule.jobs.email_tasks'  # 邮件任务
    ]
)

# 演示任务默认关闭，避免无业务价值的每分钟数据库和日志开销。
celery_app.conf.beat_schedule = {}
if settings.CELERY_DEMO_TASKS_ENABLED:
    celery_app.conf.beat_schedule['demo-every-minute'] = {
        'task': 'app.schedule.jobs.demo.execute',
        'schedule': 60.0,
        'options': {'queue': 'scheduled_tasks'}
    }

celery_app.conf.timezone = 'UTC'
celery_app.conf.task_queues = {
    'scheduled_tasks': {
        'exchange': 'scheduled_tasks',
        'routing_key': 'scheduled_tasks',
    },
    'celery': {  # 默认队列
        'exchange': 'celery',
        'routing_key': 'celery',
    }
}

# Optional: Configure other Celery settings
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    task_track_started=True,
    worker_concurrency=settings.CELERY_WORKER_CONCURRENCY,
    task_time_limit=30 * 60,  # 30 minutes time limit
    task_soft_time_limit=15 * 60,  # 15 minutes soft time limit
)

from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.services.llm import get_groq_limits


def _window_stats(db: Session, current_user: models.User, window_start: datetime, limit_requests: int, limit_tokens: int, window_name: str) -> dict:
    used_requests, used_tokens = db.query(
        func.count(models.TokenUsage.id),
        func.coalesce(func.sum(models.TokenUsage.total_tokens), 0),
    ).filter(
        models.TokenUsage.created_at >= window_start
    ).one()

    user_used_requests, user_used_tokens = db.query(
        func.count(models.TokenUsage.id),
        func.coalesce(func.sum(models.TokenUsage.total_tokens), 0),
    ).filter(
        models.TokenUsage.user_id == current_user.id,
        models.TokenUsage.created_at >= window_start,
    ).one()

    registered_users = db.query(func.count(models.User.id)).scalar() or 0
    registered_users = max(registered_users, 1)

    active_users = db.query(func.count(func.distinct(models.TokenUsage.user_id))).filter(
        models.TokenUsage.created_at >= window_start
    ).scalar() or 0
    active_users = max(active_users, 1)

    remaining_requests_global = max(limit_requests - int(used_requests or 0), 0)
    remaining_tokens_global = max(limit_tokens - int(used_tokens or 0), 0)

    per_user_requests_allocated = remaining_requests_global // registered_users
    per_user_tokens_allocated = remaining_tokens_global // registered_users

    user_available_requests = max(per_user_requests_allocated - int(user_used_requests or 0), 0)
    user_available_tokens = max(per_user_tokens_allocated - int(user_used_tokens or 0), 0)

    return {
        "window": window_name,
        "limit_requests": limit_requests,
        "limit_tokens": limit_tokens,
        "used_requests": int(used_requests or 0),
        "used_tokens": int(used_tokens or 0),
        "remaining_requests_global": remaining_requests_global,
        "remaining_tokens_global": remaining_tokens_global,
        "registered_users": registered_users,
        "active_users": active_users,
        "per_user_requests_allocated": per_user_requests_allocated,
        "per_user_tokens_allocated": per_user_tokens_allocated,
        "user_used_requests": int(user_used_requests or 0),
        "user_used_tokens": int(user_used_tokens or 0),
        "user_available_requests": user_available_requests,
        "user_available_tokens": user_available_tokens,
    }


def get_user_quota(db: Session, current_user: models.User) -> dict:
    limits = get_groq_limits()
    now = datetime.utcnow()

    return {
        "model": "llama-3.3-70b-versatile",
        "minute": _window_stats(
            db=db,
            current_user=current_user,
            window_start=now - timedelta(minutes=1),
            limit_requests=limits["requests_per_minute"],
            limit_tokens=limits["tokens_per_minute"],
            window_name="minute",
        ),
        "day": _window_stats(
            db=db,
            current_user=current_user,
            window_start=now - timedelta(days=1),
            limit_requests=limits["requests_per_day"],
            limit_tokens=limits["tokens_per_day"],
            window_name="day",
        ),
    }
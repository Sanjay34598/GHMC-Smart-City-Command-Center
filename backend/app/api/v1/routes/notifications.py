from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationResponse

router = APIRouter(prefix="/notifications")

@router.get("", response_model=List[NotificationResponse], summary="Get all notifications")
def get_notifications(db: Session = Depends(get_db)):
    """Fetch all notifications, ordered by newest first."""
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(100).all()

@router.patch("/{id}/read", response_model=NotificationResponse, summary="Mark notification as read")
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    notification = db.get(Notification, id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.patch("/read-all", summary="Mark all notifications as read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}

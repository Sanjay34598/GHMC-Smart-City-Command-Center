import asyncio
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.core.websocket import manager
from app.modules.incidents.models import Incident
from app.modules.notifications.models import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    """Handles notification persistence and WebSocket broadcasting."""
    
    def __init__(self, db: Session):
        self.db = db

    def trigger_event(
        self, 
        incident: Incident, 
        event_type: str, 
        title: str, 
        message: str
    ) -> Notification:
        """Create a notification in the DB and broadcast it via WebSocket."""
        # 1. Save to database
        notification = Notification(
            incident_id=incident.id,
            title=title,
            message=message,
            severity=incident.severity,
            type=event_type,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        # 2. Build payload for broadcast
        payload = {
            "id": notification.id,
            "incident_id": notification.incident_id,
            "title": notification.title,
            "message": notification.message,
            "severity": notification.severity,
            "type": notification.type,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat() if notification.created_at else __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
        }
        
        # 3. Fire-and-forget the broadcast (we're in synchronous SQLAlchemy land here, 
        # so we schedule the async broadcast on the running event loop)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(payload))
        except RuntimeError:
            # If no running event loop, this is likely a test context or synchronous script
            logger.warning("No running event loop found; skipping WebSocket broadcast.")
            
        return notification

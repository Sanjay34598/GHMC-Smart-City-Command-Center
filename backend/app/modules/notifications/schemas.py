from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class NotificationResponse(BaseModel):
    """Schema for returning a Notification to the client."""

    id: str
    incident_id: str
    title: str
    message: str
    severity: str
    type: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

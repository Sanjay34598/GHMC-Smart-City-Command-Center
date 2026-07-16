import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.websocket import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws")

@router.websocket("/incidents")
async def websocket_incidents(websocket: WebSocket):
    """WebSocket endpoint for real-time incident notifications."""
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect the client to send anything, but we need to receive 
            # to keep the connection alive and detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

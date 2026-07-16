import logging
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections and broadcasting."""
    
    def __init__(self):
        # We store connections in a set for easy iteration/removal
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.debug(f"Client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.debug(f"Client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a JSON message to all connected clients."""
        dead_connections = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to client: {e}")
                dead_connections.add(connection)
                
        # Clean up any connections that failed during broadcast
        for dead_conn in dead_connections:
            self.disconnect(dead_conn)

# Global connection manager instance
manager = ConnectionManager()

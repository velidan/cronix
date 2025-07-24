from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.price_subscribers: Dict[str, List[str]] = {}  # symbol -> list of client_ids

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            # Remove from all price subscriptions
            for symbol in self.price_subscribers:
                if client_id in self.price_subscribers[symbol]:
                    self.price_subscribers[symbol].remove(client_id)
        print(f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                print(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast(self, message: str):
        disconnected_clients = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)

    async def subscribe_to_prices(self, client_id: str, symbol: str):
        if symbol not in self.price_subscribers:
            self.price_subscribers[symbol] = []
        if client_id not in self.price_subscribers[symbol]:
            self.price_subscribers[symbol].append(client_id)
            await self.send_personal_message(
                json.dumps({"type": "subscription", "symbol": symbol, "status": "subscribed"}),
                client_id
            )

    async def unsubscribe_from_prices(self, client_id: str, symbol: str):
        if symbol in self.price_subscribers and client_id in self.price_subscribers[symbol]:
            self.price_subscribers[symbol].remove(client_id)
            await self.send_personal_message(
                json.dumps({"type": "subscription", "symbol": symbol, "status": "unsubscribed"}),
                client_id
            )

    async def broadcast_price_update(self, symbol: str, price_data: dict):
        if symbol in self.price_subscribers:
            message = json.dumps({
                "type": "price_update",
                "symbol": symbol,
                "data": price_data
            })
            disconnected_clients = []
            for client_id in self.price_subscribers[symbol]:
                if client_id in self.active_connections:
                    try:
                        await self.active_connections[client_id].send_text(message)
                    except Exception as e:
                        print(f"Error sending price update to {client_id}: {e}")
                        disconnected_clients.append(client_id)
            
            # Clean up disconnected clients
            for client_id in disconnected_clients:
                self.disconnect(client_id)
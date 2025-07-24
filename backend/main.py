from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.api import auth, trading, admin, bracket_orders
from app.services.websocket_manager import WebSocketManager

app = FastAPI(
    title="Cronix Trading Terminal API",
    description="FastAPI backend for Cronix trading terminal with KuCoin integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager
websocket_manager = WebSocketManager()

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(trading.router, prefix="/api/trading", tags=["trading"])
app.include_router(bracket_orders.router, prefix="/api/bracket-orders", tags=["bracket-orders"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "Cronix Trading Terminal API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cronix-api"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.send_personal_message(f"Message received: {data}", client_id)
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
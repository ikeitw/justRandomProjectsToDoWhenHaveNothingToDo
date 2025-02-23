import asyncio
import websockets
import json

clients = {}  # Room-based clients {room_id: [sockets]}

async def handler(websocket, path):
    room_id = await websocket.recv()  # First message should be room ID
    if room_id not in clients:
        clients[room_id] = []
    clients[room_id].append(websocket)

    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"📡 Received WebSocket Message: {data}")

            # Broadcast to all users in the room
            for client in clients[room_id]:
                if client != websocket:
                    await client.send(json.dumps(data))

    except websockets.ConnectionClosed:
        clients[room_id].remove(websocket)
        if not clients[room_id]:  # Remove empty rooms
            del clients[room_id]

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()

asyncio.run(main())

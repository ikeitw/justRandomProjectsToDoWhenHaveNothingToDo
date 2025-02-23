import logging
import asyncio
import requests
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
import websockets
import json
import yt_dlp

TOKEN = "7929366332:AAHISkZWVAiKRPQ5zZ9rcaXXbfufiFRJevU"
YOUTUBE_API_KEY = "AIzaSyD-MZFipFnt3DOQyCJ1QQVPZaTNxMLl08U"
WEB_APP_URL = "https://your-ngrok-url.ngrok.io"  # Change this to your hosted Web App URL
WEB_SOCKET_URL = "ws://localhost:8765"

bot = Bot(token=TOKEN)
dp = Dispatcher()

rooms = {}


async def send_to_websocket(room_id, action, track_url=None):
    """Sends a control command to the WebSocket server to sync playback."""
    async with websockets.connect(WEB_SOCKET_URL) as ws:
        await ws.send(json.dumps({"room_id": room_id, "action": action, "track": track_url}))


def search_youtube(query):
    """Search YouTube for a track and return its video URL."""
    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={query}&key={YOUTUBE_API_KEY}"
    response = requests.get(url).json()

    if "items" in response and response["items"]:
        video_id = response["items"][0]["id"]["videoId"]
        return f"https://www.youtube.com/watch?v={video_id}"
    return None


def get_audio_url(youtube_url):
    """Extracts an audio streaming URL from a YouTube video."""
    ydl_opts = {
        'format': 'bestaudio',
        'quiet': True,
        'extract_audio': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=False)
        return info['url']


@dp.message(Command("start"))
async def start(message: types.Message):
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    web_app = types.WebAppInfo(url=WEB_APP_URL)
    keyboard.add(types.KeyboardButton("🎵 Open Music Player", web_app=web_app))
    await message.answer("Welcome! Tap below to open the Music Player 🎶", reply_markup=keyboard)


@dp.message(Command("play"))
async def play_track(message: types.Message):
    room_id = str(message.chat.id)
    query = message.text.replace("/play", "").strip()

    if room_id not in rooms:
        await message.answer("You need to create or join a room first.")
        return

    youtube_url = search_youtube(query)
    if youtube_url:
        audio_url = get_audio_url(youtube_url)
        if audio_url:
            await send_to_websocket(room_id, "play", audio_url)
            await message.answer(f"🎵 Playing: {query}")
        else:
            await message.answer("❌ Could not extract audio.")
    else:
        await message.answer("❌ No tracks found on YouTube.")


async def main():
    logging.basicConfig(level=logging.INFO)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import websockets
import json
import random

groups = {}  # Stores {group_id: {word, guessed_letters, attempts, players}}
WORDS = ["python", "telegram", "hangman", "developer", "aiogram"]
MAX_ATTEMPTS = 6


async def handler(websocket):
    try:
        print("🔌 New WebSocket Connection Attempt...")

        # Expect the first message to be JSON (group ID + player name + create flag)
        message = await websocket.recv()
        data = json.loads(message)

        group_id = data.get("group_id")
        player_name = data.get("player_name")
        create_group = data.get("create_group", False)  # New flag for group creation

        if not group_id or not player_name:
            await websocket.send(json.dumps({"action": "error", "message": "Invalid group ID or player name"}))
            return

        # If group does not exist and the player is not creating a group, reject the request
        if group_id not in groups and not create_group:
            await websocket.send(json.dumps({"action": "error", "message": "Group does not exist"}))
            return

        # If group does not exist and player is creating it, initialize it
        if group_id not in groups:
            groups[group_id] = {
                "word": "",
                "guessed_letters": set(),
                "attempts": 0,
                "players": []
            }

        # Add player to the group
        groups[group_id]["players"].append({"name": player_name, "socket": websocket})

        # Broadcast updated player list
        await broadcast(group_id, {
            "action": "update_players",
            "players": [player["name"] for player in groups[group_id]["players"]]
        })

        async for message in websocket:
            print(f"📩 Received Message: {message}")  # Debugging
            try:
                data = json.loads(message)
                print(f"📡 Parsed JSON: {data}")

                if data["action"] == "new_game":
                    selected_word = random.choice(WORDS).lower()
                    groups[group_id]["word"] = selected_word
                    groups[group_id]["guessed_letters"] = set()
                    groups[group_id]["attempts"] = 0
                    print(f"🎯 New Game Started! Word: {selected_word}")
                    await broadcast(group_id, {
                        "action": "new_game",
                        "word": "_" * len(selected_word),
                        "players": [player["name"] for player in groups[group_id]["players"]]
                    })

                elif data["action"] == "guess":
                    letter = data["letter"].lower()
                    game = groups[group_id]

                    if letter not in game["guessed_letters"]:
                        game["guessed_letters"].add(letter)
                        word_lower = game["word"].lower()
                        if letter not in word_lower:
                            game["attempts"] += 1  # Increase attempts only if the letter is wrong

                        # Update displayed word
                        display_word = " ".join(
                            [l if l.lower() in game["guessed_letters"] else "_" for l in game["word"]]
                        )
                        game_over = "_" not in display_word or game["attempts"] >= MAX_ATTEMPTS

                        print(
                            f"📝 Word: {game['word']} | Guessed: {game['guessed_letters']} | Display: {display_word} | Attempts: {game['attempts']}"
                        )

                        await broadcast(group_id, {
                            "action": "guess",
                            "guessedLetters": list(game["guessed_letters"]),
                            "attemptsLeft": MAX_ATTEMPTS - game["attempts"],
                            "word": display_word
                        })

                        if game_over:
                            await broadcast(group_id, {"action": "game_over", "word": game["word"]})
                            del groups[group_id]

            except json.JSONDecodeError:
                print("❌ Error: Received invalid JSON data")
                continue

    except websockets.exceptions.ConnectionClosedError:
        print("❌ WebSocket Connection Closed Unexpectedly")
    except Exception as e:
        print(f"⚠️ Unexpected Error: {e}")
    finally:
        if group_id in groups:
            groups[group_id]["players"] = [
                player for player in groups[group_id]["players"] if player["socket"] != websocket
            ]
            if not groups[group_id]["players"]:
                del groups[group_id]
            else:
                await broadcast(group_id, {
                    "action": "update_players",
                    "players": [player["name"] for player in groups[group_id]["players"]]
                })


async def broadcast(group_id, message):
    if group_id in groups:
        for player in groups[group_id]["players"]:
            await player["socket"].send(json.dumps(message))


async def main():
    print("🚀 Starting WebSocket Server on ws://0.0.0.0:8765")
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()


asyncio.run(main())

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler, CallbackQueryHandler
import json
import os

ADMIN_ID = {713268201, 375740447}
DATA_FILE = "data.json"

def load_profiles():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf8") as f:
                content = f.read().strip()
                return json.loads(content) if content else {}
        except json.JSONDecodeError:
            print("⚠️ Ошибка, данные в файле с заказами записаны не корректно.")
    return {}

def save_profiles(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

message_link = {}
user_profiles = load_profiles()
user_data = {}
ASK_NAME, ASK_PHONE, ASK_ITEM = range(3)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Добро пожаловать в наш магазин!\n\n"
        "🛍️ Посмотрите наш каталог по данной ссылке: https://drive.google.com/file/d/17YEo1hCyGG5z9RT3O0-8TvpbiZbs3ZSL/view\n\n"
        "Давайте начнем с вашего имени. Пожалуйста, введите его:",
        parse_mode='Markdown'
    )
    return ASK_NAME

async def ask_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    user_data[user_id] = {"name": update.message.text}
    await update.message.reply_text("📱 Пожалуйста введите ваш номер телефона:", parse_mode='Markdown')
    return ASK_PHONE

async def ask_item(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    user_data[user_id]["phone"] = update.message.text
    await update.message.reply_text("🛍️ Теперь введите номер/название товара который вы бы хотели приобрести:", parse_mode='Markdown')
    return ASK_ITEM

async def finalize_request(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.message.from_user.id
    uid = str(user_id)
    data = user_data.get(user_id, {})
    item_code = update.message.text
    data["item"] = item_code
    if uid in user_profiles:
        user_profiles[uid]["orders"].append({"item": item_code})
    else:
        user_profiles[uid] = {
            "name": data["name"],
            "phone": data["phone"],
            "orders": [{"item": item_code}]
        }
    save_profiles(user_profiles)
    await update.message.reply_text(
        "✅ Мы проверим, доступен ли этот товар для покупки. Вы услышите от нас в ближайшее время!"
    )
    name = user_profiles[uid]["name"]
    phone = user_profiles[uid]["phone"]
    message = (
        f"🆕 Новый заказ от [{name}](tg://user?id={user_id})\n"
        f"🆔 ID пользователя: `{user_id}`\n"
        f"📱 Телефон: {phone}\n"
        f"🛍️ Вещь: {item_code}\n\n"
        "Ответьте на данное сообщение, чтобы связаться с клиентом."
    )
    sent = await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=message,
        parse_mode='Markdown'
    )
    message_link[sent.message_id] = user_id
    return ConversationHandler.END

async def handle_replies(update: Update, context: ContextTypes.DEFAULT_TYPE):
    from_id = update.message.from_user.id
    message = update.message
    if from_id == ADMIN_ID and "admin_action" in context.user_data:
        action = context.user_data.pop("admin_action")
        arg = message.text.strip()
        if action == "delete":
            if arg in user_profiles:
                user_profiles.pop(arg)
                save_profiles(user_profiles)
                await message.reply_text(f"🗑️ Заказы пользователя `{arg}` удалены.", parse_mode='Markdown')
            else:
                await message.reply_text("❌ Пользователь не найден.")
        elif action == "contact_get_id":
                context.user_data["contact_user_id"] = arg
                context.user_data["admin_action"] = "contact_write_msg"
                await message.reply_text("✏️ Введите сообщение, которое нужно отправить пользователю:")
        elif action == "contact_write_msg":
            target_id = context.user_data.pop("contact_user_id", None)
            if not target_id:
                await message.reply_text("❌ Не найден ID пользователя. Попробуйте снова.")
                return
            try:
                await context.bot.send_message(chat_id=int(target_id), text=f"📩 Сообщение от администратора:\n{arg}")
                await message.reply_text("✅ Сообщение отправлено.")
            except Exception as e:
                await message.reply_text(f"❌ Ошибка при отправке сообщения: {e}")
        elif action == "search":
            term = arg.lower()
            found = False
            for uid, data in user_profiles.items():
                name = data.get("name", "")
                phone = data.get("phone", "")
                matches = (
                    term in phone.lower() or
                    any(term in order["item"].lower() for order in data.get("orders", []))
                )
                if matches:
                    found = True
                    summary = (
                            f"👤 [{name}](tg://user?id={uid})\n"
                            f"🆔 ID пользователя: `{uid}`\n"
                            f"📱 Телефон: `{phone}`\n"
                            f"🛍️ Заказы: " + ", ".join(order["item"] for order in data["orders"])
                    )
                    await message.reply_text(summary, parse_mode='Markdown')
            if not found:
                await message.reply_text("🔍 Ничего не найдено.")
        return
    if from_id == ADMIN_ID and message.reply_to_message:
        original_msg_id = message.reply_to_message.message_id
        target_user_id = message_link.get(original_msg_id)
        if target_user_id:
            await context.bot.send_message(chat_id=target_user_id, text=message.text)
        else:
            await message.reply_text("❌ Невозможно найти пользователя для ответа на это сообщение.")
        return
    if from_id != ADMIN_ID:
        uid = str(from_id)
        profile = user_profiles.get(uid)
        if profile:
            await context.bot.send_message(
                chat_id=ADMIN_ID,
                text=(
                    f"📩 Сообщение от [{profile['name']}](tg://user?id={from_id})\n"
                    f"🆔 ID пользователя: `{from_id}`\n"
                    f"💬 {message.text}"
                ),
                parse_mode='Markdown'
            )
        else:
            await message.reply_text("❗ Мы не можем найти ваш профиль. Пожалуйста, начните с /start.")

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Отменено.")
    return ConversationHandler.END

async def summary(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.id != ADMIN_ID:
        await update.effective_message.reply_text("⛔ Вам не разрешено просматривать сводку.")
        return
    if not user_profiles:
        await update.effective_message.reply_text("📭 Нет заказов.")
        return
    summary_lines = ["🧾 *Сводка заказов:*\n"]
    for uid, data in user_profiles.items():
        summary_lines.append(f"👤 [{data['name']}](tg://user?id={uid})")
        summary_lines.append(f"🆔 ID пользователя: `{uid}`")
        summary_lines.append(f"📱 Телефон: `{data['phone']}`")
        summary_lines.append("🛍️ *Заказы:*")
        for order in data.get("orders", []):
            summary_lines.append(f"- {order['item']}")
        summary_lines.append("")
    await update.effective_message.reply_text("\n".join(summary_lines), parse_mode='Markdown')

async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.from_user.id != ADMIN_ID:
        await update.message.reply_text("⛔ Вам не разрешено использовать эту команду.")
        return
    keyboard = [
        [InlineKeyboardButton("📦 Все заказы", callback_data='view_orders')],
        [InlineKeyboardButton("📲 Связаться с пользователем", callback_data='contact_user')],
        [InlineKeyboardButton("🗑️ Удалить заказ", callback_data='delete_order')],
        [InlineKeyboardButton("🔍 Поиск по номеру/товару", callback_data='search_orders')],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("🛠️ Панель администратора:", reply_markup=reply_markup)

async def admin_callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.from_user.id != ADMIN_ID:
        await query.edit_message_text("⛔ Вам не разрешено использовать эту команду.")
        return
    if query.data == "view_orders":
        await summary(update, context)
    elif query.data == "contact_user":
        await query.edit_message_text("📲 Введите ID пользователя, которому хотите написать:")
        context.user_data["admin_action"] = "contact_get_id"
    elif query.data == "delete_order":
        await query.edit_message_text("🗑️ Введите ID пользователя, у которого вы хотите удалить заказы:")
        context.user_data["admin_action"] = "delete"
    elif query.data == "search_orders":
        await query.edit_message_text("🔍 Введите номер телефона или код товара для поиска:")
        context.user_data["admin_action"] = "search"

if __name__ == '__main__':
    app = ApplicationBuilder().token("8142749866:AAGN21O1d9ktYKgZsDayGBrJdC7JcHvPdNk").build()
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            ASK_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_phone)],
            ASK_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ask_item)],
            ASK_ITEM: [MessageHandler(filters.TEXT & ~filters.COMMAND, finalize_request)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
    app.add_handler(conv_handler)
    app.add_handler(CommandHandler("summary", summary))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_replies))
    app.add_handler(CommandHandler("admin", admin_panel))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_replies))
    app.add_handler(CallbackQueryHandler(admin_callbacks))
    app.run_polling()
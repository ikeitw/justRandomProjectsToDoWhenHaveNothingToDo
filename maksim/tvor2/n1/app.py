from flask import Flask, render_template
from datetime import datetime

app = Flask(__name__)
@app.route('/')
def greet():
    hour = datetime.now().hour
    if 6 <= hour < 12:
        greeting = "Доброе утро"
    elif 12 <= hour < 18:
        greeting = "Добрый день"
    elif 18 <= hour < 24:
        greeting = "Добрый вечер"
    else:
        greeting = "Доброй ночи"
    return render_template("index.html", greeting=greeting)
if __name__ == '__main__':
    app.run(debug=True)

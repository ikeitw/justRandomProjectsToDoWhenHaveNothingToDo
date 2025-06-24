from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def todo():
    tasks = ["Сделать лабораторные", "Выгулять собаку", "Прочитать книгу", "Позвонить бабушке"]
    return render_template("index.html", tasks=tasks)

if __name__ == '__main__':
    app.run(debug=True)

from tkinter import *
from tkinter import messagebox

def calculate():
    try:
        a = float(entry.get())
        volume = a ** 3
        surface_area = 6 * (a ** 2)
        result = f"Введено a = {a}\nОбъем куба V = {volume:.2f}\nПлощадь поверхности S = {surface_area:.2f}"
        messagebox.showinfo("Результат", result)
        with open("результат.txt", "w", encoding='utf-8') as file:
            file.write(result)
    except ValueError:
        messagebox.showerror("Ошибка", "Введите корректное число!")
window = Tk()
window.title("Куб — Расчёт и сохранение")
window.geometry('500x500')
label = Label(window, text="Введите длину ребра куба (a):", font=("Arial", 12))
label.pack(pady=10)
entry = Entry(window, width=20)
entry.pack()
btn = Button(window, text="Вычислить и сохранить", command=calculate)
btn.pack(pady=20)
window.mainloop()

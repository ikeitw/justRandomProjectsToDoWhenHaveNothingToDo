from tkinter import *
from tkinter import messagebox

def calculate():
    try:
        a = float(entry.get())
        volume = a ** 3
        surface_area = 6 * (a ** 2)
        result = f"Объем куба V = {volume:.2f}\nПлощадь поверхности S = {surface_area:.2f}"
        messagebox.showinfo("Результат", result)
    except ValueError:
        messagebox.showerror("Ошибка", "Введите корректное число!")
window = Tk()
window.title("Куб: объем и площадь")
window.geometry('500x500')
label = Label(window, text="Введите длину ребра куба (a):", font=("Arial", 12))
label.pack(pady=10)
entry = Entry(window, width=15)
entry.pack()
btn = Button(window, text="Вычислить", command=calculate)
btn.pack(pady=10)
window.mainloop()

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

def exit_app():
    window.quit()
window = Tk()
window.title("Вариант 5")
window.geometry('500x500')
main_menu = Menu(window)
window.config(menu=main_menu)
menu_file = Menu(main_menu, tearoff=0)
main_menu.add_cascade(label="Файл", menu=menu_file)
menu_file.add_command(label="Вычислить", command=calculate)
menu_file.add_separator()
menu_file.add_command(label="Выход", command=exit_app)
label = Label(window, text="Скоро лето!!!", font=("Arial", 16))
label.pack(pady=10)
chk1_state = BooleanVar()
chk2_state = BooleanVar()
chk3_state = BooleanVar()
chk1 = Checkbutton(window, text="Флажок 1", variable=chk1_state)
chk2 = Checkbutton(window, text="Флажок 2", variable=chk2_state)
chk3 = Checkbutton(window, text="Флажок 3", variable=chk3_state)
chk1.pack(anchor='w', padx=20)
chk2.pack(anchor='w', padx=20)
chk3.pack(anchor='w', padx=20)
selected = IntVar()
rad1 = Radiobutton(window, text="Радио 1", value=1, variable=selected)
rad2 = Radiobutton(window, text="Радио 2", value=2, variable=selected)
rad3 = Radiobutton(window, text="Радио 3", value=3, variable=selected)
rad1.pack(anchor='w', padx=20, pady=(10, 0))
rad2.pack(anchor='w', padx=20)
rad3.pack(anchor='w', padx=20)
entry_label = Label(window, text="Введите длину ребра куба (a):")
entry_label.pack(pady=(20, 0))
entry = Entry(window, width=15)
entry.pack()
btn_calc = Button(window, text="Вычислить", command=calculate)
btn_calc.pack(pady=10)
window.mainloop()

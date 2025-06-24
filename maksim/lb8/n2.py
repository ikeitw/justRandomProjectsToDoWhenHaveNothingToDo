from tkinter import *
from tkinter import Menu, PhotoImage

def show_name():
    name_label.config(text="Кислицин Максим")
def hide_name():
    name_label.config(text="")
window = Tk()
window.title("Вариант 5")
window.geometry('500x500')
name_label = Label(window, text="", font=("Arial", 14), fg="blue")
name_label.pack(pady=20)
main_menu = Menu(window)
window.config(menu=main_menu)
icon_show = PhotoImage(width=16, height=16)
icon_hide = PhotoImage(width=16, height=16)
menu_lvl1 = Menu(main_menu, tearoff=0)
main_menu.add_cascade(label="Меню 1", menu=menu_lvl1)
for i in range(1, 6):
    submenu = Menu(menu_lvl1, tearoff=0)
    menu_lvl1.add_cascade(label=f"Опция {i}", menu=submenu)
    for j in range(1, 3):
        submenu_lvl2 = Menu(submenu, tearoff=0)
        submenu.add_cascade(label=f"Подопция {i}.{j}", menu=submenu_lvl2)
        for k in range(1, 3):
            submenu_lvl3 = Menu(submenu_lvl2, tearoff=0)
            submenu_lvl2.add_cascade(label=f"Подподопция {i}.{j}.{k}", menu=submenu_lvl3)
            submenu_lvl3.add_command(label="Показать фамилию", image=icon_show, compound='left', command=show_name)
            submenu_lvl3.add_command(label="Скрыть фамилию", image=icon_hide, compound='left', command=hide_name)
extra_menu = Menu(main_menu, tearoff=0)
main_menu.add_cascade(label="Дополнительно", menu=extra_menu)
for x in range(6, 11):
    extra_menu.add_command(label=f"Простая опция {x}")
window.mainloop()

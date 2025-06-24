from tkinter import *
from tkinter import filedialog, messagebox

def check_file():
    file_path = filedialog.askopenfilename(filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
    if not file_path:
        return
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            numeric_lines = [line.strip() for line in lines if line.strip().isdigit()]
            if numeric_lines:
                result = "Найдены строки, состоящие только из цифр:\n" + "\n".join(numeric_lines)
                messagebox.showinfo("Результат", result)
            else:
                messagebox.showinfo("Результат", "В файле нет строк, состоящих только из цифр.")
    except Exception as e:
        messagebox.showerror("Ошибка", f"Не удалось прочитать файл:\n{e}")
window = Tk()
window.title("Вариант 5")
window.geometry('500x500')
btn = Button(window, text="Выбрать файл и проверить", command=check_file, font=("Arial", 12))
btn.pack(pady=50)
window.mainloop()

from models import *
from sqlalchemy.orm import Session
from datetime import date

# 1) Список групп по каждой горе (хронологически)
def list_groups_per_mountain(session: Session):
    mountains = session.query(Mountain).all()
    for m in mountains:
        print(f"Гора: {m.name} ({m.height} м, {m.country}, {m.region})")
        ascents = session.query(Ascent).filter_by(mountain_id=m.id).order_by(Ascent.start_date).all()
        for a in ascents:
            print(f"  Группа: {a.group.name}, С {a.start_date} по {a.end_date}")

# 2) Добавление новой вершины
def add_new_mountain(session: Session, name, height, country, region):
    mountain = Mountain(name=name, height=height, country=country, region=region)
    session.add(mountain)
    session.commit()
    print("Вершина добавлена.")

# 3) Изменение данных о вершине (если нет восхождений)
def update_mountain(session: Session, mountain_id, new_name, new_height, new_country, new_region):
    mountain = session.query(Mountain).filter_by(id=mountain_id).first()
    if not mountain:
        print("Вершина не найдена.")
        return
    if mountain.ascents:
        print("Нельзя изменить вершину — есть восхождения.")
        return
    mountain.name = new_name
    mountain.height = new_height
    mountain.country = new_country
    mountain.region = new_region
    session.commit()
    print("Данные о вершине обновлены.")

# 4) Список альпинистов по интервалу дат
def list_alpinists_by_date(session: Session, start_date: date, end_date: date):
    ascents = session.query(Ascent).filter(Ascent.start_date >= start_date, Ascent.end_date <= end_date).all()
    alpinists = set()
    for ascent in ascents:
        for member in ascent.group.members:
            alpinists.add(member.alpinist)
    for a in alpinists:
        print(f"Альпинист: {a.name}, Адрес: {a.address}")

# 5) Добавление альпиниста в группу
def add_alpinist_to_group(session: Session, group_id, name, address):
    alpinist = Alpinist(name=name, address=address)
    session.add(alpinist)
    session.commit()
    membership = GroupMember(group_id=group_id, alpinist_id=alpinist.id)
    session.add(membership)
    session.commit()
    print("Альпинист добавлен в группу.")

# 6) Количество восхождений каждого альпиниста на каждую гору
def alpinist_ascent_report(session: Session):
    alpinists = session.query(Alpinist).all()
    for a in alpinists:
        print(f"Альпинист: {a.name}")
        ascents = session.query(Ascent).join(Group).join(GroupMember).filter(GroupMember.alpinist_id == a.id).all()
        counted = {}
        for ascent in ascents:
            key = ascent.mountain.name
            counted[key] = counted.get(key, 0) + 1
        for mountain_name, count in counted.items():
            print(f"  Вершина: {mountain_name}, Восхождений: {count}")

# 7) Список восхождений по интервалу дат
def list_ascents_in_period(session: Session, start_date: date, end_date: date):
    ascents = session.query(Ascent).filter(Ascent.start_date >= start_date, Ascent.end_date <= end_date).all()
    for a in ascents:
        print(f"Группа: {a.group.name}, Гора: {a.mountain.name}, С {a.start_date} по {a.end_date}")

# 8) Добавление новой группы восхождения
def add_new_ascent(session: Session, group_name, mountain_id, start_date, end_date):
    group = Group(name=group_name)
    session.add(group)
    session.commit()
    ascent = Ascent(group_id=group.id, mountain_id=mountain_id, start_date=start_date, end_date=end_date)
    session.add(ascent)
    session.commit()
    print("Новая группа и восхождение добавлены.")

# 9) Количество альпинистов на каждой горе
def alpinist_count_per_mountain(session: Session):
    mountains = session.query(Mountain).all()
    for m in mountains:
        ascents = session.query(Ascent).filter_by(mountain_id=m.id).all()
        alpinists = set()
        for ascent in ascents:
            for member in ascent.group.members:
                alpinists.add(member.alpinist)
        print(f"Гора: {m.name}, Альпинистов побывало: {len(alpinists)}")

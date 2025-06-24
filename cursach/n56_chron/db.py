from sqlalchemy.orm import sessionmaker
from models import Base, Mountain, Ascent, Group, GroupMember, Alpinist
from sqlalchemy import create_engine
import configparser
from datetime import date, timedelta

# Чтение конфигурации
config = configparser.ConfigParser()
config.read('database.ini')
db = config['postgresql']

# Подключение к БД
engine = create_engine(f"postgresql://{db['user']}:{db['password']}@{db['host']}:5432/{db['database']}")
Session = sessionmaker(bind=engine)
session = Session()

# Очистка и пересоздание БД
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

# Добавление 5 вершин
mountains = [
    Mountain(name="Эверест", height=8848, country="Непал", region="Гималаи"),
    Mountain(name="Килиманджаро", height=5895, country="Танзания", region="Аруша"),
    Mountain(name="Эльбрус", height=5642, country="Россия", region="Кавказ"),
    Mountain(name="Монблан", height=4808, country="Франция", region="Альпы"),
    Mountain(name="Аконкагуа", height=6960, country="Аргентина", region="Анды")
]
session.add_all(mountains)
session.commit()

# Добавление 10 альпинистов
alpinists = []
for i in range(1, 11):
    alpinists.append(Alpinist(name=f"Альпинист {i}", address=f"Город {i}"))
session.add_all(alpinists)
session.commit()

# Добавление 5 групп
groups = []
for i in range(1, 6):
    group = Group(name=f"Группа {i}")
    session.add(group)
    session.commit()
    for j in range(i*2 - 2, i*2 + 1):
        if j < len(alpinists):
            session.add(GroupMember(group_id=group.id, alpinist_id=alpinists[j].id))
    groups.append(group)
session.commit()

# Добавление 8 восхождений с разными датами
ascents = [
    Ascent(group_id=groups[0].id, mountain_id=mountains[0].id, start_date=date.today() - timedelta(days=120), end_date=date.today() - timedelta(days=115)),
    Ascent(group_id=groups[1].id, mountain_id=mountains[1].id, start_date=date.today() - timedelta(days=90), end_date=date.today() - timedelta(days=85)),
    Ascent(group_id=groups[2].id, mountain_id=mountains[2].id, start_date=date.today() - timedelta(days=70), end_date=date.today() - timedelta(days=65)),
    Ascent(group_id=groups[3].id, mountain_id=mountains[3].id, start_date=date.today() - timedelta(days=50), end_date=date.today() - timedelta(days=45)),
    Ascent(group_id=groups[4].id, mountain_id=mountains[4].id, start_date=date.today() - timedelta(days=30), end_date=date.today() - timedelta(days=25)),
    Ascent(group_id=groups[0].id, mountain_id=mountains[2].id, start_date=date.today() - timedelta(days=20), end_date=date.today() - timedelta(days=15)),
    Ascent(group_id=groups[1].id, mountain_id=mountains[3].id, start_date=date.today() - timedelta(days=10), end_date=date.today() - timedelta(days=5)),
    Ascent(group_id=groups[2].id, mountain_id=mountains[0].id, start_date=date.today() - timedelta(days=5), end_date=date.today())
]
session.add_all(ascents)
session.commit()

print("✅ База данных успешно заполнена данными.")

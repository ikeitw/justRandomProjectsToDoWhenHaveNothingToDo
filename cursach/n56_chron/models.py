from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Вершины
class Mountain(Base):
    __tablename__ = 'mountains'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    height = Column(Integer, nullable=False)
    country = Column(String, nullable=False)
    region = Column(String, nullable=True)
    ascents = relationship("Ascent", back_populates="mountain", cascade="all, delete")

# Группы восхождений (каждая группа идет на определенную гору)
class Ascent(Base):
    __tablename__ = 'ascents'
    id = Column(Integer, primary_key=True)
    mountain_id = Column(Integer, ForeignKey('mountains.id'))
    group_id = Column(Integer, ForeignKey('groups.id'))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    mountain = relationship("Mountain", back_populates="ascents")
    group = relationship("Group", back_populates="ascents")

# Группы (название)
class Group(Base):
    __tablename__ = 'groups'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    ascents = relationship("Ascent", back_populates="group", cascade="all, delete")
    members = relationship("GroupMember", back_populates="group", cascade="all, delete")

# Связь группы и альпинистов (многие ко многим через эту таблицу)
class GroupMember(Base):
    __tablename__ = 'group_members'
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey('groups.id'))
    alpinist_id = Column(Integer, ForeignKey('alpinists.id'))
    group = relationship("Group", back_populates="members")
    alpinist = relationship("Alpinist", back_populates="group_memberships")

# Альпинисты
class Alpinist(Base):
    __tablename__ = 'alpinists'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    group_memberships = relationship("GroupMember", back_populates="alpinist", cascade="all, delete")

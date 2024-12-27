from sqlalchemy import create_engine, Column, Integer, String, Boolean, Date
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

# Database setup
engine = create_engine("sqlite:///progress.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    habit = Column(String, index=True)
    status = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

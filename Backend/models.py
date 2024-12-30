# models.py

from sqlalchemy import Column, Integer, String, Boolean, Date
from .database import Base

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)  # Date of the progress
    habit = Column(String, index=True)  # Name of the habit
    status = Column(Boolean, default=False)  # Completed or not
    streak = Column(Integer, default=0)  # Consecutive streak for the habit

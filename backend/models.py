from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    """Model representing a user."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_sub = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    progress = relationship("Progress", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email='{self.email}', name='{self.name}')"

class Progress(Base):
    """Model for tracking daily habit completion and streaks."""
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "date", "habit", name="uq_progress_user_date_habit"),)

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    habit = Column(String, nullable=False, index=True)
    status = Column(Boolean, nullable=False, default=False)
    streak = Column(Integer, nullable=False, default=0)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User", back_populates="progress")

    def __repr__(self) -> str:
        return (f"Progress(id={self.id}, date={self.date}, habit='{self.habit}', "
                f"status={self.status}, streak={self.streak}, user_id={self.user_id})")
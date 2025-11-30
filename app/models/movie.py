from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.models.content import Content, ContentType


class Movie(Content):
    """Film modeli"""
    __tablename__ = "movies"
    
    id = Column(Integer, ForeignKey("contents.id"), primary_key=True)
    
    # Film özel alanları
    release_date = Column(Date, nullable=True)
    runtime = Column(Integer, nullable=True)  # Dakika cinsinden
    director = Column(String(255), nullable=True)
    cast = Column(String(1000), nullable=True)  # Virgülle ayrılmış oyuncu isimleri
    genres = Column(String(500), nullable=True)  # Virgülle ayrılmış türler
    original_language = Column(String(10), nullable=True)
    imdb_id = Column(String(20), nullable=True)
    
    # Polymorphic identity
    __mapper_args__ = {
        "polymorphic_identity": ContentType.MOVIE,
    }
    
    def __repr__(self):
        return f"<Movie(id={self.id}, title='{self.title}', year={self.release_date.year if self.release_date else 'N/A'})>"


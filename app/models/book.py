from sqlalchemy import Column, Integer, String, Date, ForeignKey
from app.models.content import Content, ContentType


class Book(Content):
    """Kitap modeli"""
    __tablename__ = "books"
    
    id = Column(Integer, ForeignKey("contents.id"), primary_key=True)
    
    # Kitap özel alanları
    authors = Column(String(500), nullable=True)  # Virgülle ayrılmış yazar isimleri
    publisher = Column(String(255), nullable=True)
    published_date = Column(Date, nullable=True)
    page_count = Column(Integer, nullable=True)
    isbn_10 = Column(String(13), nullable=True)
    isbn_13 = Column(String(17), nullable=True)
    categories = Column(String(500), nullable=True)  # Virgülle ayrılmış kategoriler
    language = Column(String(10), nullable=True)
    
    # Polymorphic identity
    __mapper_args__ = {
        "polymorphic_identity": ContentType.BOOK,
    }
    
    def __repr__(self):
        return f"<Book(id={self.id}, title='{self.title}', authors='{self.authors}')>"


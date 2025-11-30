import httpx
from typing import List, Dict, Any, Optional
from app.config import settings


class GoogleBooksService:
    """Google Books API servisi"""
    
    BASE_URL = "https://www.googleapis.com/books/v1"
    
    def __init__(self):
        self.api_key = settings.GOOGLE_BOOKS_API_KEY
    
    async def search_books(self, query: str, page: int = 1, max_results: int = 20) -> Dict[str, Any]:
        """Kitap ara"""
        start_index = (page - 1) * max_results
        
        params = {
            "q": query,
            "startIndex": start_index,
            "maxResults": max_results,
            "langRestrict": "tr"
        }
        
        if self.api_key:
            params["key"] = self.api_key
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/volumes",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "results": data.get("items", []),
                    "total_results": data.get("totalItems", 0)
                }
            return {"results": [], "total_results": 0}
    
    async def get_book_details(self, google_books_id: str) -> Optional[Dict[str, Any]]:
        """Kitap detaylarını getir"""
        params = {}
        if self.api_key:
            params["key"] = self.api_key
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/volumes/{google_books_id}",
                params=params
            )
            
            if response.status_code != 200:
                return None
            
            book_data = response.json()
            volume_info = book_data.get("volumeInfo", {})
            
            # Veriyi düzenle
            processed_data = {
                "id": book_data.get("id"),
                "title": volume_info.get("title"),
                "subtitle": volume_info.get("subtitle"),
                "authors": ", ".join(volume_info.get("authors", [])),
                "publisher": volume_info.get("publisher"),
                "published_date": volume_info.get("publishedDate"),
                "description": volume_info.get("description"),
                "page_count": volume_info.get("pageCount"),
                "categories": ", ".join(volume_info.get("categories", [])),
                "language": volume_info.get("language"),
                "image_url": None
            }
            
            # ISBN bilgilerini al
            industry_identifiers = volume_info.get("industryIdentifiers", [])
            for identifier in industry_identifiers:
                if identifier["type"] == "ISBN_10":
                    processed_data["isbn_10"] = identifier["identifier"]
                elif identifier["type"] == "ISBN_13":
                    processed_data["isbn_13"] = identifier["identifier"]
            
            # Kapak resmini al
            image_links = volume_info.get("imageLinks", {})
            if image_links:
                # Daha büyük resmi tercih et
                processed_data["image_url"] = (
                    image_links.get("large") or 
                    image_links.get("medium") or 
                    image_links.get("thumbnail")
                )
            
            return processed_data
    
    async def search_by_isbn(self, isbn: str) -> Optional[Dict[str, Any]]:
        """ISBN ile kitap ara"""
        params = {"q": f"isbn:{isbn}"}
        
        if self.api_key:
            params["key"] = self.api_key
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/volumes",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                
                if items:
                    # İlk sonucu döndür
                    return await self.get_book_details(items[0]["id"])
            
            return None


# Singleton instance
google_books_service = GoogleBooksService()


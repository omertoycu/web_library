import httpx
from typing import List, Dict, Any, Optional
from app.config import settings


class TMDbService:
    """The Movie Database (TMDb) API servisi"""
    
    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
    
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
    
    async def search_movies(self, query: str, page: int = 1) -> Dict[str, Any]:
        """Film ara"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search/movie",
                params={
                    "api_key": self.api_key,
                    "query": query,
                    "page": page,
                    "language": "tr-TR"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            return {"results": [], "total_results": 0}
    
    async def get_movie_details(self, tmdb_id: int) -> Optional[Dict[str, Any]]:
        """Film detaylarını getir"""
        async with httpx.AsyncClient() as client:
            # Film detayları
            movie_response = await client.get(
                f"{self.BASE_URL}/movie/{tmdb_id}",
                params={
                    "api_key": self.api_key,
                    "language": "tr-TR"
                }
            )
            
            if movie_response.status_code != 200:
                return None
            
            movie_data = movie_response.json()
            
            # Kadro ve ekip bilgisi
            credits_response = await client.get(
                f"{self.BASE_URL}/movie/{tmdb_id}/credits",
                params={"api_key": self.api_key}
            )
            
            if credits_response.status_code == 200:
                credits_data = credits_response.json()
                
                # Yönetmeni bul
                directors = [crew["name"] for crew in credits_data.get("crew", []) 
                           if crew["job"] == "Director"]
                movie_data["director"] = directors[0] if directors else None
                
                # İlk 10 oyuncuyu al
                cast = [actor["name"] for actor in credits_data.get("cast", [])[:10]]
                movie_data["cast"] = ", ".join(cast) if cast else None
            
            # Poster URL'sini düzenle
            if movie_data.get("poster_path"):
                movie_data["poster_url"] = f"{self.IMAGE_BASE_URL}{movie_data['poster_path']}"
            
            # Türleri düzenle
            if movie_data.get("genres"):
                movie_data["genres_text"] = ", ".join([genre["name"] for genre in movie_data["genres"]])
            
            return movie_data
    
    async def get_popular_movies(self, page: int = 1) -> Dict[str, Any]:
        """Popüler filmleri getir"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/movie/popular",
                params={
                    "api_key": self.api_key,
                    "page": page,
                    "language": "tr-TR"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                # total_pages yoksa hesapla
                if "total_pages" not in data and "total_results" in data:
                    total = data.get("total_results", 0)
                    page_size = 20
                    data["total_pages"] = (total + page_size - 1) // page_size if total > 0 else 1
                return data
            return {"results": [], "total_results": 0, "total_pages": 1}
    
    async def get_top_rated_movies(self, page: int = 1) -> Dict[str, Any]:
        """En yüksek puanlı filmleri getir"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/movie/top_rated",
                params={
                    "api_key": self.api_key,
                    "page": page,
                    "language": "tr-TR"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                # total_pages yoksa hesapla
                if "total_pages" not in data and "total_results" in data:
                    total = data.get("total_results", 0)
                    page_size = 20
                    data["total_pages"] = (total + page_size - 1) // page_size if total > 0 else 1
                return data
            return {"results": [], "total_results": 0, "total_pages": 1}


# Singleton instance
tmdb_service = TMDbService()


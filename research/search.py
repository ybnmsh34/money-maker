"""
Search Layer - DDGS (DuckDuckGo Search)
Provides web search with multiple backends and region support.
Based on: https://github.com/deedy5/ddgs
"""

from ddgs import DDGS


def search_text(query: str, region: str = "us-en", max_results: int = 10, backend: str = "auto", timelimit: str = None, safesearch: str = "moderate") -> list:
    """
    Search the web for text results.
    
    Args:
        query: Search query string
        region: Region code (e.g., "us-en", "il-he" for Hebrew, "uk-en")
        max_results: Maximum number of results to return
        backend: Search backend ("auto", "duckduckgo", "google", "bing", "brave", etc.)
        timelimit: Time filter ("d"=day, "w"=week, "m"=month, "y"=year, None=any)
        safesearch: Safe search level ("on", "moderate", "off")
    
    Returns:
        List of dicts with keys: title, href, body (snippet)
    """
    return list(DDGS().text(
        query=query,
        region=region,
        max_results=max_results,
        backend=backend,
        timelimit=timelimit,
        safesearch=safesearch,
    ))


def search_news(query: str, region: str = "us-en", max_results: int = 10) -> list:
    """
    Search for news articles.
    
    Args:
        query: Search query string
        region: Region code
        max_results: Maximum number of results
    
    Returns:
        List of dicts with news results
    """
    return list(DDGS().news(
        query=query,
        region=region,
        max_results=max_results,
    ))


def search_images(query: str, region: str = "us-en", max_results: int = 10) -> list:
    """
    Search for images.
    
    Args:
        query: Search query string
        region: Region code
        max_results: Maximum number of results
    
    Returns:
        List of dicts with image results
    """
    return list(DDGS().images(
        query=query,
        region=region,
        max_results=max_results,
    ))


def search_books(query: str, max_results: int = 10) -> list:
    """
    Search for books.
    
    Args:
        query: Search query string
        max_results: Maximum number of results
    
    Returns:
        List of dicts with book results
    """
    return list(DDGS().books(
        query=query,
        max_results=max_results,
    ))


# Available backends for text search:
# bing, brave, duckduckgo, google, grokipedia, mojeek, startpage, yandex, yahoo, wikipedia
# Use "auto" to let DDGS choose the best available backend automatically.

# Available regions include:
# us-en, uk-en, ru-ru, il-he (Hebrew), de-de, fr-fr, es-es, it-it, ja-jp, zh-cn, etc.

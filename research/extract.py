"""
Content Extraction Layer - Trafilatura
Extracts clean text and metadata from web pages.
Based on: https://github.com/adbar/trafilatura

HTTP-first approach: Fetch HTML, extract clean text.
Fallback for JS-heavy pages is handled separately.
"""

import trafilatura


def extract_url(url: str, output_format: str = "markdown", include_links: bool = True, include_tables: bool = True, deduplicate: bool = True) -> str:
    """
    Fetch a URL and extract clean text content.
    
    Args:
        url: URL to fetch and extract
        output_format: Output format ("markdown", "text", "html")
        include_links: Include hyperlinks in output
        include_tables: Include tables in output
        deduplicate: Remove duplicate content
    
    Returns:
        Extracted text as string, or None if extraction failed
    """
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        return None
    
    text = trafilatura.extract(
        downloaded,
        output_format=output_format,
        with_metadata=False,
        include_links=include_links,
        include_tables=include_tables,
        deduplicate=deduplicate,
    )
    return text


def extract_html(html: str, output_format: str = "markdown", include_links: bool = True, include_tables: bool = True, deduplicate: bool = True) -> str:
    """
    Extract clean text from HTML string (already downloaded).
    
    Args:
        html: HTML string to extract from
        output_format: Output format ("markdown", "text", "html")
        include_links: Include hyperlinks in output
        include_tables: Include tables in output
        deduplicate: Remove duplicate content
    
    Returns:
        Extracted text as string, or None if extraction failed
    """
    text = trafilatura.extract(
        html,
        output_format=output_format,
        with_metadata=False,
        include_links=include_links,
        include_tables=include_tables,
        deduplicate=deduplicate,
    )
    return text


def extract_with_metadata(url: str, output_format: str = "markdown") -> dict:
    """
    Fetch a URL and extract content with full metadata.
    
    Args:
        url: URL to fetch and extract
        output_format: Output format
    
    Returns:
        Dict with 'text' key and metadata keys (title, author, date, etc.)
    """
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        return {}
    
    text = trafilatura.extract(
        downloaded,
        output_format=output_format,
        with_metadata=True,
        include_links=True,
        include_tables=True,
        deduplicate=True,
    )
    
    if not text:
        return {}
    
    # Parse metadata from the beginning of the output
    metadata = {}
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('# '):
            metadata['title'] = line[2:].strip()
            i += 1
            break
        elif ':' in line:
            key, _, value = line.partition(':')
            metadata[key.strip().lower()] = value.strip()
            i += 1
        else:
            break
    
    # Text is everything after metadata
    text_content = '\n'.join(lines[i:]).strip()
    metadata['text'] = text_content
    
    return metadata


def extract_batch(urls: list, output_format: str = "markdown") -> list:
    """
    Extract content from multiple URLs.
    
    Args:
        urls: List of URLs to extract
        output_format: Output format
    
    Returns:
        List of dicts with 'url', 'text', and 'success' keys
    """
    results = []
    for url in urls:
        text = extract_url(url, output_format=output_format)
        results.append({
            'url': url,
            'text': text,
            'success': text is not None,
        })
    return results

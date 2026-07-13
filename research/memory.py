"""
RAG Memory Layer - Chroma + Sentence-Transformers
Local vector store for storing and retrieving passages.
Based on: https://github.com/chroma-core/chroma, https://github.com/UKPLab/sentence-transformers

Usage:
    - Store passages from web search results
    - Retrieve relevant passages for queries
    - Persistent storage between sessions
"""

import uuid
import os
import chromadb
from sentence_transformers import SentenceTransformer

# Default config
EMBED_MODEL = os.getenv("EMBED_MODEL", "intfloat/multilingual-e5-base")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
TOP_K = int(os.getenv("TOP_K", "5"))

# Lazy-load embedder
_embedder = None
_client = None
_collection = None


def get_embedder():
    """Get or create the sentence transformer embedder."""
    global _embedder
    if _embedder is None:
        print(f"Loading embedding model: {EMBED_MODEL}...")
        _embedder = SentenceTransformer(EMBED_MODEL)
    return _embedder


def get_collection(collection_name: str = "web_research"):
    """Get or create the Chroma collection."""
    global _client, _collection
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
    if _collection is None:
        _collection = _client.get_or_create_collection(collection_name)
    return _collection


def embed_passages(texts: list) -> list:
    """
    Embed passages for storage.
    
    Args:
        texts: List of text passages to embed
    
    Returns:
        List of embedding vectors
    """
    embedder = get_embedder()
    prefixed = [f"passage: {t}" for t in texts]
    return embedder.encode(prefixed, normalize_embeddings=True).tolist()


def embed_query(query: str) -> list:
    """
    Embed a query for retrieval.
    
    Args:
        query: Query string to embed
    
    Returns:
        Embedding vector
    """
    embedder = get_embedder()
    prefixed = [f"query: {query}"]
    return embedder.encode(prefixed, normalize_embeddings=True).tolist()[0]


def add_passages(passages: list, metadata_list: list = None, collection_name: str = "web_research"):
    """
    Add passages to the vector store.
    
    Args:
        passages: List of text passages to store
        metadata_list: List of metadata dicts (e.g., {"url": "...", "title": "..."})
        collection_name: Name of the Chroma collection
    
    Returns:
        List of generated IDs
    """
    collection = get_collection(collection_name)
    
    if metadata_list is None:
        metadata_list = [{} for _ in passages]
    
    ids = [str(uuid.uuid4()) for _ in passages]
    embeddings = embed_passages(passages)
    
    collection.upsert(
        ids=ids,
        documents=passages,
        metadatas=metadata_list,
        embeddings=embeddings,
    )
    return ids


def add_url_content(url: str, text: str, title: str = "", source_query: str = "", chunk_size: int = 1400, collection_name: str = "web_research"):
    """
    Add content from a URL to the vector store, chunked.
    
    Args:
        url: Source URL
        text: Full text content
        title: Title of the page
        source_query: Original search query that led to this page
        chunk_size: Size of each chunk
        collection_name: Name of the Chroma collection
    
    Returns:
        List of generated IDs
    """
    # Split text into chunks
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start:start + chunk_size])
        start += chunk_size
    
    if not chunks:
        return []
    
    # Create metadata for each chunk
    metadata_list = [
        {"url": url, "title": title, "source_query": source_query}
        for _ in chunks
    ]
    
    return add_passages(chunks, metadata_list, collection_name)


def retrieve(query: str, top_k: int = None, collection_name: str = "web_research") -> dict:
    """
    Retrieve relevant passages for a query.
    
    Args:
        query: Query string
        top_k: Number of results to retrieve (default from config)
        collection_name: Name of the Chroma collection
    
    Returns:
        Dict with 'documents', 'metadatas', 'distances' keys
    """
    if top_k is None:
        top_k = TOP_K
    
    collection = get_collection(collection_name)
    q_emb = embed_query(query)
    
    results = collection.query(
        query_embeddings=[q_emb],
        n_results=top_k,
    )
    return results


def retrieve_with_context(query: str, top_k: int = None, collection_name: str = "web_research") -> tuple:
    """
    Retrieve passages and format them with context blocks.
    
    Args:
        query: Query string
        top_k: Number of results to retrieve
        collection_name: Name of the Chroma collection
    
    Returns:
        Tuple of (context_string, sources_list)
    """
    results = retrieve(query, top_k, collection_name)
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    
    context_blocks = []
    sources = []
    for i, (doc, meta) in enumerate(zip(docs, metas), start=1):
        context_blocks.append(
            f"[{i}] TITLE: {meta.get('title', '')}\nURL: {meta.get('url', '')}\n{doc}"
        )
        sources.append(f"[{i}] {meta.get('title', '')} — {meta.get('url', '')}")
    
    return '\n\n'.join(context_blocks), sources


def count_documents(collection_name: str = "web_research") -> int:
    """
    Count the number of documents in the collection.
    
    Args:
        collection_name: Name of the Chroma collection
    
    Returns:
        Number of documents
    """
    collection = get_collection(collection_name)
    return collection.count()


def delete_collection(collection_name: str = "web_research"):
    """
    Delete the entire collection.
    
    Args:
        collection_name: Name of the Chroma collection
    """
    global _collection
    _collection = None
    _client = chromadb.PersistentClient(path=CHROMA_PATH)
    if collection_name in [c.name for c in _client.list_collections()]:
        _client.delete_collection(collection_name)


def search_and_index(query: str, region: str = "us-en", max_results: int = 6, chunk_size: int = 1400, collection_name: str = "web_research") -> list:
    """
    Search the web and index the results into the vector store.
    
    This combines the search and extraction layers with RAG memory.
    
    Args:
        query: Search query
        region: Region code
        max_results: Number of search results to process
        chunk_size: Chunk size for indexing
        collection_name: Name of the Chroma collection
    
    Returns:
        List of indexed sources with title and URL
    """
    # Import here to avoid circular imports
    from research.search import search_text
    from research.extract import extract_url
    
    # Search
    results = search_text(query, region=region, max_results=max_results)
    
    indexed_sources = []
    for result in results:
        url = result.get("href") or result.get("url") or result.get("link")
        title = result.get("title", "")
        if not url:
            continue
        
        # Extract content
        text = extract_url(url, output_format="markdown")
        if not text:
            continue
        
        # Index into RAG
        add_url_content(url, text, title, query, chunk_size, collection_name)
        indexed_sources.append({"title": title, "url": url})
    
    return indexed_sources

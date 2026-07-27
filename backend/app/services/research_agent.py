from functools import lru_cache

from tavily import TavilyClient

from app.core.config import get_settings
from app.services.llm.factory import get_llm_provider

_SYSTEM_PROMPT = (
    "You are a research analyst. Synthesize the provided search results into a clear, "
    "well-organized answer to the user's query. Cite sources inline using [1], [2], etc. "
    "matching the numbered list you were given. Do not invent facts beyond the sources."
)


@lru_cache
def _client() -> TavilyClient:
    return TavilyClient(api_key=get_settings().tavily_api_key)


def research(query: str, max_results: int = 5) -> dict:
    search_result = _client().search(query=query, max_results=max_results)
    results = search_result.get("results", [])

    numbered_sources = "\n\n".join(
        f"[{i + 1}] {r['title']} ({r['url']})\n{r.get('content', '')}" for i, r in enumerate(results)
    )
    user_message = f"Query: {query}\n\nSearch results:\n\n{numbered_sources}"

    synthesis = get_llm_provider().complete(
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
        max_tokens=1500,
    )

    sources = [
        {"title": r["title"], "url": r["url"], "snippet": r.get("content", "")[:300]} for r in results
    ]
    return {"synthesis": synthesis, "sources": sources}

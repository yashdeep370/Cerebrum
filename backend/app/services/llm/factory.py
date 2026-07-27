from functools import lru_cache

from app.core.config import get_settings
from app.services.llm.base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()

    if settings.llm_provider == "anthropic":
        from app.services.llm.anthropic_provider import AnthropicProvider

        return AnthropicProvider(api_key=settings.anthropic_api_key, model=settings.anthropic_model)

    if settings.llm_provider == "groq":
        from app.services.llm.groq_provider import GroqProvider

        return GroqProvider(api_key=settings.groq_api_key, model=settings.groq_model)

    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider!r}")

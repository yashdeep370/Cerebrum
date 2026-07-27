from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, system: str, messages: list[dict[str, str]], max_tokens: int = 1024) -> str:
        """messages: list of {"role": "user"|"assistant", "content": str}. Returns the assistant's reply text."""
        raise NotImplementedError

from datetime import datetime, timezone

from app.db.models import ChatMessage, Document
from app.services.llm.factory import get_llm_provider
from app.services.research_agent import research

_SYSTEM_PROMPT = (
    "You are a report writer. Produce a well-structured markdown report from the material "
    "given to you. Use headings, keep it factual, and preserve any citations present in the source "
    "material. Do not fabricate information that isn't in the provided material."
)


def generate_report(
    document: Document,
    chat_history: list[ChatMessage],
    title: str,
    include_summary: bool,
    include_chat_history: bool,
    research_query: str | None,
) -> str:
    sections: list[str] = []

    if include_summary and document.summary:
        sections.append(f"## Document Summary\n\n{document.summary}")

    if include_chat_history and chat_history:
        qa_pairs = "\n\n".join(f"**{m.role.capitalize()}:** {m.content}" for m in chat_history)
        sections.append(f"## Q&A Notes\n\n{qa_pairs}")

    if research_query:
        result = research(research_query)
        source_list = "\n".join(f"- [{s['title']}]({s['url']})" for s in result["sources"])
        sections.append(f"## Research: {research_query}\n\n{result['synthesis']}\n\n### Sources\n{source_list}")

    material = "\n\n".join(sections) if sections else "No material was available for this report."
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    user_message = (
        f"Title: {title}\nGenerated: {generated_at}\nSource document: {document.filename}\n\n"
        f"Raw material:\n\n{material}\n\n"
        "Turn this into a polished markdown report with a title heading, brief executive summary, "
        "and the sections provided."
    )

    return get_llm_provider().complete(
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
        max_tokens=2000,
    )

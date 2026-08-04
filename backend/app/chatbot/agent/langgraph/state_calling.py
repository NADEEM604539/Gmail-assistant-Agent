from __future__ import annotations

from typing import Any, TypedDict


class Workflow(TypedDict, total=False):
    user_id: int
    user_prompt: str
    message_ids: list[str]
    selected_agent: str
    selected_agents: list[str]
    content: str
    final_response: str
    backend_details: dict[str, Any]
    tool_calls: list[dict[str, Any]]
    messages: list[dict[str, Any]]
    conversation_history: list[dict[str, str]]
    agents_called: list[dict[str, Any]]
    tools_called: list[dict[str, Any]]
    token_usage: dict[str, int]
    agent_results: list[dict[str, Any]]
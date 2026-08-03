from __future__ import annotations

from typing import Any


def build_agent_error_response(
	agent_name: str,
	user_id: int,
	query: str,
	error: Exception,
	message_ids: list[str] | None = None,
) -> dict[str, Any]:
	message_ids = message_ids or []
	error_code = getattr(error, "code", None)
	error_message = str(error)
	is_content_filter = error_code == "content_filter" or "content_filter" in error_message.lower()

	if is_content_filter:
		content = (
			"I couldn\'t complete that request because the language model provider filtered the prompt. "
			"Please rephrase the request and try again."
		)
	else:
		content = (
			"I couldn\'t complete that request right now. "
			"Please try again in a moment."
		)

	return {
		"content": content,
		"token_usage": {
			"input_tokens": 0,
			"output_tokens": 0,
			"total_tokens": 0,
		},
		"backend_details": {
			"agent": agent_name,
			"user_id": user_id,
			"query": query,
			"message_ids": message_ids,
			"error": error_message,
			"error_code": error_code,
			"content_filtered": is_content_filter,
			"tool_names": [],
			"tool_call_count": 0,
		},
		"tool_calls": [],
		"messages": [],
	}
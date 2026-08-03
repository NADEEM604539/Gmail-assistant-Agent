from __future__ import annotations

from collections.abc import Callable
from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.chatbot.agent.RAG_agent import callagent as retrieval_agent
from app.chatbot.agent.gmail_agent import call_gmail_Agent
from app.chatbot.agent.knowledge_agent import call_knowledge_Agent
from app.chatbot.agent.langgraph.state_calling import Workflow


def _detect_intents(prompt: str) -> list[str]:
	text = prompt.lower()
	intents: list[str] = []

	knowledge_keywords = [
		"document",
		"documents",
		"doc",
		"docu",
		"file",
		"files",
		"pdf",
		"attachment",
		"attachments",
		"embed",
		"embeded",
		"embedded",
		"embedding",
		"knowledge",
		"rag",
		"chunk",
		"chunks",
	]
	gmail_keywords = [
		"email",
		"mail",
		"gmail",
		"reply",
		"forward",
		"draft",
		"sent",
		"inbox",
		"trash",
		"spam",
		"archive",
		"message",
		"messages",
	]

	if any(keyword in text for keyword in knowledge_keywords):
		intents.append("knowledge")
	if any(keyword in text for keyword in gmail_keywords):
		intents.append("gmail")
	if not intents:
		intents.append("retrieval")

	return intents


def _route(state: Workflow) -> Literal["gmail", "knowledge", "retrieval", "multi"]:
	intents = _detect_intents(state.get("user_prompt") or "")
	if len(intents) > 1:
		return "multi"
	return intents[0]


def _merge_agent_result(state: Workflow, agent_name: str, result: dict) -> Workflow:
	agents_called = list(state.get("agents_called") or [])
	agents_called.append(
		{
			"agent_name": agent_name,
			"tools_used": result.get("backend_details", {}).get("tool_names", []),
		}
	)

	tools_called = list(state.get("tools_called") or [])
	for tool_call in result.get("tool_calls", []):
		tools_called.append(
			{
				"tool_name": tool_call.get("name"),
				"status": "success",
			}
		)

	return {
		**state,
		"selected_agent": agent_name,
		"content": result.get("content", ""),
		"final_response": result.get("content", ""),
		"token_usage": result.get("token_usage", {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}),
		"backend_details": result.get("backend_details", {}),
		"tool_calls": result.get("tool_calls", []),
		"messages": result.get("messages", []),
		"agents_called": agents_called,
		"tools_called": tools_called,
	}


def _combine_results(state: Workflow, results: list[dict]) -> Workflow:
	combined_sections: list[str] = []
	agents_called = list(state.get("agents_called") or [])
	tools_called = list(state.get("tools_called") or [])
	tool_calls: list[dict] = []
	messages: list[dict] = []
	total_input_tokens = 0
	total_output_tokens = 0
	total_tokens = 0
	selected_agents: list[str] = []
	agent_results: list[dict] = []

	for result in results:
		agent_name = result.get("backend_details", {}).get("agent", "unknown")
		selected_agents.append(agent_name)
		agent_results.append(result)
		agents_called.append(
			{
				"agent_name": agent_name,
				"tools_used": result.get("backend_details", {}).get("tool_names", []),
			}
		)
		for tool_call in result.get("tool_calls", []):
			tool_calls.append(tool_call)
			tools_called.append(
				{
					"tool_name": tool_call.get("name"),
					"status": "success",
				}
			)
		messages.extend(result.get("messages", []))
		token_usage = result.get("token_usage", {}) or {}
		total_input_tokens += int(token_usage.get("input_tokens", 0) or 0)
		total_output_tokens += int(token_usage.get("output_tokens", 0) or 0)
		total_tokens += int(token_usage.get("total_tokens", 0) or 0)

		content = (result.get("content") or "").strip()
		if content:
			pretty_name = agent_name.replace("_", " ").title()
			combined_sections.append(f"{pretty_name}:\n{content}")

	combined_content = "\n\n".join(combined_sections)
	return {
		**state,
		"selected_agent": "multi",
		"selected_agents": selected_agents,
		"content": combined_content,
		"final_response": combined_content,
		"token_usage": {
			"input_tokens": total_input_tokens,
			"output_tokens": total_output_tokens,
			"total_tokens": total_tokens,
		},
		"backend_details": {
			"agent": "multi",
			"selected_agents": selected_agents,
			"compound_query": True,
			"tool_names": [call.get("name") for call in tool_calls if call.get("name")],
			"tool_call_count": len(tool_calls),
		},
		"tool_calls": tool_calls,
		"messages": messages,
		"agents_called": agents_called,
		"tools_called": tools_called,
		"agent_results": agent_results,
	}


def _gmail_node(state: Workflow) -> Workflow:
	result = call_gmail_Agent(
		user_id=state["user_id"],
		query=state["user_prompt"],
		message_ids=state.get("message_ids") or [],
	)
	return _merge_agent_result(state, "gmail", result)


def _knowledge_node(state: Workflow) -> Workflow:
	result = call_knowledge_Agent(
		user_id=state["user_id"],
		query=state["user_prompt"],
	)
	return _merge_agent_result(state, "knowledge", result)


def _retrieval_node(state: Workflow) -> Workflow:
	result = retrieval_agent(
		user_id=state["user_id"],
		query=state["user_prompt"],
	)
	return _merge_agent_result(state, "retrieval", result)


def _multi_node(state: Workflow) -> Workflow:
	intents = _detect_intents(state.get("user_prompt") or "")
	results: list[dict] = []
	for intent in intents:
		if intent == "knowledge":
			results.append(
				call_knowledge_Agent(
					user_id=state["user_id"],
					query=state["user_prompt"],
				)
			)
		elif intent == "gmail":
			results.append(
				call_gmail_Agent(
					user_id=state["user_id"],
					query=state["user_prompt"],
					message_ids=state.get("message_ids") or [],
				)
			)
		elif intent == "retrieval":
			results.append(
				retrieval_agent(
					user_id=state["user_id"],
					query=state["user_prompt"],
				)
			)

	return _combine_results(state, results)


graph = StateGraph(Workflow)
graph.add_node("gmail", _gmail_node)
graph.add_node("knowledge", _knowledge_node)
graph.add_node("retrieval", _retrieval_node)
graph.add_node("multi", _multi_node)
graph.add_conditional_edges(START, _route, {
	"gmail": "gmail",
	"knowledge": "knowledge",
	"retrieval": "retrieval",
	"multi": "multi",
})
graph.add_edge("gmail", END)
graph.add_edge("knowledge", END)
graph.add_edge("retrieval", END)
graph.add_edge("multi", END)

chat_graph = graph.compile()


def run_chat_graph(user_id: int, query: str, message_ids: list[str] | None = None) -> Workflow:
	return chat_graph.invoke(
		{
			"user_id": user_id,
			"user_prompt": query,
			"message_ids": message_ids or [],
			"content": "",
			"token_usage": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0},
			"agents_called": [],
			"tools_called": [],
			"agent_results": [],
		}
	)
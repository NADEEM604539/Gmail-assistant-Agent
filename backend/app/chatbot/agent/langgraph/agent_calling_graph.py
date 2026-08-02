from __future__ import annotations

from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.chatbot.agent.RAG_agent import callagent as retrieval_agent
from app.chatbot.agent.gmail_agent import call_gmail_Agent
from app.chatbot.agent.knowledge_agent import call_knowledge_Agent
from app.chatbot.agent.langgraph.state_calling import Workflow


def _route(state: Workflow) -> Literal["gmail", "knowledge", "retrieval"]:
	prompt = (state.get("user_prompt") or "").lower()
	if any(keyword in prompt for keyword in ["email", "mail", "gmail", "reply", "forward", "draft", "sent", "inbox", "trash", "spam", "archive"]):
		return "gmail"
	if any(keyword in prompt for keyword in ["document", "docs", "file", "pdf", "attachment", "embed", "knowledge", "rag"]):
		return "knowledge"
	return "retrieval"


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


graph = StateGraph(Workflow)
graph.add_node("gmail", _gmail_node)
graph.add_node("knowledge", _knowledge_node)
graph.add_node("retrieval", _retrieval_node)
graph.add_conditional_edges(START, _route, {
	"gmail": "gmail",
	"knowledge": "knowledge",
	"retrieval": "retrieval",
})
graph.add_edge("gmail", END)
graph.add_edge("knowledge", END)
graph.add_edge("retrieval", END)

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
		}
	)
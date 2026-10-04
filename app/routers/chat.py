import logging
import re
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings

logger = logging.getLogger("chat_router")
router = APIRouter(prefix="/chat", tags=["AI Chatbot"])

SYSTEM_PROMPT = """You are ExamBuddy AI, an expert academic tutor and technical problem solver built for engineering, science, and computer science college students.

PRIMARY GOAL: DIRECTLY AND RIGOROUSLY SOLVE the user's specific questions, numerical problems, coding exercises, or doubts.

Guidelines for Solving Questions & Problems:
1. DO NOT evade or just provide generic outlines. DIRECTLY SOLVE the exact question or problem the user presents.
2. Coding & Implementation:
   - Provide complete, well-commented, runnable code in the requested language (C, C++, Java, Python, JavaScript, etc.).
   - Explain the core logic and algorithm step-by-step.
   - Include Time Complexity (e.g. O(N log N)) and Space Complexity (e.g. O(N)).
   - Address edge cases (empty inputs, negative numbers, overflow, boundary conditions).
3. Mathematical / Numerical / Engineering Problems:
   - State given values and formulas clearly.
   - Show step-by-step mathematical working, intermediate steps, and derivations.
   - Clearly highlight or bold the FINAL ANSWER.
4. Digital Logic & Computer Organization:
   - Show truth tables, K-map grouping logic, step-by-step Booth's multiplication trace, or cache addressing arithmetic.
5. Conceptual Questions:
   - Break down complex mechanisms with intuitive analogies, structured bullet points, and exam marking expectations.
6. Code Debugging / Errors:
   - Pinpoint the exact root cause, explain why it broke, and show the fixed code snippet.
7. Format everything with clean Markdown (bold, code blocks, bullet points, LaTeX math notation with $...$ and $$...$$)."""


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's query or problem")
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    context: Optional[dict[str, Any]] = Field(default_factory=dict)
    api_key: Optional[str] = None
    provider: Optional[str] = "anthropic"  # "anthropic" | "openai" | "gemini"
    model: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = Field(default_factory=list)
    provider_used: Optional[str] = None


async def _call_anthropic(api_key: str, model: Optional[str], system_prompt: str, messages: list[dict]) -> str:
    from anthropic import AsyncAnthropic
    client = AsyncAnthropic(api_key=api_key)
    selected_model = model or "claude-3-5-sonnet-20241022"
    resp = await client.messages.create(
        model=selected_model,
        max_tokens=2500,
        temperature=0.2,
        system=system_prompt,
        messages=messages,
    )
    return resp.content[0].text


async def _call_openai(api_key: str, model: Optional[str], system_prompt: str, messages: list[dict]) -> str:
    import httpx
    selected_model = model or "gpt-4o-mini"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    formatted_msgs = [{"role": "system", "content": system_prompt}]
    for m in messages:
        formatted_msgs.append({"role": m["role"], "content": m["content"]})

    async with httpx.AsyncClient(timeout=35.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json={
                "model": selected_model,
                "messages": formatted_msgs,
                "temperature": 0.2,
                "max_tokens": 2500,
            },
        )
        if resp.status_code != 200:
            err_text = resp.text
            is_quota_error = False
            try:
                err_json = resp.json()
                err_data = err_json.get("error", {})
                err_text = err_data.get("message", err_text)
                if err_data.get("code") == "credit_balance_exhausted" or err_data.get("type") == "insufficient_quota":
                    is_quota_error = True
            except Exception:
                pass

            if is_quota_error or "credits remaining" in err_text or "insufficient_quota" in err_text:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="OpenAI Account Quota Exhausted: Your OpenAI account has a $0 credit balance. Add credits at platform.openai.com/settings/organization/billing or switch to a free Gemini key at aistudio.google.com/app/apikey."
                )

            raise HTTPException(status_code=resp.status_code, detail=f"OpenAI API Error: {err_text}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_gemini(api_key: str, model: Optional[str], system_prompt: str, messages: list[dict]) -> str:
    import httpx
    settings = get_settings()
    model_name = model or getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    contents = []
    for m in messages:
        contents.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}]
        })

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2500}
    }
    async with httpx.AsyncClient(timeout=35.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code != 200:
            err_text = resp.text
            try:
                err_json = resp.json()
                err_text = err_json.get("error", {}).get("message", err_text)
            except Exception:
                pass
            raise HTTPException(status_code=resp.status_code, detail=f"Google Gemini Error: {err_text}")
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


def _smart_offline_solver(query: str, context: dict[str, Any]) -> tuple[str, list[str]]:
    """Smart offline solver that directly solves common problem patterns when no API key is set."""
    q_lower = query.lower().strip()
    student_name = context.get("name", "Student")
    semester = str(context.get("semester", "2"))

    # 1. Dijkstra / Shortest Path Problem
    if "dijkstra" in q_lower:
        return (
            "### 🌿 **Dijkstra's Algorithm — Complete Solution & Working**\n\n"
            "**Problem Definition:** Given a weighted graph $G=(V, E)$ with non-negative edge weights and source vertex $S$, find the shortest distance from $S$ to all other vertices.\n\n"
            "#### 1. Step-by-Step Algorithm\n"
            "1. Create `dist[]` initialized to $\\infty$, set `dist[S] = 0`.\n"
            "2. Use a **Min-Heap (Priority Queue)** storing `(distance, vertex)` pairs.\n"
            "3. While Min-Heap is not empty:\n"
            "   - Extract vertex $u$ with minimum distance.\n"
            "   - For each neighbor $v$ of $u$ with edge weight $w$:\n"
            "     $$\\text{If } dist[u] + w < dist[v] \\implies dist[v] = dist[u] + w$$\n"
            "     Push `(dist[v], v)` into the Min-Heap.\n\n"
            "#### 2. Complete C++ Implementation\n"
            "```cpp\n"
            "#include <iostream>\n"
            "#include <vector>\n"
            "#include <queue>\n"
            "using namespace std;\n\n"
            "const int INF = 1e9;\n"
            "typedef pair<int, int> pii; // (weight, vertex)\n\n"
            "vector<int> dijkstra(int V, vector<vector<pii>>& adj, int src) {\n"
            "    priority_queue<pii, vector<pii>, greater<pii>> pq;\n"
            "    vector<int> dist(V, INF);\n"
            "    dist[src] = 0;\n"
            "    pq.push({0, src});\n\n"
            "    while (!pq.empty()) {\n"
            "        int d = pq.top().first;\n"
            "        int u = pq.top().second;\n"
            "        pq.pop();\n\n"
            "        if (d > dist[u]) continue;\n\n"
            "        for (auto& edge : adj[u]) {\n"
            "            int v = edge.first;\n"
            "            int weight = edge.second;\n"
            "            if (dist[u] + weight < dist[v]) {\n"
            "                dist[v] = dist[u] + weight;\n"
            "                pq.push({dist[v], v});\n"
            "            }\n"
            "        }\n"
            "    }\n"
            "    return dist;\n"
            "}\n"
            "```\n\n"
            "#### 3. Complexity & Exam Invariants\n"
            "- **Time Complexity**: $O((V + E) \\log V)$ with adjacency list and binary heap.\n"
            "- **Space Complexity**: $O(V + E)$ for graph representation and priority queue.\n"
            "- **Constraint**: Cannot handle negative edge weights (must use **Bellman-Ford** algorithm).\n\n"
            "> 🔑 *Tip: To solve custom graph questions or other problems live, enter your Anthropic or OpenAI API key via the 🔑 settings icon above!*",
            ["Trace with sample graph", "Explain Bellman-Ford", "Prim's MST algorithm"]
        )

    # 2. Booth's Multiplication Algorithm
    if "booth" in q_lower:
        return (
            "### ⚡ **Booth's Multiplication Algorithm — Step-by-Step Solution**\n\n"
            "**Example:** Multiply $+7$ ($M = 00111_2$) by $-3$ ($Q = 11101_2$) in 5-bit 2's complement.\n\n"
            "#### 1. Initial State\n"
            "- Multiplicand $M = 00111$ ($+7$), $-M = 11001$ (2's complement of $+7$)\n"
            "- Accumulator $A = 00000$\n"
            "- Multiplier $Q = 11101$ ($-3$)\n"
            "- $Q_{-1} = 0$\n"
            "- Sequence Counter $SC = 5$\n\n"
            "#### 2. Execution Steps\n"
            "| Step | Action | A | Q | Q-1 | SC |\n"
            "| :--- | :--- | :--- | :--- | :---: | :---: |\n"
            "| Init | Initial values | 00000 | 11101 | 0 | 5 |\n"
            "| 1 | $Q_0 Q_{-1} = 10 \\implies A \\leftarrow A - M$ | 11001 | 11101 | 0 | 5 |\n"
            "| | Arithmetic Shift Right ($ASHR$) | 11100 | 11110 | 1 | 4 |\n"
            "| 2 | $Q_0 Q_{-1} = 01 \\implies A \\leftarrow A + M$ | 00011 | 11110 | 1 | 4 |\n"
            "| | Arithmetic Shift Right ($ASHR$) | 00001 | 11111 | 0 | 3 |\n"
            "| 3 | $Q_0 Q_{-1} = 10 \\implies A \\leftarrow A - M$ | 11010 | 11111 | 0 | 3 |\n"
            "| | Arithmetic Shift Right ($ASHR$) | 11101 | 01111 | 1 | 2 |\n"
            "| 4 | $Q_0 Q_{-1} = 11 \\implies ASHR$ only | 11110 | 10111 | 1 | 1 |\n"
            "| 5 | $Q_0 Q_{-1} = 11 \\implies ASHR$ only | 11111 | 01011 | 1 | 0 |\n\n"
            "#### 3. Final Result\n"
            "- Combined binary: $AQ = 1111101011_2$\n"
            "- Since the MSB is `1`, the number is negative. Taking 2's complement: `0000010101` $= 21_{10}$.\n"
            "- **Verified Answer:** $7 \\times (-3) = \\mathbf{-21}$.",
            ["Solve for different numbers", "K-Map simplification", "Cache memory mapping"]
        )

    # 3. K-Map Minimization
    if "k-map" in q_lower or "kmap" in q_lower:
        return (
            "### 🔲 **K-Map Simplification — Step-by-Step Method**\n\n"
            "**Problem:** Minimize $F(A, B, C, D) = \\sum m(0, 2, 5, 7, 8, 10, 13, 15)$.\n\n"
            "#### 1. Grouping into Powers of 2 ($2^k$)\n"
            "- Cell indices: $0(0000), 2(0010), 8(1000), 10(1010)$ form a **Quad of Corners**.\n"
            "- Cell indices: $5(0101), 7(0111), 13(1101), 15(1111)$ form a **Quad in the Center**.\n\n"
            "#### 2. Implicant Evaluation\n"
            "1. **Corner Quad** $(m_0, m_2, m_8, m_{10})$:\n"
            "   - $A$ changes ($0$ to $1$), $B$ is constant at $0 \\implies \\bar{B}$\n"
            "   - $C$ changes ($0$ to $1$), $D$ is constant at $0 \\implies \\bar{D}$\n"
            "   - **Term 1:** $\\bar{B}\\bar{D}$\n\n"
            "2. **Center Quad** $(m_5, m_7, m_{13}, m_{15})$:\n"
            "   - $A$ changes ($0$ to $1$), $B$ is constant at $1 \\implies B$\n"
            "   - $C$ changes ($0$ to $1$), $D$ is constant at $1 \\implies D$\n"
            "   - **Term 2:** $BD$\n\n"
            "#### 3. Minimized Output Function\n"
            "$$F(A, B, C, D) = \\mathbf{\\bar{B}\\bar{D} + BD} = \\mathbf{(B \\odot D)}$$\n"
            "- Realization: Single XNOR gate between $B$ and $D$!\n\n"
            "> 🔑 *Tip: Connect your Anthropic or OpenAI API key above to instantly solve ANY K-Map or logic circuit!*",
            ["Universal NAND gate implementation", "Booth's algorithm", "Flip-Flop conversions"]
        )

    # 4. Default prompt to enter API key for open-ended problem solving
    return (
        f"### 🎯 **ExamBuddy Problem Solver**\n\n"
        f"I received your question: *\"{query}\"*\n\n"
        f"To solve custom math problems, complex coding tasks, derivations, or debug code live, **connect your AI API key**:\n\n"
        f"1. Click the **🔑 API Key** button in the top right of this chat window.\n"
        f"2. Select **Anthropic Claude** or **OpenAI** (or free Google Gemini).\n"
        f"3. Paste your key and click **Save & Activate**.\n\n"
        f"Once connected, I can:\n"
        f"- 💻 Write complete, bug-free code solutions in C++, Python, Java, C\n"
        f"- 📐 Solve calculus, differential equations, and linear algebra step-by-step\n"
        f"- ⚡ Trace logic gates, K-maps, and CPU computer organization problems\n"
        f"- 🧪 Solve chemistry thermodynamics, spectroscopy, and molecular orbital theory numericals",
        ["🔑 Configure API Key", "🌿 Solve Dijkstra Problem", "⚡ Solve Booth's Multiplication", "🔲 Solve K-Map Example"]
    )


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    """
    Direct Academic Problem Solver Endpoint.
    Uses Anthropic Claude, OpenAI, or Google Gemini to solve user questions step-by-step.
    """
    settings = get_settings()
    user_query = payload.message.strip()
    provider = (payload.provider or "anthropic").lower()

    # Determine effective API key (request payload takes priority, then .env)
    effective_key = payload.api_key
    if not effective_key:
        if provider == "gemini" and settings.GEMINI_API_KEY:
            effective_key = settings.GEMINI_API_KEY
        elif provider == "openai" and settings.OPENAI_API_KEY:
            effective_key = settings.OPENAI_API_KEY
        elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            effective_key = settings.ANTHROPIC_API_KEY
        # If the requested provider had no key, fallback to available key in .env (preferring Gemini since it has free active quota)
        if not effective_key:
            if settings.GEMINI_API_KEY:
                effective_key = settings.GEMINI_API_KEY
                provider = "gemini"
            elif settings.OPENAI_API_KEY:
                effective_key = settings.OPENAI_API_KEY
                provider = "openai"
            elif settings.ANTHROPIC_API_KEY:
                effective_key = settings.ANTHROPIC_API_KEY
                provider = "anthropic"

    # Auto-detect key format if user pasted a Gemini / OpenAI / Anthropic key
    if effective_key:
        if effective_key.startswith("sk-ant-"):
            provider = "anthropic"
        elif effective_key.startswith("sk-") and not effective_key.startswith("sk-ant-"):
            provider = "openai"
        elif effective_key.startswith("AIza") or effective_key.startswith("AQ."):
            provider = "gemini"

    # Context enrichment for academic precision
    context = payload.context or {}
    student_name = context.get("name", "Student")
    course = context.get("course", "B.Tech")
    branch = context.get("branch", "CSE")
    semester = context.get("semester", 2)
    subject = context.get("subject", "")

    personalized_system_prompt = f"{SYSTEM_PROMPT}\n\nStudent Profile: {student_name}, Course: {course} {branch}, Semester {semester}. {f'Active Subject: {subject}.' if subject else ''}"

    messages_payload = []
    for msg in (payload.history or [])[-6:]:
        messages_payload.append({"role": msg.role, "content": msg.content})
    messages_payload.append({"role": "user", "content": user_query})

    # Execute with configured provider
    if effective_key and effective_key.strip() and "your-" not in effective_key:
        try:
            if provider == "openai":
                reply = await _call_openai(effective_key, payload.model or settings.OPENAI_MODEL, personalized_system_prompt, messages_payload)
                return ChatResponse(
                    reply=reply,
                    suggested_actions=["Explain next step", "Provide complete code", "Show practice problem"],
                    provider_used="OpenAI"
                )
            elif provider == "gemini":
                reply = await _call_gemini(effective_key, payload.model, personalized_system_prompt, messages_payload)
                return ChatResponse(
                    reply=reply,
                    suggested_actions=["Explain next step", "Provide complete code", "Show practice problem"],
                    provider_used="Google Gemini"
                )
            else:  # Default to Anthropic Claude
                reply = await _call_anthropic(effective_key, payload.model or settings.ANTHROPIC_EXTRACT_MODEL, personalized_system_prompt, messages_payload)
                return ChatResponse(
                    reply=reply,
                    suggested_actions=["Explain next step", "Provide complete code", "Show practice problem"],
                    provider_used="Anthropic Claude"
                )
        except HTTPException as http_err:
            if http_err.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                fallback_reply, actions = _smart_offline_solver(user_query, context)
                combined = (
                    "⚠️ **OpenAI Notice: Account Quota Exhausted ($0 Credit Balance)**\n\n"
                    "Your OpenAI API key is verified and recognized, but this OpenAI account currently has **$0 credits remaining**.\n\n"
                    "**To enable live GPT-4o solving:**\n"
                    "1. 💳 Add $5 prepaid credits at [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing).\n"
                    "2. 🆓 **OR** get a **100% Free Google Gemini API Key** (instant setup, no credit card needed) at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey), and paste it in **Settings (🔑)** above!\n\n"
                    "---\n\n"
                    f"{fallback_reply}"
                )
                return ChatResponse(
                    reply=combined,
                    suggested_actions=["🔑 Switch to Free Gemini Key", "Explain next step", "Show practice problem"],
                    provider_used="Offline Engine (OpenAI Quota $0)"
                )
            raise
        except Exception as e:
            logger.exception("AI provider call failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"{provider.capitalize()} API call failed: {str(e)}"
            )

    # If no API key is provided, use smart offline problem solver
    reply, actions = _smart_offline_solver(user_query, context)
    return ChatResponse(reply=reply, suggested_actions=actions, provider_used="Offline Smart Engine")

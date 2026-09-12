import json
import random

from app.config import GEMINI_API_KEY, GROQ_API_KEY, USE_REAL_LLM

QUIZ_PROMPT = (
    "Generate exactly 5 multiple-choice code comprehension questions to validate "
    "intermediate/advanced proficiency in {skill}. Return strict JSON: a list of "
    'objects each with "question", "options" (4 strings), "answer_index" (0-3).'
)

# Adaptive Diagnostic Engine (FR-05): 5-question code comprehension checks
# per claimed skill. Mock bank covers common skills; falls back to a generic
# template for anything unlisted. Swaps to real LLM generation (Groq/Llama 3)
# once GROQ_API_KEY is set.

MOCK_BANK: dict[str, list[dict]] = {
    "python": [
        {
            "question": "What does `[x for x in range(5) if x % 2 == 0]` evaluate to?",
            "options": ["[0, 2, 4]", "[1, 3, 5]", "[0, 1, 2, 3, 4]", "SyntaxError"],
            "answer_index": 0,
        },
        {
            "question": "What is the output of `print(type([]))`?",
            "options": ["<class 'list'>", "<class 'tuple'>", "<class 'array'>", "<class 'set'>"],
            "answer_index": 0,
        },
    ],
    "react": [
        {
            "question": "Which hook lets you run code after every render by default?",
            "options": ["useEffect", "useMemo", "useRef", "useContext"],
            "answer_index": 0,
        },
        {
            "question": "What triggers a React functional component to re-render?",
            "options": [
                "State or props changing",
                "Only prop changes",
                "Only a page refresh",
                "Nothing, it renders once",
            ],
            "answer_index": 0,
        },
    ],
}

GENERIC_TEMPLATE = [
    {
        "question": "Given a snippet using {skill}, which change would most likely break backward compatibility?",
        "options": [
            "Changing a public function's signature",
            "Adding a private helper function",
            "Renaming a local variable",
            "Adding a comment",
        ],
        "answer_index": 0,
    },
]


def _mock_quiz(skill: str) -> list[dict]:
    key = skill.strip().lower()
    bank = MOCK_BANK.get(key, [])
    questions = list(bank)
    while len(questions) < 5:
        template = GENERIC_TEMPLATE[len(questions) % len(GENERIC_TEMPLATE)]
        questions.append(
            {
                "question": template["question"].format(skill=skill),
                "options": template["options"],
                "answer_index": template["answer_index"],
            }
        )
    random.Random(key).shuffle(questions)
    return questions[:5]


async def _gemini_quiz(skill: str) -> list[dict]:
    import httpx

    prompt = QUIZ_PROMPT.format(skill=skill)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            params={"key": GEMINI_API_KEY},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            },
        )
        resp.raise_for_status()
        content = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(content)
        return parsed if isinstance(parsed, list) else parsed.get("questions", [])


async def _groq_quiz(skill: str) -> list[dict]:
    import httpx

    prompt = QUIZ_PROMPT.format(skill=skill)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": "llama3-70b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return parsed if isinstance(parsed, list) else parsed.get("questions", [])


async def generate_quiz(skill: str) -> list[dict]:
    if GEMINI_API_KEY:
        return await _gemini_quiz(skill)
    if USE_REAL_LLM:
        return await _groq_quiz(skill)
    return _mock_quiz(skill)

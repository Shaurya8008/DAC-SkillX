import os

from dotenv import load_dotenv

load_dotenv()

EMBEDDING_DIM = 1536

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# The engine runs against real APIs only once the matching key is present.
# Otherwise every service below falls back to a deterministic mock so the
# whole platform is demoable with zero external accounts.
#
# Gemini covers both embeddings and quiz generation (single key, two
# services); OpenAI/Groq stay as alternate providers if you'd rather split
# them. Gemini takes priority when both are set.
USE_REAL_EMBEDDINGS = bool(GEMINI_API_KEY or OPENAI_API_KEY)
USE_REAL_LLM = bool(GEMINI_API_KEY or GROQ_API_KEY)
USE_REAL_GITHUB = bool(GITHUB_TOKEN)

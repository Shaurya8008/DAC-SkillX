import os

EMBEDDING_DIM = 1536

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# The engine runs against real OpenAI/Groq/GitHub only once the matching key
# is present. Otherwise every service below falls back to a deterministic
# mock so the whole platform is demoable with zero external accounts.
USE_REAL_EMBEDDINGS = bool(OPENAI_API_KEY)
USE_REAL_LLM = bool(GROQ_API_KEY)
USE_REAL_GITHUB = bool(GITHUB_TOKEN)

import hashlib

from app.config import GITHUB_TOKEN, USE_REAL_GITHUB

MOCK_STACKS = [
    ["Python", "FastAPI"],
    ["TypeScript", "Next.js", "React"],
    ["Python", "PyTorch"],
    ["Go", "PostgreSQL"],
    ["JavaScript", "Node.js", "Express"],
]

MOCK_SKILLS_BY_STACK = {
    "Python": ["python", "backend"],
    "FastAPI": ["fastapi", "rest-apis"],
    "TypeScript": ["typescript", "frontend"],
    "Next.js": ["nextjs", "react"],
    "React": ["react"],
    "PyTorch": ["pytorch", "machine-learning"],
    "Go": ["go", "backend"],
    "PostgreSQL": ["postgresql", "sql"],
    "JavaScript": ["javascript"],
    "Node.js": ["nodejs", "backend"],
    "Express": ["express"],
}


def _mock_evaluate(github_handle: str, repo_name: str) -> dict:
    seed = int(hashlib.sha256(f"{github_handle}/{repo_name}".encode()).hexdigest(), 16)
    stack = MOCK_STACKS[seed % len(MOCK_STACKS)]
    complexity = round(4.0 + (seed % 6000) / 1000, 1)  # 4.0 - 10.0
    verified_skills = sorted({skill for lang in stack for skill in MOCK_SKILLS_BY_STACK.get(lang, [])})
    return {
        "complexity_score": complexity,
        "primary_stack": stack,
        "verified_skills": verified_skills,
    }


async def _real_evaluate(github_handle: str, repo_name: str) -> dict:
    import httpx

    headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"}
    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        repo_resp = await client.get(f"https://api.github.com/repos/{github_handle}/{repo_name}")
        repo_resp.raise_for_status()
        langs_resp = await client.get(f"https://api.github.com/repos/{github_handle}/{repo_name}/languages")
        langs_resp.raise_for_status()
        languages = list(langs_resp.json().keys())

        commits_resp = await client.get(
            f"https://api.github.com/repos/{github_handle}/{repo_name}/commits", params={"per_page": 30}
        )
        commit_count = len(commits_resp.json()) if commits_resp.status_code == 200 else 0

        readme_resp = await client.get(f"https://api.github.com/repos/{github_handle}/{repo_name}/readme")
        has_readme = readme_resp.status_code == 200

        complexity = round(min(10.0, 3 + commit_count / 10 + (2 if has_readme else 0) + len(languages) / 2), 1)
        verified_skills = sorted({lang.lower() for lang in languages})
        return {
            "complexity_score": complexity,
            "primary_stack": languages[:3],
            "verified_skills": verified_skills,
        }


async def evaluate_repo(github_handle: str, repo_name: str) -> dict:
    if USE_REAL_GITHUB:
        return await _real_evaluate(github_handle, repo_name)
    return _mock_evaluate(github_handle, repo_name)

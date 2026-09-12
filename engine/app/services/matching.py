from app.services.embeddings import cosine_similarity, embed

HARD_WEIGHT = 0.60
SEMANTIC_WEIGHT = 0.40


def hard_skill_overlap(student_skills: list[str], required_skills: list[str]) -> float:
    """S_hard = |K_student ∩ K_required| / |K_required|, as a 0-100 percentage."""
    required = {s.strip().lower() for s in required_skills if s.strip()}
    if not required:
        return 0.0
    student = {s.strip().lower() for s in student_skills if s.strip()}
    overlap = student & required
    return round(100 * len(overlap) / len(required), 2)


async def semantic_fit(student_bio: str, opportunity_description: str) -> float:
    """S_semantic = cosine(profile embedding, opportunity embedding), as 0-100."""
    student_vec = await embed(student_bio or "")
    opportunity_vec = await embed(opportunity_description or "")
    sim = cosine_similarity(student_vec, opportunity_vec)
    return round(max(0.0, sim) * 100, 2)


async def compute_match(
    student_skills: list[str],
    student_bio: str,
    opportunity_requirements: list[str],
    opportunity_description: str,
) -> dict:
    hard = hard_skill_overlap(student_skills, opportunity_requirements)
    semantic = await semantic_fit(student_bio, opportunity_description)
    total = round(HARD_WEIGHT * hard + SEMANTIC_WEIGHT * semantic, 2)
    return {
        "match_percentage": total,
        "hard_skill_overlap": hard,
        "semantic_fit": semantic,
    }

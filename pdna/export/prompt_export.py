from pdna.export.json_export import export_producer_json


def _score_label(value: int | None, low="low", mid="moderate", high="high") -> str:
    if value is None:
        return "unknown"
    if value <= 3:
        return low
    if value <= 6:
        return mid
    return high


def _build_dna_context(data: dict) -> str:
    dna = data.get("dna") or {}
    sonic = dna.get("sonic") or {}
    rhythmic = dna.get("rhythmic") or {}
    mixing = dna.get("mixing") or {}
    sampling = dna.get("sampling") or {}
    nuance = dna.get("nuance") or {}

    lines = []

    warmth = sonic.get("warmth")
    grit = sonic.get("grit")
    atmosphere = sonic.get("atmosphere")
    if any(v is not None for v in [warmth, grit, atmosphere]):
        lines.append(
            f"Sonic character — warmth: {_score_label(warmth, 'cold/dry', 'warm', 'very warm')} ({warmth}/10), "
            f"grit: {_score_label(grit, 'clean/polished', 'slightly rough', 'heavily gritty')} ({grit}/10), "
            f"atmosphere: {_score_label(atmosphere, 'sparse', 'textured', 'deeply atmospheric')} ({atmosphere}/10)"
        )

    swing = rhythmic.get("swing")
    grid = rhythmic.get("grid_precision")
    if swing is not None or grid is not None:
        lines.append(
            f"Rhythm — swing: {_score_label(swing, 'rigid/quantized', 'moderate swing', 'heavy humanized swing')} ({swing}/10), "
            f"grid precision: {_score_label(grid, 'loose/behind the beat', 'mixed', 'tight/on the grid')} ({grid}/10)"
        )

    traditions = sampling.get("source_traditions")
    if traditions:
        lines.append(f"Sampling traditions: {', '.join(traditions)}")

    clearance = sampling.get("clearance_rate")
    if clearance:
        lines.append(f"Sample clearance approach: {clearance}")

    producer_ear = nuance.get("producer_ear")
    if producer_ear:
        lines.append(f"\nProducer ear (how other producers hear this approach):\n{producer_ear}")

    warnings = data.get("warnings") or []
    major = next((w for w in warnings if w.get("severity") == "major"), None)
    if major:
        lines.append(f"Avoid: {major['description']}")

    directions = data.get("directions") or []
    for d in directions[:2]:
        lines.append(f"Channel: {d['direction_text'][:120]}")

    iterations = data.get("iterations") or []
    beat = next((i for i in iterations if i.get("target_context") == "beat_production"), None)
    if beat:
        lines.append(f"Session: {beat['prompt_text'][:200]}")

    return "\n".join(lines) if lines else ""


TEMPLATES = {
    "beat_making": (
        "Create an original beat inspired by the production logic of {name} — not a copy.\n\n"
        "Background:\n{notes}\n\n"
        "Scenes: {scenes}\n"
        "Active era: {active}\n\n"
        "DNA reference:\n{dna_context}\n\n"
        "Direction: Build something new that captures the underlying creative logic — "
        "the spatial feel, rhythmic philosophy, harmonic character, and emotional weight — "
        "without sampling, copying drum patterns, or reproducing signature sounds directly.\n\n"
        "Target model: {model}"
    ),
    "song_direction": (
        "Write a song direction memo inspired by {name}'s production approach.\n\n"
        "Context: {notes}\n\n"
        "DNA reference:\n{dna_context}\n\n"
        "Describe: tempo range, mood, instrumentation philosophy, vocal treatment, "
        "arrangement principles, and the emotional arc to pursue.\n"
        "Target: original work, not imitation.\n"
        "Target model: {model}"
    ),
    "daw_session": (
        "DAW session brief for a track in the spirit of {name}'s creative logic.\n\n"
        "Background: {notes}\n"
        "Scenes: {scenes}\n\n"
        "DNA reference:\n{dna_context}\n\n"
        "Session parameters to consider: BPM range, key mode, channel routing philosophy, "
        "drum design approach, synthesis vs. sample balance, mix reference points.\n"
        "Target model: {model}"
    ),
    "stem_generation": (
        "Stem generation prompt for a track inspired by {name}.\n\n"
        "Context: {notes}\n\n"
        "DNA reference:\n{dna_context}\n\n"
        "Generate stems: drums, bass, chords/harmony, texture/atmosphere, lead element, "
        "optional percussion layer. Each stem should reflect {name}'s spatial and "
        "tonal philosophy — not their exact sound.\n"
        "Target model: {model}"
    ),
    "artist_brief": (
        "Artist coaching brief: working with a producer in the spirit of {name}.\n\n"
        "Background: {notes}\n"
        "Scenes: {scenes}\n\n"
        "DNA reference:\n{dna_context}\n\n"
        "For the artist: describe what to bring to the session, how to deliver vocals/performance, "
        "what spatial and emotional energy the production will hold, and what NOT to expect "
        "(to avoid cliché imitation).\n"
        "Target model: {model}"
    ),
}


def generate_prompt(
    pdna_id: str,
    prompt_type: str,
    model_target: str,
    db_url: str,
) -> str:
    data = export_producer_json(pdna_id, db_url)
    if not data:
        return f"Producer {pdna_id} not found."

    template = TEMPLATES.get(prompt_type, TEMPLATES["beat_making"])
    active = f"{data.get('active_from', '?')}–{'now' if data.get('is_active') else data.get('active_to', '?')}"
    scenes = ", ".join(data.get("primary_scenes") or [])
    notes = data.get("notes") or "No notes available."
    dna_context = _build_dna_context(data)

    prompt = template.format(
        name=data["name"],
        notes=notes,
        scenes=scenes,
        active=active,
        dna_context=dna_context or "(DNA data not available)",
        model=model_target,
    )

    # Also save to prompt_exports table
    _save_prompt(data["pdna_id"], prompt_type, prompt, model_target, db_url)
    return prompt


def _save_prompt(pdna_id: str, prompt_type: str, prompt_text: str, model_target: str, db_url: str) -> None:
    from sqlalchemy import create_engine, text
    engine = create_engine(db_url)
    with engine.connect() as conn:
        with conn.begin():
            producer = conn.execute(
                text("SELECT id FROM producers WHERE pdna_id = :id"), {"id": pdna_id}
            ).fetchone()
            if producer:
                conn.execute(
                    text(
                        "INSERT INTO prompt_exports (producer_id, prompt_type, prompt_text, model_target) "
                        "VALUES (:pid, :ptype, :ptext, :model)"
                    ),
                    {"pid": producer[0], "ptype": prompt_type, "ptext": prompt_text, "model": model_target},
                )

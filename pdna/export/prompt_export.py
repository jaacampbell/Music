from pdna.export.json_export import export_producer_json


TEMPLATES = {
    "beat_making": (
        "Create an original beat inspired by the production logic of {name} — not a copy.\n\n"
        "DNA context (for reference only):\n"
        "{notes}\n\n"
        "Scenes: {scenes}\n"
        "Active era: {active}\n\n"
        "Direction: Build something new that captures the underlying creative logic: "
        "the spatial feel, rhythmic philosophy, harmonic character, and emotional weight — "
        "without sampling, copying drum patterns, or reproducing signature sounds directly.\n\n"
        "Target model: {model}"
    ),
    "song_direction": (
        "Write a song direction memo inspired by {name}'s production approach.\n\n"
        "Context: {notes}\n\n"
        "Describe: tempo range, mood, instrumentation philosophy, vocal treatment, "
        "arrangement principles, and the emotional arc to pursue.\n"
        "Target: original work, not imitation.\n"
        "Target model: {model}"
    ),
    "daw_session": (
        "DAW session brief for a track in the spirit of {name}'s creative logic.\n\n"
        "Background: {notes}\n"
        "Scenes: {scenes}\n\n"
        "Session parameters to consider: BPM range, key mode, channel routing philosophy, "
        "drum design approach, synthesis vs. sample balance, mix reference points.\n"
        "Target model: {model}"
    ),
    "stem_generation": (
        "Stem generation prompt for a track inspired by {name}.\n\n"
        "Context: {notes}\n\n"
        "Generate stems: drums, bass, chords/harmony, texture/atmosphere, lead element, "
        "optional percussion layer. Each stem should reflect {name}'s spatial and "
        "tonal philosophy — not their exact sound.\n"
        "Target model: {model}"
    ),
    "artist_brief": (
        "Artist coaching brief: working with a producer in the spirit of {name}.\n\n"
        "Background: {notes}\n"
        "Scenes: {scenes}\n\n"
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

    prompt = template.format(
        name=data["name"],
        notes=notes,
        scenes=scenes,
        active=active,
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

"""CPU-only Stem Agent entrypoint.

Phase 14 mounts optional JC Film Studio CUDA/video dependencies; they are not
available in CPU workers. Reuse Phase 12's durable-job routes and attach
authenticated cleanup without requiring the film GPU package.
"""
import agent_phase12 as phase12
import agent_cleanup

app = phase12.app

"""Shared-GPU idle safety tests: python -m unittest discover -s services/separator -p test_film_activity.py"""
import unittest
from film_activity import film_gpu_occupancy

class FilmOccupancyTests(unittest.TestCase):
    def test_idle_only_when_every_job_is_terminal(self):
        self.assertEqual(film_gpu_occupancy({"a":{"status":"completed"}},{"b":{"status":"failed"}}),
                         {"busy":False,"activeJobs":0})

    def test_pending_generation_blocks_shutdown(self):
        self.assertEqual(film_gpu_occupancy({"a":{"status":"queued"}},{}),
                         {"busy":True,"activeJobs":1})

    def test_active_editor_blocks_shutdown(self):
        self.assertEqual(film_gpu_occupancy({},{"a":{"status":"processing"}}),
                         {"busy":True,"activeJobs":1})

    def test_unknown_state_blocks_shutdown(self):
        self.assertTrue(film_gpu_occupancy({"a":{}},{})["busy"])

if __name__ == "__main__":
    unittest.main()

"""Prevent the controller from publishing states rejected by the database.

This test validates the upgrade path without requesting GPU startup or provider updates.
"""
from __future__ import annotations
import pathlib
import sys
import unittest
from unittest.mock import MagicMock

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import controller


class ComputeUpgradeStateTest(unittest.TestCase):
    def test_upgrade_uses_permitted_state_when_pod_is_exited(self):
        config = MagicMock()
        config.bootstrap_only = False
        config.pod_id = "approved-test-pod"
        config.auto_start = False
        config.auto_start_requested = False
        config.auto_stop = False
        config.idle_seconds = 600
        instance = controller.Controller(config)
        instance.load_jobs = lambda: []
        instance.load_compute_requests = lambda: []
        instance.load_workers = lambda: []
        instance.provider_state = lambda: {"desiredStatus": "EXITED", "imageName": "older"}
        instance.maybe_upgrade_provider = lambda _pod: True
        calls = []
        instance.publish = lambda state, **kwargs: calls.append((state, kwargs))
        instance.cycle()
        self.assertEqual(calls[0][0], "standby")
        self.assertEqual(calls[0][1]["action"], "update")

    def test_upgrade_uses_permitted_state_when_running(self):
        config = MagicMock()
        config.bootstrap_only = False
        config.pod_id = "approved-test-pod"
        config.auto_start = False
        config.auto_start_requested = False
        config.auto_stop = False
        config.idle_seconds = 600
        instance = controller.Controller(config)
        instance.load_jobs = lambda: []
        instance.load_compute_requests = lambda: []
        instance.load_workers = lambda: []
        instance.provider_state = lambda: {"desiredStatus": "RUNNING", "imageName": "older"}
        instance.maybe_upgrade_provider = lambda _pod: True
        calls = []
        instance.publish = lambda state, **kwargs: calls.append((state, kwargs))
        instance.cycle()
        self.assertEqual(calls[0][0], "waking")
        self.assertEqual(calls[0][1]["action"], "update")


if __name__ == "__main__":
    unittest.main()

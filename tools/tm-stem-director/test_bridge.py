"""Minimal local bridge contract tests."""
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from bridge_server import Handler, HOST

class BridgeTests(unittest.TestCase):
    def test_loopback_only(self):
        self.assertEqual(HOST, "127.0.0.1")

    def test_worker_exists(self):
        self.assertTrue(Path(__file__).with_name("separate_local.py").is_file())

if __name__ == "__main__":
    unittest.main()

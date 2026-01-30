#!/usr/bin/env python3
"""Run a single retrain using the backend AudioService and print metrics.

Usage:
  python tools/run_retrain.py
"""
import sys
import os
import traceback
import json
from datetime import datetime


def main():
    cwd = os.getcwd()
    # Ensure repo root and backend/ are on path so imports like `utils.*` resolve
    if cwd not in sys.path:
        sys.path.insert(0, cwd)
    backend_path = os.path.join(cwd, 'backend')
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    try:
        from backend.services.audio_service import AudioService
    except Exception as e:
        print('ERROR: could not import AudioService:', e)
        traceback.print_exc()
        return 2

    try:
        svc = AudioService()
    except Exception as e:
        print('ERROR: could not instantiate AudioService:', e)
        traceback.print_exc()
        return 3

    try:
        print('Retrain run started at', datetime.now().isoformat())
        try:
            stats_before = svc.get_training_stats()
        except Exception:
            stats_before = None
        print('Stats before:', json.dumps(stats_before, default=str, indent=2))

        # Call retrain
        retrain_result = None
        try:
            retrain_result = svc.retrain_model()
        except Exception as e:
            print('ERROR during retrain_model():', e)
            traceback.print_exc()

        print('Retrain result:', retrain_result)

        try:
            stats_after = svc.get_training_stats()
        except Exception:
            stats_after = None
        print('Stats after:', json.dumps(stats_after, default=str, indent=2))

        print('Retrain run finished at', datetime.now().isoformat())
        return 0

    except Exception as e:
        print('Unexpected error running retrain:', e)
        traceback.print_exc()
        return 4


if __name__ == '__main__':
    sys.exit(main())

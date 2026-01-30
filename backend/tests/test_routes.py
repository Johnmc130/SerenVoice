import pytest
import os
import sys

# Ensure backend root is on sys.path so tests can import `app`
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app


def test_app_routes_registered():
    app = create_app()
    rules = sorted({rule.rule for rule in app.url_map.iter_rules() if rule.endpoint != 'static'})

    expected_prefixes = [
        '/api/health',
        '/api/docs',
        '/api/auth',
        '/api/usuarios',
        '/admin',
        '/api/audio',
        '/api/contact',
        '/api/reportes'
    ]

    missing = []
    for prefix in expected_prefixes:
        if not any(r == prefix or r.startswith(prefix + '/') or r.startswith(prefix + '?') for r in rules):
            missing.append(prefix)

    assert not missing, f"Rutas faltantes o con prefijo distinto: {missing}. Reglas encontradas: {rules[:20]}"

from app import create_app
import os
import sys
from database.config import Config

# Deshabilitar buffering para que los logs aparezcan en tiempo real
os.environ['PYTHONUNBUFFERED'] = '1'
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(line_buffering=True)

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = Config.DEBUG

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=False   # 🔥 NECESARIO PARA EVITAR EL CRASH
    )

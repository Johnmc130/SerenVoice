import os
import sys
import json
import datetime
import traceback

try:
    import requests
except Exception:
    print("The 'requests' package is required. Install with: pip install requests")
    sys.exit(1)


def main():
    key = os.getenv("GROQ_API_KEY")
    log_path = os.path.join(os.path.dirname(__file__), "groq_debug.log")
    url = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": "hola"}],
    }

    with open(log_path, "a", encoding="utf-8") as f:
        f.write('\n=== {} UTC ===\n'.format(datetime.datetime.utcnow().isoformat()))
        f.write(f"GROQ_API_KEY present: {bool(key)}\n")
        if not key:
            f.write("ERROR: GROQ_API_KEY not set\n")
            print("GROQ_API_KEY not set. Check environment variables. See log for details.")
            return 1

        try:
            resp = requests.post(
                url,
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload,
                timeout=30,
            )
            f.write(f"Status: {resp.status_code}\n")
            f.write("Headers:\n")
            for hk, hv in resp.headers.items():
                f.write(f"{hk}: {hv}\n")
            f.write("Body:\n")
            try:
                # try pretty json
                parsed = resp.json()
                f.write(json.dumps(parsed, indent=2, ensure_ascii=False) + "\n")
            except Exception:
                f.write(resp.text + "\n")
            print("Request complete — response logged to", log_path)
            return 0
        except Exception:
            f.write("Exception:\n")
            f.write(traceback.format_exc() + "\n")
            print("Exception during request — see", log_path)
            return 2


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Local static server + HackMe API proxy (avoids browser CORS during dev)."""

from __future__ import annotations

import json
import socket
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 8765

PROXY_MAP = {
    "/proxy/hackme/metrics": "https://hackme.tech/pool/api/global/metrics",
    "/proxy/hackme/work-stats": "https://hackme.tech/pool/coordinator/api/work/stats",
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/healthz":
            self._health()
            return
        if path in PROXY_MAP:
            self._proxy(PROXY_MAP[path])
            return
        super().do_GET()

    def _health(self):
        payload = json.dumps({"ok": True, "root": str(ROOT)}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _proxy(self, upstream: str):
        try:
            req = urllib.request.Request(upstream, headers={"User-Agent": "useful-pow-index/dev"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                body = resp.read()
                self.send_response(200)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.send_header("Cache-Control", "no-store")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(body)
        except (urllib.error.URLError, TimeoutError) as exc:
            payload = json.dumps({"ok": False, "error": str(exc)}).encode()
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(payload)

    def log_message(self, fmt, *args):
        if str(args[0]).startswith("GET /proxy/"):
            print(f"[proxy] {args[0]}")
        elif str(args[0]).startswith("GET /healthz"):
            return
        else:
            super().log_message(fmt, *args)


def pick_port(start: int = DEFAULT_PORT) -> int:
    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise SystemExit(f"No free port in range {start}-{start + 19}")


if __name__ == "__main__":
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.bind(("127.0.0.1", port))
        except OSError:
            port = pick_port(DEFAULT_PORT + 1)
            print(f"Port {DEFAULT_PORT} busy — using {port}", file=sys.stderr)

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Serving {ROOT} at http://127.0.0.1:{port}/", flush=True)
    print("Proxy: /proxy/hackme/metrics · /proxy/hackme/work-stats · /healthz", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.", flush=True)

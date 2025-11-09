#!/usr/bin/env python3
# servidor_http8080_zip.py — Sirve tu web desde ZIP o carpeta + Proxy /api/* (sin Flask)
# Uso:
#   py servidor_http8080_zip.py --zip "C:\ruta\PaginaSemaforos.zip"
#   # o
#   py servidor_http8080_zip.py --dir "C:\ruta\PaginaSemaforos"
#
# También puedes usar variables de entorno:
#   set ESP32_BASE=http://192.168.1.50
#   set STATIC_ZIP=C:\ruta\PaginaSemaforos.zip
#   set STATIC_DIR=C:\ruta\PaginaSemaforos
#
# Endpoints locales:
#   GET  /               → index.html del ZIP/carpeta
#   GET  /<archivo>      → estáticos del ZIP/carpeta
#   GET  /api/status     → proxy a ESP32 /api/status
#   POST /api/start      → proxy a ESP32 /api/start (GET al ESP32)
#   POST /api/stop       → proxy a ESP32 /api/stop  (GET al ESP32)

import os, sys, json, urllib.request, urllib.error, mimetypes, zipfile, io, posixpath
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

HOST = "0.0.0.0"
PORT = 8080
ESP32_BASE = os.environ.get("ESP32_BASE", "http://192.168.4.1")
STATIC_ZIP = os.environ.get("STATIC_ZIP")
STATIC_DIR = os.environ.get("STATIC_DIR")

# --- CLI ---
import argparse
ap = argparse.ArgumentParser(description="HTTP 8080: web desde ZIP/carpeta + proxy /api/* → ESP32")
ap.add_argument("--zip", dest="zip_path", help="Ruta a ZIP con la web (index.html adentro)")
ap.add_argument("--dir", dest="dir_path", help="Ruta a carpeta con la web (index.html adentro)")
ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", PORT)), help="Puerto (default 8080)")
args = ap.parse_args()
PORT = args.port
if args.zip_path: STATIC_ZIP = args.zip_path
if args.dir_path: STATIC_DIR = args.dir_path

# --- Utilidades ---
def esp32_get(path, timeout=3):
    url = ESP32_BASE + path
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
        ctype = resp.headers.get("Content-Type","application/json; charset=utf-8")
        return data, ctype, resp.status

def guess_type(path):
    ctype, enc = mimetypes.guess_type(path)
    if not ctype:
        if path.endswith(".js"): ctype = "application/javascript"
        elif path.endswith(".css"): ctype = "text/css; charset=utf-8"
        else: ctype = "application/octet-stream"
    return ctype

def norm_web_path(url_path:str)->str:
    p = url_path.split('?',1)[0].split('#',1)[0]
    p = p.lstrip('/')
    p = posixpath.normpath(p)
    if p == ".": p = ""
    return p

# --- Cargadores de estáticos ---
ZIP = None
ZIP_INDEX = None
if STATIC_ZIP and os.path.isfile(STATIC_ZIP):
    ZIP = zipfile.ZipFile(STATIC_ZIP, 'r')
    znames = {name: name for name in ZIP.namelist()}
    for cand in ("index.html", "index.htm", "Index.html", "INDEX.HTML"):
        if cand in znames:
            ZIP_INDEX = znames[cand]
            break

def read_from_zip(web_path:str):
    if ZIP is None:
        return None, None, 404
    if web_path == "" or web_path.endswith("/"):
        target = ZIP_INDEX or "index.html"
    else:
        target = web_path
    target = target.replace("\\", "/")
    candidates = [target]
    if not target and ZIP_INDEX: candidates.append(ZIP_INDEX)
    for cand in candidates:
        try:
            with ZIP.open(cand, 'r') as fh:
                data = fh.read()
                return data, guess_type(cand), 200
        except KeyError:
            continue
    return None, None, 404

def read_from_dir(base:str, web_path:str):
    if not base: return None, None, 404
    rel = web_path or ""
    if rel.endswith("/") or rel == "":
        rel = "index.html"
    rel = rel.replace("\\", "/")
    fs_path = os.path.normpath(os.path.join(base, rel))
    base_abs = os.path.abspath(base)
    fs_abs = os.path.abspath(fs_path)
    if not fs_abs.startswith(base_abs):
        return None, None, 403
    if not os.path.isfile(fs_abs):
        return None, None, 404
    with open(fs_abs, "rb") as f:
        data = f.read()
    return data, guess_type(fs_abs), 200

class Handler(BaseHTTPRequestHandler):
    server_version = "ZipStaticProxy/1.0"
    sys_version = ""

    def _send(self, status:int, body:bytes, ctype="application/json; charset=utf-8"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            try:
                data, ctype, code = esp32_get("/api/status")
                try:
                    j = json.loads(data.decode("utf-8", "ignore"))
                except Exception:
                    j = {"ok": True, "raw": data.decode("utf-8","ignore")}
                return self._send(code, json.dumps(j).encode("utf-8"))
            except urllib.error.URLError as e:
                j = {"ok": False, "error": str(e), "hint": "Verifica conexión al ESP32 o variable ESP32_BASE."}
                return self._send(502, json.dumps(j).encode("utf-8"))

        web_path = norm_web_path(self.path)
        if ZIP:
            data, ctype, code = read_from_zip(web_path)
            if code == 200:
                return self._send(200, data, ctype)
        if STATIC_DIR and os.path.isdir(STATIC_DIR):
            data, ctype, code = read_from_dir(STATIC_DIR, web_path)
            if code == 200:
                return self._send(200, data, ctype)

        if web_path in ("", "index.html"):
            html = f"""<!doctype html><meta charset='utf-8'><title>Servidor 8080</title>
            <style>body{{font-family:system-ui;margin:24px}}</style>
            <h1>Servidor 8080</h1>
            <p>No se configuró ZIP o carpeta. Usa <code>--zip</code> / <code>--dir</code> o variables de entorno.</p>
            <pre>ESP32_BASE = {ESP32_BASE}</pre>
            <p>API: <a href="/api/status">/api/status</a></p>
            """
            return self._send(200, html.encode("utf-8"), "text/html; charset=utf-8")

        return self._send(404, json.dumps({"ok":False,"error":"Not found"}).encode("utf-8"))

    def do_POST(self):
        if self.path == "/api/start":
            try:
                data, ctype, code = esp32_get("/api/start")
                try:
                    j = json.loads(data.decode("utf-8","ignore"))
                except Exception:
                    j = {"ok": True, "raw": data.decode("utf-8","ignore")}
                return self._send(code, json.dumps(j).encode("utf-8"))
            except urllib.error.URLError as e:
                j = {"ok": False, "error": str(e), "hint": "No se pudo contactar al ESP32 (/api/start)."}
                return self._send(502, json.dumps(j).encode("utf-8"))

        if self.path == "/api/stop":
            try:
                data, ctype, code = esp32_get("/api/stop")
                try:
                    j = json.loads(data.decode("utf-8","ignore"))
                except Exception:
                    j = {"ok": True, "raw": data.decode("utf-8","ignore")}
                return self._send(code, json.dumps(j).encode("utf-8"))
            except urllib.error.URLError as e:
                j = {"ok": False, "error": str(e), "hint": "No se pudo contactar al ESP32 (/api/stop)."}
                return self._send(502, json.dumps(j).encode("utf-8"))

        return self._send(404, json.dumps({"ok":False,"error":"Not found"}).encode("utf-8"))

def run():
    mode = "panel embebido"
    if STATIC_ZIP and os.path.isfile(STATIC_ZIP): mode = f"ZIP: {STATIC_ZIP}"
    elif STATIC_DIR and os.path.isdir(STATIC_DIR): mode = f"DIR: {STATIC_DIR}"
    addr = (HOST, PORT)
    httpd = ThreadingHTTPServer(addr, Handler)
    print(f"[OK] Servidor en http://{HOST}:{PORT}")
    print(f"     Modo estáticos: {mode}")
    print(f"     ESP32_BASE: {ESP32_BASE}")
    print(f"     API locales: /api/status (GET), /api/start (POST), /api/stop (POST)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Bye] Cerrando...")
    finally:
        httpd.server_close()

if __name__ == "__main__":
    run()

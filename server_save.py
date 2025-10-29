#!/usr/bin/env python3
"""
Small local server to accept patient JSON and save to disk.
Run on the machine that will host the shared folder. Example:

  set PV_SAVE_DIR=C:\pacientes_guardados
  python server_save.py

The server listens on 0.0.0.0:5000 by default and exposes POST /save-patient
Expected JSON body: { "name": "Patient name", "data": { ... } }
Optional environment variables:
  PV_SAVE_DIR  - destination folder (default: C:\\PV-one-saved)
  PV_SAVE_PORT - port (default: 5000)
  PV_SAVE_TOKEN - if set, requests must include header X-SAVE-TOKEN with this value

Security: run this only on a trusted LAN or restrict with firewall. Do NOT expose to the internet.
"""
from flask import Flask, request, jsonify
import os
import time
import json
import re
from pathlib import Path
import base64

SAVE_DIR = os.environ.get('PV_SAVE_DIR', r'C:\PV-one-saved')
PORT = int(os.environ.get('PV_SAVE_PORT', '5000'))
TOKEN = os.environ.get('PV_SAVE_TOKEN')

app = Flask(__name__)

_fname_re = re.compile(r'[^A-Za-z0-9._ \-]')

def sanitize_filename(name: str) -> str:
    name = name or 'patient'
    s = _fname_re.sub('_', name)
    return s[:180]

def b64_encode_unicode(s: str) -> str:
    try:
        return base64.b64encode(s.encode('utf-8')).decode('ascii')
    except Exception:
        return ''

@app.route('/save-patient', methods=['POST'])
def save_patient():
    # Optional token check
    if TOKEN:
        tok = request.headers.get('X-SAVE-TOKEN') or request.args.get('token')
        if tok != TOKEN:
            return jsonify(ok=False, error='Unauthorized'), 401
    try:
        payload = request.get_json(force=True)
    except Exception as e:
        return jsonify(ok=False, error=f'Invalid JSON: {e}'), 400

    name = payload.get('name') if isinstance(payload, dict) else None
    data = payload.get('data') if isinstance(payload, dict) else payload
    if not isinstance(data, dict):
        # accept raw structures
        data = payload
    basename = sanitize_filename(name or (data.get('name') if isinstance(data, dict) else 'patient'))
    # Use the patient name (sanitized) as filename so it matches the patient name requested
    filename = f"{basename}.json"

    try:
        Path(SAVE_DIR).mkdir(parents=True, exist_ok=True)
        out_path = Path(SAVE_DIR) / filename
        with out_path.open('w', encoding='utf-8') as fh:
            json.dump({'name': name, 'data': data}, fh, indent=2, ensure_ascii=False)
        # Also append/update companion CSV (filename, mtime, name) — do not store full base64 state
        try:
            csv_path = Path(SAVE_DIR) / 'pv_one_patients.csv'
            line = '"%s",%d,"%s"\n' % (filename, int(time.time()*1000), (name or '').replace('"','""'))
            if not csv_path.exists():
                with csv_path.open('w', encoding='utf-8') as cf:
                    cf.write('filename,mtime,name\n')
                    cf.write(line)
            else:
                # read existing, filter out same filename, prepend new line
                try:
                    txt = csv_path.read_text(encoding='utf-8')
                    lines = [l for l in txt.splitlines() if l.strip()]
                    hdr = lines[0] if lines else 'filename,mtime,name'
                    rest = [l for l in lines[1:] if not l.startswith('"%s"'%filename)]
                    with csv_path.open('w', encoding='utf-8') as cf:
                        cf.write(hdr+'\n')
                        cf.write(line)
                        cf.write('\n'.join(rest))
                except Exception:
                    # fallback append
                    with csv_path.open('a', encoding='utf-8') as cf:
                        cf.write(line)
        except Exception as e:
            print('CSV update failed:', e)
        return jsonify(ok=True, filename=filename, path=str(out_path))
    except Exception as e:
        return jsonify(ok=False, error=str(e)), 500

if __name__ == '__main__':
    print(f"Starting PV-One save server on 0.0.0.0:{PORT}, saving to {SAVE_DIR}")
    print("If you set PV_SAVE_TOKEN, clients must include header X-SAVE-TOKEN")
    app.run(host='0.0.0.0', port=PORT)

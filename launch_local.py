"""Create a local environment, start SaviPola, and open the user's browser."""
import argparse
import hashlib
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import venv
import webbrowser

ROOT = Path(__file__).resolve().parent


def environment_python():
    directory = ROOT / '.venv'
    executable = directory / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    if not executable.exists():
        print('Preparing the local Python environment...', flush=True)
        venv.EnvBuilder(with_pip=True).create(directory)
    requirements = ROOT / 'requirements.txt'
    digest = hashlib.sha256(requirements.read_bytes()).hexdigest()
    marker = directory / '.savipola-requirements'
    if not marker.exists() or marker.read_text().strip() != digest:
        print('Installing dependencies. Internet is needed on the first launch.', flush=True)
        subprocess.run([str(executable), '-m', 'pip', 'install', '-r', str(requirements)], check=True)
        marker.write_text(digest)
    return executable


def free_port():
    for number in range(8000, 8020):
        with socket.socket() as sock:
            try:
                sock.bind(('127.0.0.1', number))
            except OSError:
                continue
            return number
    raise RuntimeError('Ports 8000-8019 are busy. Close another local server and try again.')


def serve(executable, open_browser=True):
    port = free_port()
    url = f'http://127.0.0.1:{port}'
    environment = os.environ.copy()
    # This launcher always uses the local SQLite database, not a configured cloud DB.
    environment.pop('DB_HOST', None)
    environment['PYTHONUNBUFFERED'] = '1'
    process = subprocess.Popen([str(executable), '-m', 'uvicorn', 'app:app',
                                '--host', '127.0.0.1', '--port', str(port)],
                               cwd=ROOT, env=environment)
    local_http = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        deadline = time.monotonic() + 40
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError('The app stopped during startup. Read the server error above.')
            try:
                with local_http.open(url + '/healthz', timeout=0.5) as response:
                    if response.status == 200:
                        break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(0.25)
        else:
            raise RuntimeError('The app did not become ready within 40 seconds.')
        print(f'\nSaviPola is ready: {url}\nKeep this window open. Press Ctrl+C to stop.\n', flush=True)
        if open_browser:
            webbrowser.open(url)
        return process.wait()
    except KeyboardInterrupt:
        print('\nStopping SaviPola...', flush=True)
        return 0
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-browser', action='store_true', help='Print the URL without opening a browser')
    arguments = parser.parse_args()
    if sys.version_info < (3, 10):
        raise RuntimeError('Python 3.10 or newer is required.')
    return serve(environment_python(), open_browser=not arguments.no_browser)


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f'\nCould not start SaviPola: {error}', file=sys.stderr)
        raise SystemExit(1)

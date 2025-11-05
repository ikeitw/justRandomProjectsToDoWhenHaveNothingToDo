import threading, socket, sys, time
import webview
from uvicorn import Config, Server
from backend.main import app  # FastAPI

def find_free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    _addr, port = s.getsockname()
    s.close()
    return port

def run_server(port, ready):
    config = Config(app=app, host="127.0.0.1", port=port, log_level="info")
    server = Server(config)
    def _start():
        ready["server"] = server
        server.run()
    t = threading.Thread(target=_start, daemon=True)
    t.start()
    while not getattr(server, "started", False):
        time.sleep(0.05)

def main():
    port = find_free_port()
    ready = {}
    run_server(port, ready)
    webview.create_window("NetGlass – Live Monitor", f"http://127.0.0.1:{port}/", width=1280, height=840)
    webview.start()
    srv = ready.get("server")
    if srv is not None:
        srv.should_exit = True

if __name__ == "__main__":
    sys.exit(main())

import threading
import socket
import webview
import uvicorn
import time
import sys
from contextlib import closing

def find_free_port():
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

def run_server(port: int):
    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=port,
        reload=False,
        log_level="warning",
    )

if __name__ == "__main__":
    port = find_free_port()
    t = threading.Thread(target=run_server, args=(port,), daemon=True)
    t.start()
    time.sleep(0.7)

    window = webview.create_window(
        title="OSINT Recon (Reworked)",
        url=f"http://127.0.0.1:{port}/",
        width=1200,
        height=780,
        resizable=True,
        easy_drag=False,
        confirm_close=True,
        background_color="#0e1120",
    )
    try:
        webview.start()
    except KeyboardInterrupt:
        sys.exit(0)

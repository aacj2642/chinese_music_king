import http.server
import socketserver
import webbrowser
import sys

def main():
    port = 8000
    httpd = None
    for p in range(8000, 8050):
        try:
            handler = http.server.SimpleHTTPRequestHandler
            httpd = socketserver.TCPServer(("", p), handler)
            port = p
            break
        except OSError:
            continue

    if not httpd:
        print("無法綁定連接埠 (8000-8050 皆被佔用)")
        sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 60, flush=True)
    print("  國樂之王 · 隨機播放伺服器已啟動！", flush=True)
    print(f"  請於瀏覽器開啟：{url}", flush=True)
    print("  (關閉此視窗即可停止伺服器)", flush=True)
    print("=" * 60, flush=True)

    webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n伺服器已停止。")

if __name__ == "__main__":
    main()


import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def translate_path(self, path):
        # Limpiar ruta y query parameters
        clean_path = path.split('?')[0].rstrip('/')
        
        if clean_path == '/admin':
            path = '/admin.html'
        elif clean_path == '' or clean_path == '/':
            path = '/index.html'
            
        return super().translate_path(path)

if __name__ == '__main__':
    # Permitir reutilización inmediata de la dirección
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
            print(f"Servidor ODA Legal iniciado en http://localhost:{PORT}")
            print(f"Directorio servido: {DIRECTORY}")
            print(f"Acceso Panel Admin: http://localhost:{PORT}/admin.html o http://localhost:{PORT}/admin")
            sys.stdout.flush()
            httpd.serve_forever()
    except Exception as e:
        print(f"Error al iniciar servidor: {e}")

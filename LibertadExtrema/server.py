# ==============================================================================
# LIBERTAD EXTREMA - REST API & STATIC WEB SERVER (PYTHON 3)
# ==============================================================================

import os
import sys
import json
import re
import urllib.parse
import secrets
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import database

PORT = 8080
SESSIONS = set()

def get_digits9(s):
    if not s:
        return ''
    digits = re.sub(r'\D', '', str(s))
    return digits[-9:] if len(digits) >= 9 else digits

def format_spanish_phone(phone):
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    norm = re.sub(r'^(\+34|0034)', '', cleaned)
    if not re.match(r'^[67]\d{8}$', norm):
        raise ValueError('Introduce un número de teléfono móvil válido en España (9 dígitos comenzando por 6 o 7).')
    return f"+34 {norm[:3]} {norm[3:6]} {norm[6:]}"

class LibertadExtremaHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Clean custom logging
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} -> {args[1]}\n")

    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def is_authenticated(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            return token in SESSIONS
        return False

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode('utf-8')
        return json.loads(body)

    # --------------------------------------------------------------------------
    # GET REQUEST HANDLERS
    # --------------------------------------------------------------------------
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query = urllib.parse.parse_qs(parsed_path.query)

        if path.startswith('/api/'):
            return self.handle_api_get(path, query)

        # Serve static files
        return self.handle_static_file(path)

    def handle_api_get(self, path, query):
        conn = database.get_db()
        cursor = conn.cursor()

        try:
            if path == '/api/routes':
                status_filter = query.get('status', ['todas'])[0]
                if status_filter != 'todas':
                    cursor.execute("SELECT * FROM routes WHERE status = ? ORDER BY date ASC;", (status_filter,))
                else:
                    cursor.execute("SELECT * FROM routes ORDER BY date ASC;")

                routes_rows = cursor.fetchall()
                result = []

                for r in routes_rows:
                    route_dict = dict(r)
                    route_id = route_dict['id']

                    # Get active subroutes
                    cursor.execute("SELECT * FROM sub_routes WHERE route_id = ? ORDER BY day_number ASC;", (route_id,))
                    route_dict['subRoutes'] = [dict(sr) for sr in cursor.fetchall()]

                    # Get riders
                    cursor.execute("SELECT * FROM riders WHERE route_id = ?;", (route_id,))
                    route_dict['riders'] = [dict(rider) for rider in cursor.fetchall()]

                    # Get media
                    cursor.execute("SELECT * FROM route_media WHERE route_id = ?;", (route_id,))
                    media_rows = cursor.fetchall()
                    photos = [{'id': m['id'], 'url': m['url'], 'caption': m['caption_or_title']} for m in media_rows if m['media_type'] == 'photo']
                    videos = [{'id': m['id'], 'embedUrl': m['url'], 'title': m['caption_or_title']} for m in media_rows if m['media_type'] == 'video']
                    route_dict['media'] = {'photos': photos, 'videos': videos}

                    result.append(route_dict)

                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))

            elif path.startswith('/api/routes/'):
                route_id = path.replace('/api/routes/', '')
                cursor.execute("SELECT * FROM routes WHERE id = ?;", (route_id,))
                r = cursor.fetchone()
                if not r:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({'error': 'Ruta no encontrada'}).encode('utf-8'))
                    return

                route_dict = dict(r)
                cursor.execute("SELECT * FROM sub_routes WHERE route_id = ? ORDER BY day_number ASC;", (route_id,))
                route_dict['subRoutes'] = [dict(sr) for sr in cursor.fetchall()]

                cursor.execute("SELECT * FROM riders WHERE route_id = ?;", (route_id,))
                route_dict['riders'] = [dict(rider) for rider in cursor.fetchall()]

                cursor.execute("SELECT * FROM route_media WHERE route_id = ?;", (route_id,))
                media_rows = cursor.fetchall()
                photos = [{'id': m['id'], 'url': m['url'], 'caption': m['caption_or_title']} for m in media_rows if m['media_type'] == 'photo']
                videos = [{'id': m['id'], 'embedUrl': m['url'], 'title': m['caption_or_title']} for m in media_rows if m['media_type'] == 'video']
                route_dict['media'] = {'photos': photos, 'videos': videos}

                self._set_headers(200)
                self.wfile.write(json.dumps(route_dict).encode('utf-8'))

            elif path == '/api/events':
                category_filter = query.get('category', ['todas'])[0]
                if category_filter != 'todas':
                    cursor.execute("SELECT * FROM events WHERE LOWER(category) = ? ORDER BY created_at DESC;", (category_filter.lower(),))
                else:
                    cursor.execute("SELECT * FROM events ORDER BY created_at DESC;")

                events_rows = [dict(e) for e in cursor.fetchall()]
                self._set_headers(200)
                self.wfile.write(json.dumps(events_rows).encode('utf-8'))

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({'error': 'Endpoint no encontrado'}).encode('utf-8'))

        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # POST REQUEST HANDLERS
    # --------------------------------------------------------------------------
    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        try:
            body = self.read_json_body()
        except Exception as e:
            self._set_headers(400)
            self.wfile.write(json.dumps({'error': 'Formato JSON inválido'}).encode('utf-8'))
            return

        conn = database.get_db()
        cursor = conn.cursor()

        try:
            # 1. Admin Login
            if path == '/api/admin/login':
                username = body.get('username', '')
                password = body.get('password', '')
                pwd_hash = database.hash_password(password)

                cursor.execute("SELECT * FROM admins WHERE username = ? AND password_hash = ?;", (username, pwd_hash))
                user = cursor.fetchone()
                if user:
                    token = secrets.token_hex(24)
                    SESSIONS.add(token)
                    self._set_headers(200)
                    self.wfile.write(json.dumps({'token': token, 'username': username}).encode('utf-8'))
                else:
                    self._set_headers(401)
                    self.wfile.write(json.dumps({'error': 'Contraseña o usuario de administración incorrecto.'}).encode('utf-8'))

            # 2. Admin Logout
            elif path == '/api/admin/logout':
                auth_header = self.headers.get('Authorization', '')
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
                    SESSIONS.discard(token)
                self._set_headers(200)
                self.wfile.write(json.dumps({'message': 'Sesión cerrada'}).encode('utf-8'))

            # 3. Public Rider Signup
            elif re.match(r'^/api/routes/[^/]+/signup$', path):
                route_id = path.split('/')[3]
                name = body.get('name', '').strip()
                phone_raw = body.get('phone', '').strip()

                if len(name) < 2:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'Introduce tu nombre completo.'}).encode('utf-8'))
                    return

                try:
                    formatted_phone = format_spanish_phone(phone_raw)
                except ValueError as ve:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': str(ve)}).encode('utf-8'))
                    return

                input_digits = get_digits9(formatted_phone)

                cursor.execute("SELECT * FROM riders WHERE route_id = ? AND phone_digits = ?;", (route_id, input_digits))
                existing = cursor.fetchone()

                now_str = datetime.now().strftime('%d/%m/%Y, %H:%M')

                if existing:
                    if existing['status'] != 'unsubscribed':
                        self._set_headers(400)
                        self.wfile.write(json.dumps({'error': 'Este número de teléfono ya está inscrito activamente en esta ruta.'}).encode('utf-8'))
                        return
                    # Re-activate
                    cursor.execute("UPDATE riders SET status = 'active', name = ?, registered_at = ?, unsubscribed_at = NULL WHERE id = ?;",
                                   (name, now_str, existing['id']))
                else:
                    rider_id = f"rider-{int(time.time() * 1000)}"
                    cursor.execute("INSERT INTO riders (id, route_id, name, phone, phone_digits, status, registered_at) VALUES (?, ?, ?, ?, ?, 'active', ?);",
                                   (rider_id, route_id, name, formatted_phone, input_digits, now_str))

                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({'success': True, 'name': name, 'phone': formatted_phone}).encode('utf-8'))

            # 4. Public Rider Unsubscribe
            elif re.match(r'^/api/routes/[^/]+/unsubscribe$', path):
                route_id = path.split('/')[3]
                phone_raw = body.get('phone', '').strip()

                try:
                    formatted_phone = format_spanish_phone(phone_raw)
                except ValueError as ve:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': str(ve)}).encode('utf-8'))
                    return

                input_digits = get_digits9(formatted_phone)

                cursor.execute("SELECT * FROM riders WHERE route_id = ? AND phone_digits = ? AND status != 'unsubscribed';", (route_id, input_digits))
                active_rider = cursor.fetchone()

                if not active_rider:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': f"No consta ninguna inscripción activa con el teléfono {formatted_phone} en esta ruta."}).encode('utf-8'))
                    return

                now_str = datetime.now().strftime('%d/%m/%Y, %H:%M')
                cursor.execute("UPDATE riders SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?;", (now_str, active_rider['id']))
                conn.commit()

                self._set_headers(200)
                self.wfile.write(json.dumps({'success': True, 'name': active_rider['name'], 'phone': active_rider['phone']}).encode('utf-8'))

            # 5. Admin Create Route
            elif path == '/api/routes':
                if not self.is_authenticated():
                    self._set_headers(401)
                    self.wfile.write(json.dumps({'error': 'Acceso no autorizado'}).encode('utf-8'))
                    return

                title = body.get('title', '').strip()
                date_str = body.get('date', '')
                start_point = body.get('startPoint', '').strip()
                end_point = body.get('endPoint', '').strip()
                days = int(body.get('days', 1))

                if not title or not date_str or not start_point or not end_point:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'Por favor rellena todos los campos obligatorios.'}).encode('utf-8'))
                    return

                route_id = f"ruta-{int(time.time() * 1000)}"
                date_formatted = datetime.strptime(date_str, '%Y-%m-%d').strftime('%d de %B, %Y')
                map_url = body.get('mapUrl') or database.generate_dir_url(start_point, end_point)

                cursor.execute('''
                    INSERT INTO routes (id, title, status, days, cancellation_reason, date, date_formatted, start_point, end_point, distance, difficulty, map_url, description, image)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (route_id, title, body.get('status', 'prevista'), days, body.get('cancellationReason', ''), date_str, date_formatted,
                      start_point, end_point, f"{body.get('distance', '200')} km", body.get('difficulty', 'Media'), map_url,
                      body.get('description', ''), body.get('image', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80')))

                # Add default stage
                sr_id = f"sr-{int(time.time() * 1000)}"
                cursor.execute('''
                    INSERT INTO sub_routes (id, route_id, day_number, title, start_point, end_point, distance, map_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (sr_id, route_id, 1, f"Etapa 1: {start_point} ➔ {end_point}", start_point, end_point, f"{body.get('distance', '200')} km", map_url))

                conn.commit()
                self._set_headers(201)
                self.wfile.write(json.dumps({'id': route_id, 'message': 'Ruta creada'}).encode('utf-8'))

            # 6. Admin Add Media
            elif re.match(r'^/api/routes/[^/]+/media$', path):
                if not self.is_authenticated():
                    self._set_headers(401)
                    self.wfile.write(json.dumps({'error': 'Acceso no autorizado'}).encode('utf-8'))
                    return

                route_id = path.split('/')[3]
                media_type = body.get('mediaType', 'photo')
                url = body.get('url', '').strip()
                caption = body.get('caption', '').strip()

                if not url:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': 'La URL multimedia es obligatoria.'}).encode('utf-8'))
                    return

                media_id = f"media-{int(time.time() * 1000)}"
                cursor.execute("INSERT INTO route_media (id, route_id, media_type, url, caption_or_title) VALUES (?, ?, ?, ?, ?);",
                               (media_id, route_id, media_type, url, caption))
                conn.commit()

                self._set_headers(201)
                self.wfile.write(json.dumps({'id': media_id, 'message': 'Multimedia añadido'}).encode('utf-8'))

            # 7. Admin Create Event
            elif path == '/api/events':
                if not self.is_authenticated():
                    self._set_headers(401)
                    self.wfile.write(json.dumps({'error': 'Acceso no autorizado'}).encode('utf-8'))
                    return

                event_id = f"evento-{int(time.time() * 1000)}"
                cursor.execute('''
                    INSERT INTO events (id, title, category, date, location, image, description, link)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (event_id, body.get('title'), body.get('category'), body.get('date'), body.get('location'),
                      body.get('image'), body.get('description'), body.get('link', '')))
                conn.commit()

                self._set_headers(201)
                self.wfile.write(json.dumps({'id': event_id, 'message': 'Evento creado'}).encode('utf-8'))

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({'error': 'Endpoint no encontrado'}).encode('utf-8'))

        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # PATCH REQUEST HANDLERS
    # --------------------------------------------------------------------------
    def do_PATCH(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if not self.is_authenticated():
            self._set_headers(401)
            self.wfile.write(json.dumps({'error': 'Acceso no autorizado'}).encode('utf-8'))
            return

        body = self.read_json_body()
        conn = database.get_db()
        cursor = conn.cursor()

        try:
            if re.match(r'^/api/routes/[^/]+/status$', path):
                route_id = path.split('/')[3]
                new_status = body.get('status')
                reason = body.get('cancellationReason', '')

                cursor.execute("UPDATE routes SET status = ?, cancellation_reason = ? WHERE id = ?;",
                               (new_status, reason if new_status == 'cancelada' else '', route_id))
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({'message': 'Estado de la ruta actualizado'}).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({'error': 'Endpoint no encontrado'}).encode('utf-8'))
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # DELETE REQUEST HANDLERS
    # --------------------------------------------------------------------------
    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if not self.is_authenticated():
            self._set_headers(401)
            self.wfile.write(json.dumps({'error': 'Acceso no autorizado'}).encode('utf-8'))
            return

        conn = database.get_db()
        cursor = conn.cursor()

        try:
            if re.match(r'^/api/routes/[^/]+$', path):
                route_id = path.split('/')[3]
                cursor.execute("DELETE FROM routes WHERE id = ?;", (route_id,))
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({'message': 'Ruta eliminada'}).encode('utf-8'))

            elif re.match(r'^/api/events/[^/]+$', path):
                event_id = path.split('/')[3]
                cursor.execute("DELETE FROM events WHERE id = ?;", (event_id,))
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({'message': 'Evento eliminado'}).encode('utf-8'))

            elif re.match(r'^/api/routes/[^/]+/media/[^/]+$', path):
                parts = path.split('/')
                media_id = parts[5]
                cursor.execute("DELETE FROM route_media WHERE id = ?;", (media_id,))
                conn.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({'message': 'Media eliminado'}).encode('utf-8'))

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({'error': 'Endpoint no encontrado'}).encode('utf-8'))
        finally:
            conn.close()

    # --------------------------------------------------------------------------
    # STATIC FILES SERVING HANDLER
    # --------------------------------------------------------------------------
    def handle_static_file(self, path):
        if path == '/' or not path:
            path = '/index.html'

        root_dir = os.path.dirname(__file__)
        file_path = os.path.abspath(os.path.join(root_dir, path.lstrip('/')))

        if not file_path.startswith(root_dir) or not os.path.isfile(file_path):
            file_path = os.path.join(root_dir, 'index.html')

        ext = os.path.splitext(file_path)[1].lower()
        mime_types = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.json': 'application/json'
        }
        content_type = mime_types.get(ext, 'application/octet-stream')

        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            self._set_headers(200, content_type)
            self.wfile.write(content)
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(f"Error leyendo archivo: {e}".encode('utf-8'))

def run():
    database.init_db()
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, LibertadExtremaHandler)
    print(f"🚀 Servidor Libertad Extrema corriendo con SQLite en http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido.")
        httpd.server_close()

if __name__ == '__main__':
    run()

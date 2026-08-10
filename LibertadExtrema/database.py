# ==============================================================================
# LIBERTAD EXTREMA - SQLITE DATABASE MANAGEMENT (PYTHON 3)
# ==============================================================================

import sqlite3
import hashlib
import json
import os
import time
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), 'libertad_extrema.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Routes Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS routes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT CHECK(status IN ('prevista', 'finalizada', 'cancelada')) DEFAULT 'prevista',
            days INTEGER DEFAULT 1,
            cancellation_reason TEXT DEFAULT '',
            date TEXT NOT NULL,
            date_formatted TEXT NOT NULL,
            start_point TEXT NOT NULL,
            end_point TEXT NOT NULL,
            distance TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            map_url TEXT NOT NULL,
            description TEXT NOT NULL,
            image TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')

    # 2. SubRoutes Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sub_routes (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL,
            day_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            start_point TEXT NOT NULL,
            end_point TEXT NOT NULL,
            distance TEXT NOT NULL,
            map_url TEXT NOT NULL,
            FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
        );
    ''')

    # 3. Riders Table (Active vs Unsubscribed Audit Trail)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS riders (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            phone_digits TEXT NOT NULL,
            status TEXT CHECK(status IN ('active', 'unsubscribed')) DEFAULT 'active',
            registered_at TEXT NOT NULL,
            unsubscribed_at TEXT DEFAULT NULL,
            FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
        );
    ''')

    # 4. Route Media Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS route_media (
            id TEXT PRIMARY KEY,
            route_id TEXT NOT NULL,
            media_type TEXT CHECK(media_type IN ('photo', 'video')) NOT NULL,
            url TEXT NOT NULL,
            caption_or_title TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
        );
    ''')

    # 5. Events Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            image TEXT NOT NULL,
            description TEXT NOT NULL,
            link TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')

    # 6. Admin Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admins (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL
        );
    ''')

    conn.commit()

    # Seed Admin User if missing
    cursor.execute("SELECT COUNT(*) as cnt FROM admins;")
    if cursor.fetchone()['cnt'] == 0:
        cursor.execute("INSERT INTO admins (username, password_hash) VALUES (?, ?);",
                       ('admin', hash_password('admin')))
        conn.commit()

    # Seed Spain Routes and Events if routes is empty
    cursor.execute("SELECT COUNT(*) as cnt FROM routes;")
    if cursor.fetchone()['cnt'] == 0:
        seed_db(conn)

    conn.close()

def generate_dir_url(start, end):
    from urllib.parse import quote
    return f"https://www.google.com/maps/dir/?api=1&origin={quote(start)}&destination={quote(end)}"

def seed_db(conn):
    cursor = conn.cursor()

    routes = [
        {
            "id": "ruta-transpirenaica",
            "title": "Transpirenaica Motera: Del Mediterráneo al Cantábrico",
            "status": "prevista",
            "days": 4,
            "cancellationReason": "",
            "date": "2026-09-12",
            "dateFormatted": "12 de Septiembre, 2026",
            "startPoint": "Llançà (Girona)",
            "endPoint": "Hondarribia (Guipúzcoa)",
            "distance": "780 km",
            "difficulty": "Alta",
            "description": "La gran travesía por excelencia cruzando los Pirineos de costa a costa. Puertos míticos como el Coll de la Creueta, el Puerto de Cotefablo y la carretera del Roncal.",
            "image": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
            "mapUrl": generate_dir_url("Llançà", "Hondarribia"),
            "subRoutes": [
                {
                    "id": "sr-trans-1",
                    "day": 1,
                    "title": "Día 1: De Llançà a la Seu d'Urgell (Puertos Orientales)",
                    "startPoint": "Llançà (Girona)",
                    "endPoint": "La Seu d'Urgell (Lleida)",
                    "distance": "220 km",
                    "mapUrl": generate_dir_url("Llançà", "La Seu d'Urgell")
                },
                {
                    "id": "sr-trans-2",
                    "day": 2,
                    "title": "Día 2: Travesía del Pirineo Aragonés (Aínsa y Jaca)",
                    "startPoint": "La Seu d'Urgell (Lleida)",
                    "endPoint": "Jaca (Huesca)",
                    "distance": "210 km",
                    "mapUrl": generate_dir_url("La Seu d'Urgell", "Jaca")
                },
                {
                    "id": "sr-trans-3",
                    "day": 3,
                    "title": "Día 3: Valles de Ansó, Hecho y Roncal hasta Navarra",
                    "startPoint": "Jaca (Huesca)",
                    "endPoint": "Roncesvalles (Navarra)",
                    "distance": "180 km",
                    "mapUrl": generate_dir_url("Jaca", "Roncesvalles")
                },
                {
                    "id": "sr-trans-4",
                    "day": 4,
                    "title": "Día 4: Descenso al Cantábrico por Jaizkibel",
                    "startPoint": "Roncesvalles (Navarra)",
                    "endPoint": "Hondarribia (Guipúzcoa)",
                    "distance": "170 km",
                    "mapUrl": generate_dir_url("Roncesvalles", "Hondarribia")
                }
            ],
            "riders": [
                {"id": "r-1", "name": "Carlos R6", "phone": "+34 612 345 678", "phoneDigits": "612345678", "status": "active", "registeredAt": "01/08/2026, 10:30"},
                {"id": "r-2", "name": "Marta GS1250", "phone": "+34 699 887 766", "phoneDigits": "699887766", "status": "active", "registeredAt": "02/08/2026, 12:15"}
            ]
        },
        {
            "id": "ruta-gredos",
            "title": "Ruta por los Puertos de Gredos y Valle del Tiétar",
            "status": "prevista",
            "days": 1,
            "cancellationReason": "",
            "date": "2026-08-20",
            "dateFormatted": "20 de Agosto, 2026",
            "startPoint": "Arenas de San Pedro (Ávila)",
            "endPoint": "Navarredonda de Gredos (Ávila)",
            "distance": "210 km",
            "difficulty": "Media",
            "description": "Rodada de curvas por el Puerto de la Peña Negra, el Puerto del Pico y parada gastronómica en la Sierra de Gredos. Asfalto impecable y vistas panorámicas.",
            "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
            "mapUrl": generate_dir_url("Arenas de San Pedro", "Navarredonda de Gredos"),
            "subRoutes": [
                {
                    "id": "sr-gredos-1",
                    "day": 1,
                    "title": "Jornada Completa: Bucle por los Puertos de Gredos",
                    "startPoint": "Arenas de San Pedro (Ávila)",
                    "endPoint": "Navarredonda de Gredos (Ávila)",
                    "distance": "210 km",
                    "mapUrl": generate_dir_url("Arenas de San Pedro", "Navarredonda de Gredos")
                }
            ],
            "riders": [
                {"id": "r-3", "name": "Javier Z900", "phone": "+34 677 112 233", "phoneDigits": "677112233", "status": "active", "registeredAt": "05/08/2026, 09:00"}
            ]
        },
        {
            "id": "ruta-via-plata",
            "title": "Ruta por la Vía de la Plata: Mérida a Astorga",
            "status": "finalizada",
            "days": 2,
            "cancellationReason": "",
            "date": "2026-07-15",
            "dateFormatted": "15 de Julio, 2026",
            "startPoint": "Mérida (Badajoz)",
            "endPoint": "Astorga (León)",
            "distance": "490 km",
            "difficulty": "Media",
            "description": "Recorrido histórico por la mítica calzada romana. Pasando por Cáceres, Salamanca y Zamora con almuerzo castellano de hermandad.",
            "image": "https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=1000&q=80",
            "mapUrl": generate_dir_url("Mérida", "Astorga"),
            "subRoutes": [
                {
                    "id": "sr-plata-1",
                    "day": 1,
                    "title": "Día 1: Mérida a Salamanca por las dehesas extremeñas",
                    "startPoint": "Mérida (Badajoz)",
                    "endPoint": "Salamanca",
                    "distance": "270 km",
                    "mapUrl": generate_dir_url("Mérida", "Salamanca")
                },
                {
                    "id": "sr-plata-2",
                    "day": 2,
                    "title": "Día 2: Salamanca a Astorga cruzando el río Duero",
                    "startPoint": "Salamanca",
                    "endPoint": "Astorga (León)",
                    "distance": "220 km",
                    "mapUrl": generate_dir_url("Salamanca", "Astorga")
                }
            ],
            "riders": [
                {"id": "r-4", "name": "Elena Tracer9", "phone": "+34 655 443 322", "phoneDigits": "655443322", "status": "active", "registeredAt": "10/07/2026, 14:20"}
            ],
            "media": {
                "photos": [
                    {"id": "m-1", "url": "https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=1000&q=80", "caption": "Parada en la Plaza Mayor de Salamanca"},
                    {"id": "m-2", "url": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80", "caption": "Llegada al palacio de Gaudí en Astorga"}
                ],
                "videos": [
                    {"id": "m-3", "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ", "title": "Vídeo Resumen Rodada Vía de la Plata 2026"}
                ]
            }
        },
        {
            "id": "ruta-costa-brava",
            "title": "Ruta Nocturna Costa Brava y Macizo del Montseny",
            "status": "cancelada",
            "days": 1,
            "cancellationReason": "Alerta meteorológica por intensas lluvias y ráfagas de viento en el tramo costero.",
            "date": "2026-08-02",
            "dateFormatted": "02 de Agosto, 2026",
            "startPoint": "Tossa de Mar (Girona)",
            "endPoint": "Sant Feliu de Guíxols (Girona)",
            "distance": "180 km",
            "difficulty": "Media",
            "description": "Curvas reviradas sobre los acantilados del Mediterráneo. Pospuesta para próxima fecha por seguridad.",
            "image": "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=1000&q=80",
            "mapUrl": generate_dir_url("Tossa de Mar", "Sant Feliu de Guíxols"),
            "subRoutes": [],
            "riders": []
        }
    ]

    for r in routes:
        cursor.execute('''
            INSERT INTO routes (id, title, status, days, cancellation_reason, date, date_formatted, start_point, end_point, distance, difficulty, map_url, description, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (r['id'], r['title'], r['status'], r['days'], r['cancellationReason'], r['date'], r['dateFormatted'], r['startPoint'], r['endPoint'], r['distance'], r['difficulty'], r['mapUrl'], r['description'], r['image']))

        for sr in r.get('subRoutes', []):
            cursor.execute('''
                INSERT INTO sub_routes (id, route_id, day_number, title, start_point, end_point, distance, map_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (sr['id'], r['id'], sr['day'], sr['title'], sr['startPoint'], sr['endPoint'], sr['distance'], sr['mapUrl']))

        for rider in r.get('riders', []):
            cursor.execute('''
                INSERT INTO riders (id, route_id, name, phone, phone_digits, status, registered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (rider['id'], r['id'], rider['name'], rider['phone'], rider['phoneDigits'], rider['status'], rider['registeredAt']))

        media = r.get('media', {})
        for photo in media.get('photos', []):
            cursor.execute('''
                INSERT INTO route_media (id, route_id, media_type, url, caption_or_title)
                VALUES (?, ?, 'photo', ?, ?)
            ''', (photo['id'], r['id'], photo['url'], photo['caption']))

        for video in media.get('videos', []):
            cursor.execute('''
                INSERT INTO route_media (id, route_id, media_type, url, caption_or_title)
                VALUES (?, ?, 'video', ?, ?)
            ''', (video['id'], r['id'], video['embedUrl'], video['title']))

    events = [
        {
            "id": "evento-jerez",
            "title": "Gran Premio de España de MotoGP 2027 en Jerez",
            "category": "Competición",
            "date": "28 - 30 de Abril, 2027",
            "location": "Circuito de Jerez - Ángel Nieto (Cádiz)",
            "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
            "description": "Acompaña al club en la gran fiesta del motociclismo español. Organizamos viaje en grupo en moto y zona de acampada conjunta.",
            "link": "https://www.circuitodejerez.com"
        },
        {
            "id": "evento-pinguinos",
            "title": "Concentración Motera Invernal Pingüinos 2027",
            "category": "Concentración",
            "date": "08 - 11 de Enero, 2027",
            "location": "Valladolid (Castilla y León)",
            "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
            "description": "La mítica cita invernal motera de Europa. Fogatas de leña, desfile de antorchas, conciertos y hermandad 100% motera.",
            "link": "https://www.clubpinguinos.com"
        },
        {
            "id": "evento-jarama",
            "title": "Curso de Conducción Segura y Trazada en Circuito",
            "category": "Formación",
            "date": "22 de Mayo, 2027",
            "location": "Circuito del Jarama (Madrid)",
            "image": "https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=800&q=80",
            "description": "Mejora tu técnica de inclinación, frenada de emergencia y posición corporal en curva con instructores titulados.",
            "link": "https://www.jarama.org"
        }
    ]

    for e in events:
        cursor.execute('''
            INSERT INTO events (id, title, category, date, location, image, description, link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (e['id'], e['title'], e['category'], e['date'], e['location'], e['image'], e['description'], e['link']))

    conn.commit()

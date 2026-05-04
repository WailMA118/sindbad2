"""
Sindbad Tourism – FastAPI Backend
All APIs required for: base.html, home.html, explore.html
"""

import decimal
import mysql.connector
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from config import DB_CONFIG

app = FastAPI(title="Sindbad Tourism API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
#  DB helpers
# ─────────────────────────────────────────────

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def _serialize_row(row: dict) -> dict:
    """Convert Decimal → float so FastAPI can serialize."""
    return {
        k: (float(v) if isinstance(v, decimal.Decimal) else v)
        for k, v in row.items()
    }


def fetch_all(query: str, params: tuple = ()) -> list[dict]:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_serialize_row(r) for r in rows]


def fetch_one(query: str, params: tuple = ()) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query, params)
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return _serialize_row(row) if row else None


def fetch_count(query: str, params: tuple = ()) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] if result else 0


# ─────────────────────────────────────────────
#  Query builders (reusable SQL fragments)
# ─────────────────────────────────────────────

TRIP_SELECT = """
    SELECT
        t.trip_id,
        t.name,
        t.description,
        t.price_base,
        t.duration_days,
        t.image_url,
        c.name  AS city,
        ROUND(IFNULL(AVG(r.stars), 0), 1)      AS avg_rating,
        COUNT(DISTINCT b.booking_id)            AS total_bookings,
        COUNT(DISTINCT w.wishlist_id)           AS total_favorites
    FROM trips t
    LEFT JOIN cities  c ON t.city_id   = c.city_id
    LEFT JOIN ratings r ON t.trip_id   = r.trip_id
    LEFT JOIN bookings b ON t.trip_id  = b.trip_id
    LEFT JOIN wishlist w ON t.trip_id  = w.trip_id
"""

TRIP_GROUP = "GROUP BY t.trip_id, t.name, t.description, t.price_base, t.duration_days, t.image_url, c.name"

ORDER_MAP = {
    "explore": "(IFNULL(AVG(r.stars),0)*0.5 + COUNT(DISTINCT b.booking_id)*0.3 + COUNT(DISTINCT w.wishlist_id)*0.2) DESC",
    "rate":    "avg_rating DESC",
    "booked":  "total_bookings DESC",
}


# ─────────────────────────────────────────────
#  BASE PAGE  (/api/trips/featured, /api/hotels/featured, /api/trips/random-images)
# ─────────────────────────────────────────────

@app.get("/api/trips/featured", summary="One featured trip – base page card")
def get_featured_trip():
    return fetch_one(f"""
        {TRIP_SELECT}
        {TRIP_GROUP}
        ORDER BY (IFNULL(AVG(r.stars),0)*0.5 + COUNT(DISTINCT b.booking_id)*0.5) DESC
        LIMIT 1
    """) or {}


@app.get("/api/hotels/featured", summary="One featured hotel – base page card")
def get_featured_hotel():
    return fetch_one("""
        SELECT h.hotel_id, h.name, h.description,
               h.price_per_night, c.name AS city
        FROM hotels h
        LEFT JOIN cities c ON h.city_id = c.city_id
        ORDER BY h.hotel_id DESC
        LIMIT 1
    """) or {}


@app.get("/api/trips/random-images", summary="Random trip thumbnails – base scroll strip")
def get_random_trip_images():
    return fetch_all("""
        SELECT trip_id, name, image_url
        FROM trips
        ORDER BY RAND()
        LIMIT 8
    """)


# ─────────────────────────────────────────────
#  HOME PAGE  (/api/trips/carousel, /api/trips/top, /api/hotels/top)
# ─────────────────────────────────────────────

@app.get("/api/trips/carousel", summary="Latest trips for homepage carousel")
def get_carousel_trips():
    return fetch_all(f"""
        {TRIP_SELECT}
        {TRIP_GROUP}
        ORDER BY t.created_at DESC
        LIMIT 6
    """)


@app.get("/api/trips/top", summary="Top-scored trips (home Explore section)")
def get_top_trips(limit: int = Query(3, ge=1, le=20)):
    return fetch_all(f"""
        {TRIP_SELECT}
        {TRIP_GROUP}
        ORDER BY (IFNULL(AVG(r.stars),0)*0.5 + COUNT(DISTINCT b.booking_id)*0.3 + COUNT(DISTINCT w.wishlist_id)*0.2) DESC
        LIMIT {limit}
    """)


@app.get("/api/hotels/top", summary="Top hotels (home Hotels section)")
def get_top_hotels(limit: int = Query(3, ge=1, le=20)):
    return fetch_all(f"""
        SELECT h.hotel_id, h.name, h.description,
               h.price_per_night, c.name AS city
        FROM hotels h
        LEFT JOIN cities c ON h.city_id = c.city_id
        LIMIT {limit}
    """)


# ─────────────────────────────────────────────
#  EXPLORE PAGE  (/api/trips)
# ─────────────────────────────────────────────

@app.get("/api/trips", summary="Paginated + sorted + searchable trips – explore page")
def get_trips(
    sort:   str = Query("explore", enum=["explore", "rate", "booked"]),
    page:   int = Query(1,  ge=1),
    search: str = Query(""),
    limit:  int = Query(9,  ge=1, le=30),
):
    offset = (page - 1) * limit

    # Build optional WHERE clause for search
    if search:
        where  = "WHERE (t.name LIKE %s OR c.name LIKE %s)"
        params = (f"%{search}%", f"%{search}%")
    else:
        where  = ""
        params = ()

    trips = fetch_all(f"""
        {TRIP_SELECT}
        {where}
        {TRIP_GROUP}
        ORDER BY {ORDER_MAP[sort]}
        LIMIT {limit} OFFSET {offset}
    """, params)

    total = fetch_count(f"""
        SELECT COUNT(DISTINCT t.trip_id)
        FROM trips t
        LEFT JOIN cities c ON t.city_id = c.city_id
        {where}
    """, params)

    return {
        "trips":       trips,
        "total":       total,
        "page":        page,
        "limit":       limit,
        "total_pages": max(1, (total + limit - 1) // limit),
    }


# ─────────────────────────────────────────────
#  Entry point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
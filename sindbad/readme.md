# Sindbad – Tourism Platform

University project – Palestine tourism website.  
Pages: **base.html**, **home.html**, **explore.html**

---

## Project Structure

```
sindbad/
├── backend/
│   ├── main.py            ← FastAPI app (all APIs)
│   ├── config.py          ← DB connection config
│   └── requirements.txt
├── frontend/
│   ├── base.html          ← Landing / welcome page
│   ├── home.html          ← Homepage (carousel + sections)
│   ├── explore.html       ← Browse trips (filter + search + pagination)
│   └── assets/
│       ├── css/style.css
│       └── js/
│           ├── api.js     ← Shared fetch helpers
│           ├── base.js
│           ├── home.js
│           └── explore.js
└── README.md
```

---

## Setup

### 1. Database

```sql
-- Run tourism_system_v3.txt to create the schema
-- (already contains: tourism_system_v4 database + all tables + views)
```

Edit `backend/config.py` and set your MySQL credentials:

```python
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "YOUR_PASSWORD",
    "database": "tourism_system_v4",
}
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# → API running at http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### 3. Frontend

Open any HTML file directly in the browser **or** serve with a simple server:

```bash
cd frontend
python -m http.server 5500
# → http://localhost:5500/base.html
```

---

## API Endpoints

| Method | Endpoint                    | Used by       | Description                          |
|--------|-----------------------------|---------------|--------------------------------------|
| GET    | `/api/trips/featured`       | base.html     | One top-scored trip (feature card)   |
| GET    | `/api/hotels/featured`      | base.html     | One featured hotel (feature card)    |
| GET    | `/api/trips/random-images`  | base.html     | 8 random trips for scroll strip      |
| GET    | `/api/trips/carousel`       | home.html     | Latest 6 trips for the carousel      |
| GET    | `/api/trips/top?limit=3`    | home.html     | Top 3 trips by suggestion score      |
| GET    | `/api/hotels/top?limit=3`   | home.html     | Top 3 hotels                         |
| GET    | `/api/trips?sort=&page=&search=` | explore.html | Paginated + sorted + searchable trips |

### `/api/trips` Query Parameters

| Param    | Values                        | Default   |
|----------|-------------------------------|-----------|
| `sort`   | `explore` / `rate` / `booked` | `explore` |
| `page`   | integer ≥ 1                   | `1`       |
| `search` | string                        | `""`      |
| `limit`  | 1–30                          | `9`       |
/* ─────────────────────────────────────────────────
   api.js  –  Shared fetch utilities
   ───────────────────────────────────────────────── */
 
const API_BASE = "http://localhost:8000";
 
/**
 * Generic GET request to the backend.
 * Returns parsed JSON or null on error.
 */
async function apiFetch(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("apiFetch error:", endpoint, err);
    return null;
  }
}
 
/**
 * Returns an image URL:
 *  - the db url if it looks valid
 *  - a picsum placeholder seeded by the given id otherwise
 */
function imgUrl(url, id = 1) {
  if (url && url.startsWith("http")) return url;
  return `https://picsum.photos/seed/${id}/400/300`;
}
 
/**
 * Render a standard trip card element.
 */
function buildTripCard(trip) {
  const div = document.createElement("div");
  div.className = "trip-card";
  div.innerHTML = `
    <img src="${imgUrl(trip.image_url, trip.trip_id)}" alt="${trip.name}" loading="lazy"
         onerror="this.src='https://picsum.photos/seed/${trip.trip_id}/400/300'">
    <div class="trip-card-overlay">
      <h6>${trip.name}</h6>
      <small>${trip.city || ""} &bull; ${trip.duration_days || "?"} days &bull; $${trip.price_base || "?"}</small>
    </div>`;
  return div;
}
 
/**
 * Render a hotel card (same style, different fields).
 */
function buildHotelCard(hotel) {
  const div = document.createElement("div");
  div.className = "trip-card";
  div.innerHTML = `
    <img src="${imgUrl(hotel.image_url, hotel.hotel_id)}" alt="${hotel.name}" loading="lazy"
         onerror="this.src='https://picsum.photos/seed/h${hotel.hotel_id}/400/300'">
    <div class="trip-card-overlay">
      <h6>${hotel.name}</h6>
      <small>${hotel.city || ""} &bull; $${hotel.price_per_night || "?"}/night</small>
    </div>`;
  return div;
}
 
/**
 * Spinner HTML.
 */
function spinnerHtml() {
  return `<div class="spinner-wrap">
    <div class="spinner-border" style="color:var(--primary)" role="status">
      <span class="visually-hidden">Loading…</span>
    </div>
  </div>`;
}
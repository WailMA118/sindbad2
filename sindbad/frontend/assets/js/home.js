/* ─────────────────────────────────────────────────
   home.js  –  Logic for home.html
   ───────────────────────────────────────────────── */
 
document.addEventListener("DOMContentLoaded", () => {
  loadCarousel();
  loadTopTrips();
  loadTopHotels();
});
 
/* ── Carousel ──────────────────────────────────── */
async function loadCarousel() {
  const inner = document.getElementById("carousel-inner");
  const indicators = document.getElementById("carousel-indicators");
  if (!inner) return;
 
  const trips = await apiFetch("/api/trips/carousel");
 
  if (!trips || trips.length === 0) {
    inner.innerHTML = `<div class="carousel-item active">
      <div class="carousel-slide">
        <div class="carousel-slide-text"><h4>Welcome to Sindbad</h4><p>Discover Palestine</p></div>
      </div></div>`;
    return;
  }
 
  inner.innerHTML      = "";
  indicators.innerHTML = "";
 
  trips.forEach((trip, i) => {
    /* Indicator dot */
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.bsTarget = "#mainCarousel";
    btn.dataset.bsSlideTo = i;
    btn.setAttribute("aria-label", `Slide ${i + 1}`);
    if (i === 0) { btn.className = "active"; btn.setAttribute("aria-current", "true"); }
    indicators.appendChild(btn);
 
    /* Slide */
    const item = document.createElement("div");
    item.className = "carousel-item" + (i === 0 ? " active" : "");
    item.innerHTML = `
      <div class="carousel-slide">
        <img src="${imgUrl(trip.image_url, trip.trip_id)}" alt="${trip.name}"
          onerror="this.src='https://picsum.photos/seed/c${trip.trip_id}/800/400'">
        <div class="carousel-slide-text">
          <h4>${trip.name}</h4>
          <p>${trip.description || ""}</p>
          <small style="opacity:.8">${trip.city || ""} &bull; ${trip.duration_days || "?"} days &bull; from $${trip.price_base || "?"}</small>
        </div>
      </div>`;
    inner.appendChild(item);
  });
}
 
/* ── Top Trips (Explore section) ─────────────── */
async function loadTopTrips() {
  const grid = document.getElementById("top-trips-grid");
  if (!grid) return;
 
  grid.innerHTML = spinnerHtml();
  const trips = await apiFetch("/api/trips/top?limit=3");
 
  if (!trips || trips.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No trips available.</p>';
    return;
  }
 
  grid.innerHTML = "";
  trips.forEach(trip => grid.appendChild(buildTripCard(trip)));
}
 
/* ── Top Hotels ───────────────────────────────── */
async function loadTopHotels() {
  const grid = document.getElementById("top-hotels-grid");
  if (!grid) return;
 
  grid.innerHTML = spinnerHtml();
  const hotels = await apiFetch("/api/hotels/top?limit=3");
 
  if (!hotels || hotels.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No hotels available.</p>';
    return;
  }
 
  grid.innerHTML = "";
  hotels.forEach(hotel => grid.appendChild(buildHotelCard(hotel)));
}
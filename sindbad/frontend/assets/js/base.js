/* ─────────────────────────────────────────────────
   base.js  –  Logic for base.html
   ───────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  loadFeaturedTrip();
  loadFeaturedHotel();
  loadScrollStrip();
});

/* Featured trip card */
async function loadFeaturedTrip() {
  const data = await apiFetch("/api/trips/featured");
  if (!data || !data.trip_id) return;

  const imgEl  = document.getElementById("featured-trip-img");
  const nameEl = document.getElementById("featured-trip-name");

  if (imgEl) {
    const img = document.createElement("img");
    img.src   = imgUrl(data.image_url, data.trip_id);
    img.alt   = data.name;
    img.onerror = () => { img.src = `https://picsum.photos/seed/${data.trip_id}/400/300`; };
    imgEl.appendChild(img);
  }
  if (nameEl) nameEl.textContent = data.name;
}

/* Featured hotel card */
async function loadFeaturedHotel() {
  const data = await apiFetch("/api/hotels/featured");
  if (!data || !data.hotel_id) return;

  const imgEl  = document.getElementById("featured-hotel-img");
  const nameEl = document.getElementById("featured-hotel-name");

  if (imgEl) {
    const img = document.createElement("img");
    img.src   = imgUrl(data.image_url, data.hotel_id);
    img.alt   = data.name;
    img.onerror = () => { img.src = `https://picsum.photos/seed/h${data.hotel_id}/400/300`; };
    imgEl.appendChild(img);
  }
  if (nameEl) nameEl.textContent = data.name;
}

/* Horizontal scroll strip */
async function loadScrollStrip() {
  const strip = document.getElementById("scroll-strip");
  if (!strip) return;

  const trips = await apiFetch("/api/trips/random-images");
  if (!trips || trips.length === 0) {
    strip.innerHTML = '<span class="text-muted small">No trips yet.</span>';
    return;
  }

  strip.innerHTML = "";
  trips.forEach(trip => {
    const card = document.createElement("div");
    card.className = "scroll-card";
    card.innerHTML = `<img src="${imgUrl(trip.image_url, trip.trip_id)}" alt="${trip.name}"
      loading="lazy"
      onerror="this.src='https://picsum.photos/seed/s${trip.trip_id}/200/150'">`;
    strip.appendChild(card);
  });
}
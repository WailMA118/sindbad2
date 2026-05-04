/* ─────────────────────────────────────────────────
   explore.js  –  Logic for explore.html
   ───────────────────────────────────────────────── */

let currentSort  = "explore";
let currentPage  = 1;
let currentSearch = "";
let totalPages   = 1;
let searchTimer  = null;

document.addEventListener("DOMContentLoaded", () => {
  /* Filter pills */
  document.querySelectorAll(".filter-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSort = btn.dataset.sort;
      currentPage = 1;
      loadTrips();
    });
  });

  /* Search with debounce */
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearch = searchInput.value.trim();
        currentPage   = 1;
        loadTrips();
      }, 400);
    });
  }

  loadTrips();
});

/* ── Load trips ───────────────────────────────── */
async function loadTrips() {
  const grid    = document.getElementById("trips-grid");
  const pagBar  = document.getElementById("pagination-bar");
  if (!grid) return;

  grid.innerHTML   = spinnerHtml();
  if (pagBar) pagBar.innerHTML = "";

  const params = new URLSearchParams({
    sort:   currentSort,
    page:   currentPage,
    search: currentSearch,
    limit:  9,
  });

  const data = await apiFetch(`/api/trips?${params}`);

  if (!data || !data.trips) {
    grid.innerHTML = '<p class="empty-msg">Could not load trips.</p>';
    return;
  }

  if (data.trips.length === 0) {
    grid.innerHTML = '<p class="empty-msg">No trips found.</p>';
    return;
  }

  grid.innerHTML = "";
  data.trips.forEach(trip => grid.appendChild(buildTripCard(trip)));

  totalPages = data.total_pages;
  renderPagination(data.page, data.total_pages);
}

/* ── Pagination ───────────────────────────────── */
function renderPagination(page, total) {
  const bar = document.getElementById("pagination-bar");
  if (!bar || total <= 1) return;

  bar.innerHTML = "";

  /* Prev */
  bar.appendChild(pageBtn("&lsaquo;", page > 1, () => { currentPage--; loadTrips(); }));

  /* Page numbers with ellipsis */
  const pages = buildPageNumbers(page, total);
  pages.forEach(p => {
    if (p === "…") {
      const span = document.createElement("button");
      span.className = "page-btn dots";
      span.textContent = "…";
      span.disabled = true;
      bar.appendChild(span);
    } else {
      bar.appendChild(pageBtn(p, true, () => { currentPage = p; loadTrips(); }, p === page));
    }
  });

  /* Next */
  bar.appendChild(pageBtn("&rsaquo;", page < total, () => { currentPage++; loadTrips(); }));
}

function pageBtn(label, enabled, onClick, active = false) {
  const btn = document.createElement("button");
  btn.className = "page-btn" + (active ? " active" : "");
  btn.innerHTML = label;
  btn.disabled  = !enabled;
  if (enabled) btn.addEventListener("click", onClick);
  return btn;
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);

  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}
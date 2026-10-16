const LIST_KEY = "lumina-watchlist";

const els = {
  nav: document.getElementById("nav"),
  hero: document.getElementById("hero"),
  homeRows: document.getElementById("home-rows"),
  genreChips: document.getElementById("genre-chips"),
  browseGrid: document.getElementById("browse-grid"),
  watchlistGrid: document.getElementById("watchlist-grid"),
  watchlistEmpty: document.getElementById("watchlist-empty"),
  watchlistCount: document.getElementById("watchlist-count"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  searchGrid: document.getElementById("search-grid"),
  searchEmpty: document.getElementById("search-empty"),
  searchTitle: document.getElementById("search-title"),
  modal: document.getElementById("modal"),
  modalBody: document.getElementById("modal-body"),
};

let activeGenre = "All";
let featuredIndex = 0;
let featuredTimer;

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY)) || [];
  } catch {
    return [];
  }
}

function setWatchlist(ids) {
  localStorage.setItem(LIST_KEY, JSON.stringify(ids));
  renderWatchlistBadge();
}

function isSaved(id) {
  return getWatchlist().includes(id);
}

function toggleWatchlist(id) {
  const ids = getWatchlist();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  setWatchlist(next);
  const view = document.querySelector(".nav-link.is-active")?.dataset.view;
  if (view === "watchlist") renderWatchlist();
  const openId = els.modal.dataset.movieId;
  if (!els.modal.hidden && openId === id) openMovie(id);
  const saveBtn = els.hero.querySelector("[data-save]");
  if (saveBtn?.dataset.save === id) {
    saveBtn.textContent = isSaved(id) ? "In watchlist" : "Add to watchlist";
  }
}

function movieById(id) {
  return MOVIES.find((m) => m.id === id);
}

function cardHTML(movie) {
  return `
    <button class="card" type="button" data-open="${movie.id}">
      <div class="poster">
        <img src="${movie.poster}" alt="${movie.title} poster" loading="lazy" />
        <div class="poster-fade"></div>
      </div>
      <p class="card-title">${movie.title}</p>
      <p class="card-sub">${movie.year} · ★ ${movie.rating.toFixed(1)}</p>
    </button>
  `;
}

function renderHero() {
  const featured = MOVIES.filter((m) => m.featured);
  const movie = featured[featuredIndex % featured.length];
  els.hero.innerHTML = `
    <div class="hero-bg" style="background-image:url('${movie.backdrop}')"></div>
    <div class="hero-copy">
      <p class="eyebrow">Featured tonight</p>
      <h1>${movie.title}</h1>
      <div class="meta">
        <span class="rating">★ ${movie.rating.toFixed(1)}</span>
        <span>${movie.year}</span>
        <span>${movie.runtime}</span>
        <span>${movie.genres.join(" · ")}</span>
      </div>
      <p>${movie.overview}</p>
      <div class="actions">
        <button class="btn btn-gold" type="button" data-open="${movie.id}">Watch trailer</button>
        <button class="btn btn-ghost" type="button" data-save="${movie.id}">
          ${isSaved(movie.id) ? "In watchlist" : "Add to watchlist"}
        </button>
      </div>
    </div>
  `;
}

function cycleFeatured() {
  clearInterval(featuredTimer);
  featuredTimer = setInterval(() => {
    featuredIndex += 1;
    renderHero();
  }, 8000);
}

function renderRows() {
  const rows = [
    { title: "Trending now", movies: MOVIES.filter((m) => m.trending) },
    { title: "Top rated", movies: MOVIES.filter((m) => m.topRated) },
    { title: "Science fiction", movies: MOVIES.filter((m) => m.genres.includes("Sci-Fi")) },
    { title: "Animation", movies: MOVIES.filter((m) => m.genres.includes("Animation")) },
    { title: "Drama", movies: MOVIES.filter((m) => m.genres.includes("Drama")) },
  ];
  els.homeRows.innerHTML = rows
    .map(
      (row) => `
      <section class="row">
        <div class="row-head"><h2>${row.title}</h2></div>
        <div class="scroller">${row.movies.map(cardHTML).join("")}</div>
      </section>
    `
    )
    .join("");
}

function renderChips() {
  els.genreChips.innerHTML = GENRES.map(
    (genre) => `
      <button class="chip ${genre === activeGenre ? "is-active" : ""}" type="button" data-genre="${genre}">
        ${genre}
      </button>
    `
  ).join("");
}

function renderBrowse() {
  const list =
    activeGenre === "All"
      ? MOVIES
      : MOVIES.filter((m) => m.genres.includes(activeGenre));
  els.browseGrid.innerHTML = list.map(cardHTML).join("");
}

function renderWatchlist() {
  const list = getWatchlist()
    .map(movieById)
    .filter(Boolean);
  els.watchlistGrid.innerHTML = list.map(cardHTML).join("");
  els.watchlistEmpty.hidden = list.length > 0;
}

function renderWatchlistBadge() {
  const count = getWatchlist().length;
  els.watchlistCount.hidden = count === 0;
  els.watchlistCount.textContent = String(count);
}

function setView(name) {
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    const on = panel.dataset.viewPanel === name;
    panel.hidden = !on;
    panel.classList.toggle("is-active", on);
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === name);
  });
  if (name === "watchlist") renderWatchlist();
  if (name === "browse") {
    renderChips();
    renderBrowse();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function searchMovies(query) {
  const q = query.trim().toLowerCase();
  if (!q) {
    setView("home");
    return;
  }
  const results = MOVIES.filter((m) => {
    const blob = [m.title, m.director, m.year, ...m.genres, ...m.cast].join(" ").toLowerCase();
    return blob.includes(q);
  });
  els.searchTitle.textContent = `Results for “${query.trim()}”`;
  els.searchGrid.innerHTML = results.map(cardHTML).join("");
  els.searchEmpty.hidden = results.length > 0;
  setView("search");
}

function openMovie(id) {
  const movie = movieById(id);
  if (!movie) return;
  els.modal.hidden = false;
  els.modal.dataset.movieId = id;
  document.body.style.overflow = "hidden";
  const saved = isSaved(movie.id);
  els.modalBody.innerHTML = `
    <div class="modal-hero" style="background-image:url('${movie.backdrop}')"></div>
    <div class="modal-body">
      <div class="modal-layout">
        <div class="modal-poster">
          <img src="${movie.poster}" alt="${movie.title} poster" />
        </div>
        <div>
          <h2 class="modal-title" id="modal-title">${movie.title}</h2>
          <div class="meta">
            <span class="rating">★ ${movie.rating.toFixed(1)}</span>
            <span>${movie.year}</span>
            <span>${movie.runtime}</span>
            <span>${movie.director}</span>
          </div>
          <p>${movie.overview}</p>
          <div class="cast">${movie.cast.map((c) => `<span class="pill">${c}</span>`).join("")}</div>
          <div class="actions" style="margin-top:18px">
            <button class="btn btn-ghost" type="button" data-save="${movie.id}">
              ${saved ? "Remove from watchlist" : "Add to watchlist"}
            </button>
          </div>
        </div>
      </div>
      <div class="trailer">
        <iframe
          src="https://www.youtube.com/embed/${movie.trailer}"
          title="${movie.title} trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  `;
}

function closeModal() {
  els.modal.hidden = true;
  els.modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
  const viewBtn = event.target.closest("[data-view]");
  if (viewBtn) {
    event.preventDefault();
    setView(viewBtn.dataset.view);
  }

  const openBtn = event.target.closest("[data-open]");
  if (openBtn) openMovie(openBtn.dataset.open);

  const saveBtn = event.target.closest("[data-save]");
  if (saveBtn) toggleWatchlist(saveBtn.dataset.save);

  const genreBtn = event.target.closest("[data-genre]");
  if (genreBtn) {
    activeGenre = genreBtn.dataset.genre;
    renderChips();
    renderBrowse();
  }

  if (event.target.closest("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.modal.hidden) closeModal();
});

els.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchMovies(els.searchInput.value);
});

window.addEventListener("scroll", () => {
  els.nav.classList.toggle("is-solid", window.scrollY > 20);
});

renderHero();
cycleFeatured();
renderRows();
renderWatchlistBadge();
renderChips();
renderBrowse();

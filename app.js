// js/app.js
import {
  db,
  collection,
  onSnapshot,
  query,
  orderBy,
  ITEMS_COLLECTION,
  extractYouTubeId,
} from "./firebase-config.js";

const rowsEl = document.getElementById("rows");
const heroEl = document.getElementById("hero");
const heroTitle = document.getElementById("heroTitle");
const heroDesc = document.getElementById("heroDesc");
const heroEyebrow = document.getElementById("heroEyebrow");
const heroPlayBtn = document.getElementById("heroPlayBtn");
const heroInfoBtn = document.getElementById("heroInfoBtn");
const stateBox = document.getElementById("stateBox");
const nav = document.getElementById("nav");
const categoryNav = document.getElementById("categoryNav");
const searchInput = document.getElementById("searchInput");

const modalBackdrop = document.getElementById("modalBackdrop");
const modalMedia = document.getElementById("modalMedia");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalDesc = document.getElementById("modalDesc");
const modalClose = document.getElementById("modalClose");

let allItems = [];
let activeCategory = "__all__";
let searchTerm = "";
let heroItem = null;

// ── 네비게이션 스크롤 효과 ───────────────────────────────────────
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
});

// ── Firestore 실시간 구독 ────────────────────────────────────────
stateBox.style.display = "block";
stateBox.textContent = "콘텐츠를 불러오는 중...";

const q = query(collection(db, ITEMS_COLLECTION), orderBy("createdAt", "desc"));
onSnapshot(
  q,
  (snapshot) => {
    allItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  },
  (err) => {
    console.error(err);
    stateBox.style.display = "block";
    stateBox.textContent =
      "콘텐츠를 불러오지 못했습니다. Firestore 보안 규칙과 설정을 확인해주세요.";
  }
);

// ── 검색 ─────────────────────────────────────────────────────────
searchInput.addEventListener("input", (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  render();
});

function render() {
  let items = allItems;

  if (searchTerm) {
    items = items.filter((it) => (it.title || "").toLowerCase().includes(searchTerm));
    renderSearchResults(items);
    heroEl.style.display = "none";
    return;
  }

  if (items.length === 0) {
    heroEl.style.display = "none";
    rowsEl.innerHTML = "";
    stateBox.style.display = "block";
    stateBox.innerHTML =
      "아직 등록된 콘텐츠가 없습니다.<br/><br/><a class='nf-admin-link' href='admin.html'>관리자 페이지에서 첫 콘텐츠를 등록해보세요 →</a>";
    categoryNav.innerHTML = `<a href="#" class="active" data-category="__all__">홈</a>`;
    return;
  }

  stateBox.style.display = "none";

  // 히어로: featured 항목 중 최신, 없으면 전체 중 최신
  heroItem = items.find((it) => it.featured) || items[0];
  renderHero(heroItem);

  // 카테고리 목록 (네비게이션)
  const categories = [...new Set(items.map((it) => it.category).filter(Boolean))];
  renderCategoryNav(categories);

  // 카테고리별 행
  renderRows(items, categories);
}

function renderHero(item) {
  if (!item) {
    heroEl.style.display = "none";
    return;
  }
  heroEl.style.display = "flex";
  heroEl.style.backgroundImage = `url("${item.thumbnailUrl}")`;
  heroEyebrow.textContent = item.category ? `${item.category} · MYFLIX 추천` : "MYFLIX 추천";
  heroTitle.textContent = item.title || "";
  heroDesc.textContent = item.description || "";
  heroPlayBtn.onclick = () => openModal(item);
  heroInfoBtn.onclick = () => openModal(item);
}

function renderCategoryNav(categories) {
  const links = [`<a href="#" data-category="__all__" class="${activeCategory === "__all__" ? "active" : ""}">홈</a>`];
  categories.forEach((c) => {
    links.push(
      `<a href="#" data-category="${escapeHtml(c)}" class="${activeCategory === c ? "active" : ""}">${escapeHtml(c)}</a>`
    );
  });
  categoryNav.innerHTML = links.join("");
  categoryNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      activeCategory = a.dataset.category;
      render();
      if (activeCategory !== "__all__") {
        const rowEl = document.getElementById(`row-${slug(activeCategory)}`);
        if (rowEl) rowEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

function renderRows(items, categories) {
  const cats = activeCategory === "__all__" ? categories : categories.filter((c) => c === activeCategory);

  if (cats.length === 0) {
    rowsEl.innerHTML = `<div class="nf-empty-row">이 카테고리에는 아직 콘텐츠가 없습니다.</div>`;
    return;
  }

  rowsEl.innerHTML = cats
    .map((cat) => {
      const catItems = items.filter((it) => it.category === cat);
      return `
        <section class="nf-row" id="row-${slug(cat)}">
          <h3 class="nf-row-title">${escapeHtml(cat)}</h3>
          <div class="nf-row-track-wrap">
            <button class="nf-row-arrow left" data-dir="-1" data-target="track-${slug(cat)}">‹</button>
            <div class="nf-row-track" id="track-${slug(cat)}">
              ${catItems.map(cardHtml).join("")}
            </div>
            <button class="nf-row-arrow right" data-dir="1" data-target="track-${slug(cat)}">›</button>
          </div>
        </section>
      `;
    })
    .join("");

  attachRowInteractions();
}

function renderSearchResults(items) {
  stateBox.style.display = "none";
  if (items.length === 0) {
    rowsEl.innerHTML = `<div class="nf-state" style="padding-top:40px;">"${escapeHtml(
      searchTerm
    )}"에 대한 검색 결과가 없습니다.</div>`;
    return;
  }
  rowsEl.innerHTML = `
    <section class="nf-row" style="margin-top:120px;">
      <h3 class="nf-row-title">검색 결과: "${escapeHtml(searchTerm)}"</h3>
      <div class="nf-row-track-wrap">
        <div class="nf-row-track">
          ${items.map(cardHtml).join("")}
        </div>
      </div>
    </section>
  `;
  attachRowInteractions();
}

function cardHtml(item) {
  const badge = item.type === "youtube" ? "영상" : "사진";
  return `
    <div class="nf-card" data-id="${item.id}">
      <img src="${item.thumbnailUrl}" alt="${escapeHtml(item.title || "")}" loading="lazy" />
      <span class="nf-card-type-badge">${badge}</span>
      <div class="nf-card-overlay"><span>${escapeHtml(item.title || "")}</span></div>
    </div>
  `;
}

function attachRowInteractions() {
  rowsEl.querySelectorAll(".nf-card").forEach((card) => {
    card.addEventListener("click", () => {
      const item = allItems.find((it) => it.id === card.dataset.id);
      if (item) openModal(item);
    });
  });

  rowsEl.querySelectorAll(".nf-row-arrow").forEach((btn) => {
    btn.addEventListener("click", () => {
      const track = document.getElementById(btn.dataset.target);
      if (!track) return;
      const dir = Number(btn.dataset.dir);
      track.scrollBy({ left: dir * (track.clientWidth * 0.85), behavior: "smooth" });
    });
  });
}

// ── 모달 ─────────────────────────────────────────────────────────
function openModal(item) {
  modalTitle.textContent = item.title || "";
  modalCategory.textContent = item.category || "";
  modalDesc.textContent = item.description || "";

  if (item.type === "youtube") {
    const id = item.youtubeId || extractYouTubeId(item.youtubeUrl);
    modalMedia.innerHTML = id
      ? `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" title="${escapeHtml(
          item.title || ""
        )}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">유효한 유튜브 링크가 아닙니다.</div>`;
  } else {
    modalMedia.innerHTML = `<img src="${item.imageUrl || item.thumbnailUrl}" alt="${escapeHtml(item.title || "")}" />`;
  }

  modalBackdrop.style.display = "flex";
}

function closeModal() {
  modalBackdrop.style.display = "none";
  modalMedia.innerHTML = "";
}

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ── 유틸 ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function slug(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "") || "row";
}

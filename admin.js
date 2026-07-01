// js/admin.js
import {
  db,
  auth,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  uploadToCloudinary,
  extractYouTubeId,
  ITEMS_COLLECTION,
} from "./firebase-config.js";

// ── DOM refs ───────────────────────────────────────────────────
const loginBox = document.getElementById("loginBox");
const adminWrap = document.getElementById("adminWrap");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const userLabel = document.getElementById("userLabel");

const itemForm = document.getElementById("itemForm");
const formHeading = document.getElementById("formHeading");
const fieldTitle = document.getElementById("fieldTitle");
const fieldCategory = document.getElementById("fieldCategory");
const fieldOrder = document.getElementById("fieldOrder");
const fieldDesc = document.getElementById("fieldDesc");
const typeBtnYoutube = document.getElementById("typeBtnYoutube");
const typeBtnImage = document.getElementById("typeBtnImage");
const youtubeField = document.getElementById("youtubeField");
const imageField = document.getElementById("imageField");
const fieldYoutube = document.getElementById("fieldYoutube");
const fieldImageFile = document.getElementById("fieldImageFile");
const imageProgress = document.getElementById("imageProgress");
const imagePreview = document.getElementById("imagePreview");
const fieldThumbFile = document.getElementById("fieldThumbFile");
const thumbProgress = document.getElementById("thumbProgress");
const thumbPreview = document.getElementById("thumbPreview");
const fieldFeatured = document.getElementById("fieldFeatured");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formError = document.getElementById("formError");
const itemList = document.getElementById("itemList");
const itemCount = document.getElementById("itemCount");
const categoryList = document.getElementById("categoryList");

let currentType = "youtube";
let uploadedImageUrl = null;
let uploadedThumbUrl = null;
let allItems = [];
let editingId = null;

// ── 인증 ───────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBox.style.display = "none";
    adminWrap.style.display = "block";
    logoutBtn.style.display = "inline-block";
    userLabel.textContent = user.email;
    subscribeItems();
  } else {
    loginBox.style.display = "block";
    adminWrap.style.display = "none";
    logoutBtn.style.display = "none";
  }
});

loginBtn.addEventListener("click", async () => {
  loginError.textContent = "";
  loginBtn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = "로그인 실패: 이메일 또는 비밀번호를 확인하세요.";
    console.error(err);
  } finally {
    loginBtn.disabled = false;
  }
});

loginPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => signOut(auth));

// ── 콘텐츠 유형 토글 ───────────────────────────────────────────
typeBtnYoutube.addEventListener("click", () => setType("youtube"));
typeBtnImage.addEventListener("click", () => setType("image"));

function setType(type) {
  currentType = type;
  typeBtnYoutube.classList.toggle("active", type === "youtube");
  typeBtnImage.classList.toggle("active", type === "image");
  youtubeField.style.display = type === "youtube" ? "block" : "none";
  imageField.style.display = type === "image" ? "block" : "none";
}

// ── 이미지 업로드 (본문 이미지) ────────────────────────────────
fieldImageFile.addEventListener("change", async () => {
  const file = fieldImageFile.files[0];
  if (!file) return;
  imagePreview.textContent = "업로드 중...";
  try {
    uploadedImageUrl = await uploadToCloudinary(file, (pct) => {
      imageProgress.style.width = pct + "%";
    });
    imagePreview.innerHTML = `<img src="${uploadedImageUrl}" />`;
  } catch (err) {
    imagePreview.textContent = "업로드 실패";
    formError.textContent = "이미지 업로드 중 오류가 발생했습니다: " + err.message;
    console.error(err);
  }
});

// ── 썸네일 업로드 ──────────────────────────────────────────────
fieldThumbFile.addEventListener("change", async () => {
  const file = fieldThumbFile.files[0];
  if (!file) return;
  thumbPreview.textContent = "업로드 중...";
  try {
    uploadedThumbUrl = await uploadToCloudinary(file, (pct) => {
      thumbProgress.style.width = pct + "%";
    });
    thumbPreview.innerHTML = `<img src="${uploadedThumbUrl}" />`;
  } catch (err) {
    thumbPreview.textContent = "업로드 실패";
    formError.textContent = "썸네일 업로드 중 오류가 발생했습니다: " + err.message;
    console.error(err);
  }
});

// ── Firestore 구독 (목록) ──────────────────────────────────────
function subscribeItems() {
  const q = query(collection(db, ITEMS_COLLECTION), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    allItems = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderList();
    renderCategoryDatalist();
  });
}

function renderCategoryDatalist() {
  const cats = [...new Set(allItems.map((it) => it.category).filter(Boolean))];
  categoryList.innerHTML = cats.map((c) => `<option value="${escapeHtml(c)}"></option>`).join("");
}

function renderList() {
  itemCount.textContent = allItems.length;
  if (allItems.length === 0) {
    itemList.innerHTML = `<div style="color:var(--nf-text-dim); font-size:14px;">아직 등록된 콘텐츠가 없습니다.</div>`;
    return;
  }
  itemList.innerHTML = allItems
    .map(
      (it) => `
      <div class="ad-list-item">
        <div class="ad-list-thumb"><img src="${it.thumbnailUrl}" /></div>
        <div class="ad-list-info">
          <div class="t">${escapeHtml(it.title || "")}</div>
          <div class="c">${escapeHtml(it.category || "")} · ${it.type === "youtube" ? "영상" : "사진"}${
        it.featured ? " · ⭐ 추천" : ""
      }</div>
        </div>
        <div class="ad-list-actions">
          <button class="ad-icon-btn" data-action="edit" data-id="${it.id}" title="수정">✎</button>
          <button class="ad-icon-btn danger" data-action="delete" data-id="${it.id}" title="삭제">🗑</button>
        </div>
      </div>
    `
    )
    .join("");

  itemList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.id));
  });
  itemList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.id));
  });
}

// ── 등록/수정 폼 제출 ──────────────────────────────────────────
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  const title = fieldTitle.value.trim();
  const category = fieldCategory.value.trim();
  const description = fieldDesc.value.trim();
  const order = Number(fieldOrder.value) || 0;
  const featured = fieldFeatured.checked;

  if (!title || !category) {
    formError.textContent = "제목과 카테고리는 필수입니다.";
    return;
  }

  const thumbnailUrl = uploadedThumbUrl || (editingId ? currentEditThumb : null);
  if (!thumbnailUrl) {
    formError.textContent = "썸네일 이미지를 업로드해주세요.";
    return;
  }

  let payload = {
    title,
    category,
    description,
    order,
    featured,
    thumbnailUrl,
    type: currentType,
  };

  if (currentType === "youtube") {
    const ytId = extractYouTubeId(fieldYoutube.value.trim());
    if (!ytId) {
      formError.textContent = "유효한 유튜브 링크를 입력해주세요.";
      return;
    }
    payload.youtubeUrl = fieldYoutube.value.trim();
    payload.youtubeId = ytId;
    payload.imageUrl = null;
  } else {
    const imageUrl = uploadedImageUrl || (editingId ? currentEditImage : null);
    if (!imageUrl) {
      formError.textContent = "본문 이미지를 업로드해주세요.";
      return;
    }
    payload.imageUrl = imageUrl;
    payload.youtubeUrl = null;
    payload.youtubeId = null;
  }

  submitBtn.disabled = true;
  try {
    if (editingId) {
      await updateDoc(doc(db, ITEMS_COLLECTION, editingId), payload);
      showToast("콘텐츠가 수정되었습니다.");
    } else {
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, ITEMS_COLLECTION), payload);
      showToast("콘텐츠가 등록되었습니다.");
    }
    resetForm();
  } catch (err) {
    formError.textContent = "저장 중 오류가 발생했습니다: " + err.message;
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});

let currentEditThumb = null;
let currentEditImage = null;

function startEdit(id) {
  const item = allItems.find((it) => it.id === id);
  if (!item) return;
  editingId = id;
  currentEditThumb = item.thumbnailUrl;
  currentEditImage = item.imageUrl;
  uploadedThumbUrl = null;
  uploadedImageUrl = null;

  formHeading.textContent = "콘텐츠 수정";
  submitBtn.textContent = "수정 저장";
  cancelEditBtn.style.display = "inline-block";

  fieldTitle.value = item.title || "";
  fieldCategory.value = item.category || "";
  fieldOrder.value = item.order || 0;
  fieldDesc.value = item.description || "";
  fieldFeatured.checked = !!item.featured;

  setType(item.type || "youtube");
  fieldYoutube.value = item.youtubeUrl || "";

  thumbPreview.innerHTML = item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" />` : "미리보기 없음";
  imagePreview.innerHTML = item.imageUrl ? `<img src="${item.imageUrl}" />` : "미리보기 없음";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

cancelEditBtn.addEventListener("click", resetForm);

function resetForm() {
  editingId = null;
  currentEditThumb = null;
  currentEditImage = null;
  uploadedThumbUrl = null;
  uploadedImageUrl = null;
  itemForm.reset();
  fieldOrder.value = 0;
  setType("youtube");
  thumbPreview.innerHTML = "미리보기 없음";
  imagePreview.innerHTML = "미리보기 없음";
  thumbProgress.style.width = "0%";
  imageProgress.style.width = "0%";
  formHeading.textContent = "새 콘텐츠 등록";
  submitBtn.textContent = "등록하기";
  cancelEditBtn.style.display = "none";
  formError.textContent = "";
}

async function handleDelete(id) {
  const item = allItems.find((it) => it.id === id);
  if (!confirm(`"${item?.title || ""}" 콘텐츠를 삭제하시겠습니까?`)) return;
  try {
    await deleteDoc(doc(db, ITEMS_COLLECTION, id));
    showToast("삭제되었습니다.");
    if (editingId === id) resetForm();
  } catch (err) {
    showToast("삭제 실패: " + err.message, true);
    console.error(err);
  }
}

// ── 토스트 알림 ────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const el = document.createElement("div");
  el.className = "ad-toast" + (isError ? " error" : "");
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

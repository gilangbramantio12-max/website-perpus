/**
 * PustakaHub - Main Application Logic
 */

// Global State
const AppState = {
  books: [],
  loans: [],
  bookmarks: [],
  selectedCategory: "Semua",
  searchQuery: "",
  availabilityFilter: "all",
  sortBy: "popular",
  currentRole: "user", // 'user' or 'admin'
  isDark: false,
  selectedBookForBorrow: null
};

// Storage Keys
const STORAGE_KEYS = {
  BOOKS: "pustakahub_books_v1",
  LOANS: "pustakahub_loans_v1",
  BOOKMARKS: "pustakahub_bookmarks_v1",
  THEME: "pustakahub_theme"
};

// Initialize Data
function initStorage() {
  const storedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
  if (!storedBooks) {
    AppState.books = [...INITIAL_BOOKS];
    saveBooks();
  } else {
    try {
      AppState.books = JSON.parse(storedBooks);
    } catch {
      AppState.books = [...INITIAL_BOOKS];
    }
  }

  const storedLoans = localStorage.getItem(STORAGE_KEYS.LOANS);
  if (!storedLoans) {
    AppState.loans = [...INITIAL_LOANS];
    saveLoans();
  } else {
    try {
      AppState.loans = JSON.parse(storedLoans);
    } catch {
      AppState.loans = [...INITIAL_LOANS];
    }
  }

  const storedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  AppState.bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];

  // Sinkronisasi status sirkulasi (terlambat / aktif)
  syncLoanStatuses();

  // Theme Init
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  AppState.isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
  applyTheme();
}

function saveBooks() {
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(AppState.books));
}

function saveLoans() {
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(AppState.loans));
}

function saveBookmarks() {
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(AppState.bookmarks));
}

function applyTheme() {
  if (AppState.isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem(STORAGE_KEYS.THEME, AppState.isDark ? "dark" : "light");
  
  const themeIcon = document.getElementById("theme-toggle-icon");
  if (themeIcon) {
    themeIcon.className = AppState.isDark ? "fas fa-sun text-yellow-400 text-lg" : "fas fa-moon text-slate-600 text-lg";
  }
}

function toggleTheme() {
  AppState.isDark = !AppState.isDark;
  applyTheme();
}

// Toast Notifications
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bgColors = {
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
    warning: "bg-amber-600 text-white",
    info: "bg-blue-600 text-white"
  };
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };

  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${bgColors[type] || bgColors.success}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.success} text-base"></i>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="opacity-75 hover:opacity-100 transition">
      <i class="fas fa-xmark text-sm"></i>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Format Currency
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(number);
}

// Date Helpers
function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function calculateDaysDifference(targetDateString) {
  if (!targetDateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = targetDateString.split("-");
  const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function syncLoanStatuses() {
  AppState.loans.forEach(loan => {
    if (loan.status !== "returned") {
      const diff = calculateDaysDifference(loan.dueDate);
      loan.status = diff < 0 ? "overdue" : "active";
    }
  });
}

// Render Category Filter Pills
function renderCategories() {
  const container = document.getElementById("category-pills");
  if (!container) return;

  container.innerHTML = INITIAL_CATEGORIES.map(category => {
    const isActive = AppState.selectedCategory === category;
    return `
      <button 
        onclick="setCategory('${category}')"
        class="px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap shadow-sm ${
          isActive 
            ? "bg-blue-600 text-white shadow-blue-500/30 scale-105" 
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
        }">
        ${category}
      </button>
    `;
  }).join("");
}

function setCategory(category) {
  AppState.selectedCategory = category;
  renderCategories();
  renderBooks();
}

// Filtering & Sorting Books
function getFilteredBooks() {
  return AppState.books.filter(book => {
    // Category match
    const matchCategory = AppState.selectedCategory === "Semua" || book.category === AppState.selectedCategory;

    // Search query match
    const q = AppState.searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      book.title.toLowerCase().includes(q) || 
      book.author.toLowerCase().includes(q) || 
      book.isbn.toLowerCase().includes(q) ||
      book.synopsis.toLowerCase().includes(q);

    // Availability & Favorite match
    let matchAvailability = true;
    if (AppState.availabilityFilter === "available") {
      matchAvailability = book.available > 0;
    } else if (AppState.availabilityFilter === "unavailable") {
      matchAvailability = book.available === 0;
    } else if (AppState.availabilityFilter === "favorite") {
      matchAvailability = AppState.bookmarks.includes(book.id);
    }

    return matchCategory && matchSearch && matchAvailability;
  }).sort((a, b) => {
    if (AppState.sortBy === "title") return a.title.localeCompare(b.title);
    if (AppState.sortBy === "year") return b.year - a.year;
    if (AppState.sortBy === "rating") return b.rating - a.rating;
    // Default popular: based on rating & total stock
    return (b.rating * b.stock) - (a.rating * a.stock);
  });
}

// Render Books Grid
function renderBooks() {
  const container = document.getElementById("books-grid");
  const countBadge = document.getElementById("book-count-badge");
  if (!container) return;

  const filtered = getFilteredBooks();
  if (countBadge) countBadge.textContent = `${filtered.length} Buku`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 text-3xl">
          <i class="fas fa-book-open"></i>
        </div>
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Buku Tidak Ditemukan</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Coba ganti kata kunci pencarian atau pilih kategori lain.
        </p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          Reset Filter Pencarian
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(book => {
    const isBookmarked = AppState.bookmarks.includes(book.id);
    const isAvailable = book.available > 0;

    return `
      <div class="book-card bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between group">
        <div>
          <!-- Cover & Quick Badge -->
          <div class="relative overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer" onclick="openBookDetail('${book.id}')">
            <img 
              src="${book.cover}" 
              alt="${book.title}" 
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80'"
              class="book-cover-img w-full h-56 object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span class="text-xs text-white bg-blue-600/90 backdrop-blur px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5">
                <i class="fas fa-eye text-[10px]"></i> Lihat Detail
              </span>
            </div>

            <!-- Availability Badge -->
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur shadow-sm ${
                isAvailable 
                  ? "bg-emerald-500/90 text-white" 
                  : "bg-rose-500/90 text-white"
              }">
                ${isAvailable ? `Tersedia (${book.available})` : "Habis Dipinjam"}
              </span>
            </div>

            <!-- Bookmark Button -->
            <button 
              onclick="event.stopPropagation(); toggleBookmark('${book.id}')" 
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-amber-500 shadow-md transition"
              title="${isBookmarked ? "Hapus dari Favorit" : "Simpan ke Favorit"}">
              <i class="${isBookmarked ? "fas fa-bookmark text-amber-500" : "far fa-bookmark"} text-sm"></i>
            </button>
          </div>

          <!-- Content Details -->
          <div class="p-4 sm:p-5">
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span class="font-medium text-blue-600 dark:text-blue-400">${book.category}</span>
              <div class="flex items-center gap-1 text-amber-400 font-bold">
                <i class="fas fa-star text-xs"></i>
                <span class="text-slate-700 dark:text-slate-200">${book.rating}</span>
              </div>
            </div>

            <h3 
              onclick="openBookDetail('${book.id}')"
              class="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition">
              ${book.title}
            </h3>

            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <i class="fas fa-user-pen text-[10px] text-slate-400"></i> ${book.author} (${book.year})
            </p>

            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
              ${book.synopsis}
            </p>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="p-4 pt-0 sm:p-5 sm:pt-0">
          <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
            <div class="text-xs text-slate-500 dark:text-slate-400">
              <span class="block text-[10px] uppercase font-semibold text-slate-400">Lokasi</span>
              <span class="font-medium text-slate-700 dark:text-slate-300">${book.rack}</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                onclick="openBookDetail('${book.id}')" 
                class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                Detail
              </button>
              
              <button 
                onclick="initiateBorrow('${book.id}')"
                ${!isAvailable ? "disabled" : ""} 
                class="px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 ${
                  isAvailable 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-95" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                }">
                <i class="fas fa-hand-holding-hand text-xs"></i>
                ${isAvailable ? "Pinjam" : "Kosong"}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Reset Filters
function resetFilters() {
  AppState.selectedCategory = "Semua";
  AppState.searchQuery = "";
  AppState.availabilityFilter = "all";
  AppState.sortBy = "popular";

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  const availabilitySelect = document.getElementById("availability-filter");
  if (availabilitySelect) availabilitySelect.value = "all";

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "popular";

  renderCategories();
  renderBooks();
}

// Bookmarks (Favorit)
function toggleBookmark(bookId) {
  const index = AppState.bookmarks.indexOf(bookId);
  if (index > -1) {
    AppState.bookmarks.splice(index, 1);
    showToast("Dihapus dari daftar favorit", "info");
  } else {
    AppState.bookmarks.push(bookId);
    showToast("Berhasil ditambahkan ke daftar favorit", "success");
  }
  saveBookmarks();
  updateBookmarkBadge();
  renderBooks();
}

function filterFavorites() {
  setRole('user');
  const availSelect = document.getElementById("availability-filter");
  if (availSelect) {
    if (AppState.availabilityFilter === "favorite") {
      // Toggle back to all if already active
      availSelect.value = "all";
      AppState.availabilityFilter = "all";
      showToast("Menampilkan semua koleksi buku", "info");
    } else {
      availSelect.value = "favorite";
      AppState.availabilityFilter = "favorite";
      showToast(`Menampilkan ${AppState.bookmarks.length} buku favorit Anda`, "info");
    }
    renderBooks();
  }
}

function updateBookmarkBadge() {
  const badge = document.getElementById("bookmark-badge");
  if (badge) {
    badge.textContent = AppState.bookmarks.length;
    badge.style.display = AppState.bookmarks.length > 0 ? "flex" : "none";
  }
}

// Book Detail Modal
function openBookDetail(bookId) {
  const book = AppState.books.find(b => b.id === bookId);
  if (!book) return;

  const modal = document.getElementById("book-detail-modal");
  const content = document.getElementById("book-detail-content");
  if (!modal || !content) return;

  const isAvailable = book.available > 0;
  const isBookmarked = AppState.bookmarks.includes(book.id);

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <div class="md:col-span-5 relative">
        <img 
          src="${book.cover}" 
          alt="${book.title}" 
          class="w-full rounded-2xl shadow-lg object-cover max-h-[380px] mx-auto"
        />
        <div class="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Kondisi Fisik: <strong>Bagus</strong></span>
          <span>Rating: <strong>⭐ ${book.rating} / 5.0</strong></span>
        </div>
      </div>

      <div class="md:col-span-7 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              ${book.category}
            </span>
            <span class="px-2.5 py-1 rounded-lg text-xs font-semibold ${
              isAvailable ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
            }">
              ${isAvailable ? `Stok: ${book.available} dari ${book.stock}` : "Sedang Kosong"}
            </span>
          </div>

          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
            ${book.title}
          </h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Penulis: <span class="font-semibold text-slate-800 dark:text-slate-200">${book.author}</span></p>

          <div class="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400 block">Nomor ISBN</span>
              <span class="font-mono font-medium text-slate-800 dark:text-slate-200">${book.isbn}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Penerbit</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${book.publisher}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Tahun Terbit / Tebal</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${book.year} • ${book.pages} Halaman</span>
            </div>
            <div>
              <span class="text-slate-400 block">Lokasi Rak</span>
              <span class="font-semibold text-blue-600 dark:text-blue-400"><i class="fas fa-location-dot"></i> ${book.rack}</span>
            </div>
          </div>

          <div class="mt-4">
            <h4 class="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">Sinopsis</h4>
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-40 overflow-y-auto pr-1">
              ${book.synopsis}
            </p>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button 
            onclick="toggleBookmark('${book.id}')"
            class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold transition flex items-center gap-2">
            <i class="${isBookmarked ? "fas fa-bookmark text-amber-500" : "far fa-bookmark"}"></i>
            ${isBookmarked ? "Tersimpan" : "Simpan"}
          </button>

          <div class="flex items-center gap-2">
            <button 
              onclick="closeModal('book-detail-modal')"
              class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold transition">
              Tutup
            </button>
            <button 
              onclick="closeModal('book-detail-modal'); initiateBorrow('${book.id}')"
              ${!isAvailable ? "disabled" : ""}
              class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition flex items-center gap-2 ${
                isAvailable ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25" : "bg-slate-400 cursor-not-allowed"
              }">
              <i class="fas fa-hand-holding-hand"></i> Pinjam Buku Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Borrowing Workflow
function initiateBorrow(bookId) {
  const book = AppState.books.find(b => b.id === bookId);
  if (!book || book.available <= 0) {
    showToast("Maaf, stok buku ini sedang habis dipinjam.", "error");
    return;
  }

  AppState.selectedBookForBorrow = book;
  const modal = document.getElementById("borrow-modal");
  const bookPreview = document.getElementById("borrow-book-preview");
  const borrowDurationSelect = document.getElementById("borrow-duration");

  if (!modal || !bookPreview) return;

  bookPreview.innerHTML = `
    <div class="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
      <img src="${book.cover}" alt="${book.title}" class="w-14 h-20 object-cover rounded-lg shadow-sm">
      <div class="flex flex-col justify-center">
        <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">${book.category}</span>
        <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">${book.title}</h4>
        <span class="text-xs text-slate-500 dark:text-slate-400">Penulis: ${book.author}</span>
        <span class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">${book.rack}</span>
      </div>
    </div>
  `;

  // Update due date estimate
  updateDueDateEstimate();

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function updateDueDateEstimate() {
  const durationDays = parseInt(document.getElementById("borrow-duration").value || 7, 10);
  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(now.getDate() + durationDays);

  const dueDateEl = document.getElementById("estimated-due-date");
  if (dueDateEl) {
    dueDateEl.textContent = dueDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
}

function handleBorrowSubmit(e) {
  e.preventDefault();
  if (!AppState.selectedBookForBorrow) return;

  const borrowerName = document.getElementById("borrower-name").value.trim();
  const borrowerId = document.getElementById("borrower-id").value.trim();
  const borrowerPhone = document.getElementById("borrower-phone").value.trim();
  const durationDays = parseInt(document.getElementById("borrow-duration").value, 10);

  if (!borrowerName || !borrowerId) {
    showToast("Harap isi Nama Lengkap dan Nomor Identitas/NIM.", "warning");
    return;
  }

  const book = AppState.selectedBookForBorrow;
  if (book.available <= 0) {
    showToast("Stok buku sudah habis.", "error");
    closeModal("borrow-modal");
    return;
  }

  // Calculate Dates
  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(now.getDate() + durationDays);

  const transactionId = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;

  const newLoan = {
    id: transactionId,
    bookId: book.id,
    bookTitle: book.title,
    bookCover: book.cover,
    borrowerName,
    borrowerId,
    borrowerPhone,
    borrowDate: now.toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    returnDate: null,
    status: "active",
    finePerDay: 1000
  };

  // Update book availability
  book.available -= 1;
  saveBooks();

  // Add loan
  AppState.loans.unshift(newLoan);
  saveLoans();

  // Reset form
  document.getElementById("borrow-form").reset();
  closeModal("borrow-modal");

  // Refresh Views
  renderBooks();
  updateLoanBadge();

  // Show digital receipt
  showBorrowReceipt(newLoan, book);
  showToast(`Peminjaman Berhasil! Kode: ${transactionId}`, "success");
}

// Receipt Modal
function showBorrowReceipt(loan, book) {
  const modal = document.getElementById("receipt-modal");
  const content = document.getElementById("receipt-content");
  if (!modal || !content) return;

  content.innerHTML = `
    <div id="receipt-print-area" class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
      <div class="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center text-xl mb-2">
          <i class="fas fa-book-bookmark"></i>
        </div>
        <h3 class="font-extrabold text-lg tracking-tight">PUSTAKAHUB DIGITAL</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">Bukti Peminjaman Buku Resmi</p>
        <span class="inline-block mt-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-mono text-xs font-bold">
          ${loan.id}
        </span>
      </div>

      <div class="py-4 space-y-2.5 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">Nama Peminjam:</span>
          <span class="font-bold text-slate-800 dark:text-slate-200">${loan.borrowerName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">NIM / ID Anggota:</span>
          <span class="font-mono text-slate-800 dark:text-slate-200">${loan.borrowerId}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Judul Buku:</span>
          <span class="font-semibold text-right max-w-[200px] truncate text-slate-800 dark:text-slate-200">${loan.bookTitle}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Tanggal Pinjam:</span>
          <span>${formatDate(loan.borrowDate)}</span>
        </div>
        <div class="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
          <span>Batas Pengembalian:</span>
          <span>${formatDate(loan.dueDate)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Tarif Denda Telat:</span>
          <span>${formatRupiah(loan.finePerDay)} / hari</span>
        </div>
      </div>

      <div class="pt-4 border-t border-dashed border-slate-300 dark:border-slate-700 text-center">
        <div class="font-mono text-sm tracking-widest text-slate-400 dark:text-slate-500">
          * ${loan.id} *
        </div>
        <p class="text-[10px] text-slate-400 mt-2">
          Harap kembalikan buku tepat waktu sebelum tanggal jatuh tempo untuk menghindari denda keterlambatan.
        </p>
      </div>
    </div>

    <div class="mt-4 flex gap-3">
      <button onclick="window.print()" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2">
        <i class="fas fa-print"></i> Cetak Struk
      </button>
      <button onclick="closeModal('receipt-modal')" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition">
        Selesai
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Active Loans & Returns Management (Buku Saya)
function openActiveLoansModal() {
  const modal = document.getElementById("active-loans-modal");
  const container = document.getElementById("active-loans-list");
  if (!modal || !container) return;

  const activeLoans = AppState.loans.filter(l => l.status === "active" || l.status === "overdue");

  if (activeLoans.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-2xl">
          <i class="fas fa-box-open"></i>
        </div>
        <h4 class="font-bold text-slate-800 dark:text-slate-200">Tidak Ada Peminjaman Aktif</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Anda belum memiliki buku yang sedang dipinjam saat ini.</p>
      </div>
    `;
  } else {
    container.innerHTML = activeLoans.map(loan => {
      const daysLeft = calculateDaysDifference(loan.dueDate);
      const isLate = daysLeft < 0;
      const lateDays = isLate ? Math.abs(daysLeft) : 0;
      const fineAmount = lateDays * (loan.finePerDay || 1000);

      return `
        <div class="p-4 rounded-xl border ${isLate ? "border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/60" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80"} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              isLate ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50" : "bg-blue-100 text-blue-600 dark:bg-blue-900/50"
            }">
              <i class="fas ${isLate ? "fa-clock" : "fa-book"}"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold text-slate-500">${loan.id}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isLate ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                }">
                  ${isLate ? `Terlambat ${lateDays} Hari` : `${daysLeft} Hari Lagi`}
                </span>
              </div>
              <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">${loan.bookTitle}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">Peminjam: <strong class="text-slate-700 dark:text-slate-300">${loan.borrowerName}</strong> (${loan.borrowerId})</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">Tempo: ${formatDate(loan.dueDate)}</p>
              ${isLate ? `<p class="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">Denda: ${formatRupiah(fineAmount)}</p>` : ""}
            </div>
          </div>

          <button 
            onclick="returnBook('${loan.id}')"
            class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              isLate 
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            }">
            <i class="fas fa-check"></i> Kembalikan Buku
          </button>
        </div>
      `;
    }).join("");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function returnBook(loanId) {
  const loan = AppState.loans.find(l => l.id === loanId);
  if (!loan) return;

  const daysLeft = calculateDaysDifference(loan.dueDate);
  const isLate = daysLeft < 0;
  const lateDays = isLate ? Math.abs(daysLeft) : 0;
  const fine = lateDays * (loan.finePerDay || 1000);

  let confirmMsg = `Konfirmasi pengembalian buku "${loan.bookTitle}"?`;
  if (isLate) {
    confirmMsg += `\n\nPeringatan: Buku terlambat ${lateDays} hari. Denda yang harus dibayar: ${formatRupiah(fine)}.`;
  }

  if (!confirm(confirmMsg)) return;

  // Update loan
  loan.status = "returned";
  loan.returnDate = new Date().toISOString().split("T")[0];
  loan.fineAmount = fine;
  saveLoans();

  // Restore book stock
  const book = AppState.books.find(b => b.id === loan.bookId);
  if (book && book.available < book.stock) {
    book.available += 1;
    saveBooks();
  }

  showToast(`Buku "${loan.bookTitle}" berhasil dikembalikan!`, "success");
  updateLoanBadge();
  renderBooks();

  const activeLoansModal = document.getElementById("active-loans-modal");
  if (activeLoansModal && !activeLoansModal.classList.contains("hidden")) {
    openActiveLoansModal(); // Refresh modal view only if currently open
  }
  
  if (AppState.currentRole === "admin") {
    renderAdminStats();
    renderAdminLoansTable();
  }
}

function updateLoanBadge() {
  const badge = document.getElementById("loan-badge");
  const activeCount = AppState.loans.filter(l => l.status === "active" || l.status === "overdue").length;
  if (badge) {
    badge.textContent = activeCount;
    badge.style.display = activeCount > 0 ? "flex" : "none";
  }
}

// Modal Helpers
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// Role Switcher
function setRole(role) {
  AppState.currentRole = role;
  const catalogView = document.getElementById("catalog-view");
  const adminView = document.getElementById("admin-view");
  const roleUserBtn = document.getElementById("role-user-btn");
  const roleAdminBtn = document.getElementById("role-admin-btn");

  if (role === "admin") {
    catalogView.classList.add("hidden");
    adminView.classList.remove("hidden");
    roleAdminBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm";
    roleUserBtn.className = "px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
    initAdminDashboard();
    showToast("Masuk ke Mode Admin / Pustakawan", "info");
  } else {
    catalogView.classList.remove("hidden");
    adminView.classList.add("hidden");
    roleUserBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm";
    roleAdminBtn.className = "px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
    renderBooks();
    showToast("Beralih ke Mode Pengunjung", "info");
  }
}

// Reset System Data
function resetAllData() {
  if (confirm("Apakah Anda yakin ingin mereset seluruh data kembali ke data awal? Riwayat peminjaman dan penambahan buku akan direset.")) {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    initStorage();
    renderCategories();
    renderBooks();
    updateLoanBadge();
    updateBookmarkBadge();
    if (AppState.currentRole === "admin") {
      initAdminDashboard();
    }
    showToast("Data sistem berhasil direset ke pengaturan awal.", "success");
  }
}

// Global Event Listeners on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  renderCategories();
  renderBooks();
  updateLoanBadge();
  updateBookmarkBadge();

  // Search input with immediate reaction
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      AppState.searchQuery = e.target.value;
      renderBooks();
    });
  }

  // Filter selects
  const availabilityFilter = document.getElementById("availability-filter");
  if (availabilityFilter) {
    availabilityFilter.addEventListener("change", (e) => {
      AppState.availabilityFilter = e.target.value;
      renderBooks();
    });
  }

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      AppState.sortBy = e.target.value;
      renderBooks();
    });
  }

  // Borrow form submit
  const borrowForm = document.getElementById("borrow-form");
  if (borrowForm) {
    borrowForm.addEventListener("submit", handleBorrowSubmit);
  }

  const durationSelect = document.getElementById("borrow-duration");
  if (durationSelect) {
    durationSelect.addEventListener("change", updateDueDateEstimate);
  }

  // Modal backdrop click to close
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.add("hidden");
        backdrop.classList.remove("flex");
      }
    });
  });
});

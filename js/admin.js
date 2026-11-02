/**
 * PustakaHub - Admin & Librarian Management Logic
 */

let editingBookId = null;

function initAdminDashboard() {
  renderAdminStats();
  renderAdminBooksTable();
  renderAdminLoansTable();
  populateCategoryDropdown();
}

// Calculate and Render Overview Metrics
function renderAdminStats() {
  const totalTitles = AppState.books.length;
  const totalExemplars = AppState.books.reduce((acc, b) => acc + (parseInt(b.stock) || 0), 0);
  const activeLoans = AppState.loans.filter(l => l.status === "active" || l.status === "overdue").length;
  const completedLoans = AppState.loans.filter(l => l.status === "returned").length;

  // Calculate collected fine from returned loans + pending fines
  const totalFine = AppState.loans.reduce((acc, l) => {
    if (l.fineAmount) return acc + l.fineAmount;
    if (l.status === "overdue" || l.status === "active") {
      const daysLeft = calculateDaysDifference(l.dueDate);
      if (daysLeft < 0) {
        return acc + (Math.abs(daysLeft) * (l.finePerDay || 1000));
      }
    }
    return acc;
  }, 0);

  const statTitlesEl = document.getElementById("stat-total-titles");
  const statExemplarsEl = document.getElementById("stat-total-exemplars");
  const statActiveLoansEl = document.getElementById("stat-active-loans");
  const statCompletedLoansEl = document.getElementById("stat-completed-loans");
  const statTotalFineEl = document.getElementById("stat-total-fine");

  if (statTitlesEl) statTitlesEl.textContent = totalTitles;
  if (statExemplarsEl) statExemplarsEl.textContent = totalExemplars;
  if (statActiveLoansEl) statActiveLoansEl.textContent = activeLoans;
  if (statCompletedLoansEl) statCompletedLoansEl.textContent = completedLoans;
  if (statTotalFineEl) statTotalFineEl.textContent = formatRupiah(totalFine);
}

// Populate Categories inside Modal Select
function populateCategoryDropdown() {
  const select = document.getElementById("book-category-input");
  if (!select) return;

  const cats = INITIAL_CATEGORIES.filter(c => c !== "Semua");
  select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

// Render Admin Book Table
function renderAdminBooksTable() {
  const tbody = document.getElementById("admin-books-tbody");
  const search = (document.getElementById("admin-book-search")?.value || "").toLowerCase().trim();
  if (!tbody) return;

  const books = AppState.books.filter(b => {
    return !search || 
      b.title.toLowerCase().includes(search) || 
      b.author.toLowerCase().includes(search) || 
      b.isbn.toLowerCase().includes(search) ||
      b.category.toLowerCase().includes(search);
  });

  if (books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-slate-400 text-xs">
          Tidak ada data buku yang sesuai dengan pencarian.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = books.map((b, index) => {
    const isAvail = b.available > 0;
    return `
      <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800">
        <td class="py-3 px-4 text-xs font-mono text-slate-400">${index + 1}</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${b.cover}" alt="${b.title}" class="w-9 h-12 object-cover rounded shadow-xs" onerror="this.src='https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&fit=crop'">
            <div>
              <div class="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[200px]">${b.title}</div>
              <div class="text-[11px] text-slate-500 font-mono">${b.isbn}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
          <div>${b.author}</div>
          <div class="text-[10px] text-slate-400">${b.category}</div>
        </td>
        <td class="py-3 px-4 text-xs">
          <span class="font-semibold text-slate-800 dark:text-slate-200">${b.available}</span> / ${b.stock}
          <span class="inline-block ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
            isAvail ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
          }">
            ${isAvail ? "Siap" : "Habis"}
          </span>
        </td>
        <td class="py-3 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">${b.rack}</td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button 
              onclick="openEditBookModal('${b.id}')" 
              class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition flex items-center justify-center text-xs"
              title="Edit Data Buku">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button 
              onclick="deleteBook('${b.id}')" 
              class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition flex items-center justify-center text-xs"
              title="Hapus Buku">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Render Admin Circulation Loans Table
function renderAdminLoansTable() {
  const tbody = document.getElementById("admin-loans-tbody");
  const filterStatus = document.getElementById("admin-loan-filter-status")?.value || "all";
  if (!tbody) return;

  const loans = AppState.loans.filter(l => {
    if (filterStatus === "active") return l.status === "active";
    if (filterStatus === "overdue") return l.status === "overdue";
    if (filterStatus === "returned") return l.status === "returned";
    return true;
  });

  if (loans.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-slate-400 text-xs">
          Tidak ada data transaksi peminjaman dalam status ini.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = loans.map(l => {
    const daysLeft = calculateDaysDifference(l.dueDate);
    const isLate = l.status !== "returned" && daysLeft < 0;
    const lateDays = isLate ? Math.abs(daysLeft) : 0;
    const fine = isLate ? lateDays * (l.finePerDay || 1000) : (l.fineAmount || 0);

    let statusBadge = "";
    if (l.status === "returned") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Selesai</span>`;
    } else if (isLate || l.status === "overdue") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">Terlambat (+${lateDays}h)</span>`;
    } else {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Aktif (${daysLeft}h lagi)</span>`;
    }

    return `
      <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition border-b border-slate-100 dark:border-slate-800">
        <td class="py-3 px-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">${l.id}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-xs text-slate-900 dark:text-slate-100">${l.borrowerName}</div>
          <div class="text-[11px] text-slate-500 font-mono">${l.borrowerId}</div>
        </td>
        <td class="py-3 px-4 text-xs text-slate-800 dark:text-slate-200 max-w-[180px] truncate">${l.bookTitle}</td>
        <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
          <div>${formatDate(l.borrowDate)}</div>
          <div class="text-[11px] text-rose-500 font-medium">Tempo: ${formatDate(l.dueDate)}</div>
        </td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-xs font-semibold ${fine > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"}">
          ${fine > 0 ? formatRupiah(fine) : "-"}
        </td>
        <td class="py-3 px-4 text-right">
          ${l.status !== "returned" ? `
            <button 
              onclick="returnBook('${l.id}')"
              class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-xs flex items-center gap-1 ml-auto">
              <i class="fas fa-check"></i> Proses Kembali
            </button>
          ` : `
            <span class="text-[11px] text-slate-400 font-medium">Selesai (${formatDate(l.returnDate)})</span>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

// Add/Edit Book Modal
function openAddBookModal() {
  editingBookId = null;
  const modal = document.getElementById("book-form-modal");
  const form = document.getElementById("book-form");
  const titleEl = document.getElementById("book-modal-title");
  if (!modal || !form) return;

  form.reset();
  if (titleEl) titleEl.textContent = "Tambah Buku Baru ke Katalog";
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function openEditBookModal(bookId) {
  const book = AppState.books.find(b => b.id === bookId);
  if (!book) return;

  editingBookId = bookId;
  const modal = document.getElementById("book-form-modal");
  const form = document.getElementById("book-form");
  const titleEl = document.getElementById("book-modal-title");
  if (!modal || !form) return;

  if (titleEl) titleEl.textContent = "Edit Data Buku";

  document.getElementById("book-title-input").value = book.title;
  document.getElementById("book-author-input").value = book.author;
  document.getElementById("book-category-input").value = book.category;
  document.getElementById("book-isbn-input").value = book.isbn;
  document.getElementById("book-publisher-input").value = book.publisher;
  document.getElementById("book-year-input").value = book.year;
  document.getElementById("book-pages-input").value = book.pages;
  document.getElementById("book-rack-input").value = book.rack;
  document.getElementById("book-stock-input").value = book.stock;
  document.getElementById("book-cover-input").value = book.cover;
  document.getElementById("book-synopsis-input").value = book.synopsis;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function handleSaveBook(e) {
  e.preventDefault();

  const title = document.getElementById("book-title-input").value.trim();
  const author = document.getElementById("book-author-input").value.trim();
  const category = document.getElementById("book-category-input").value;
  const isbn = document.getElementById("book-isbn-input").value.trim();
  const publisher = document.getElementById("book-publisher-input").value.trim();
  const year = parseInt(document.getElementById("book-year-input").value, 10) || new Date().getFullYear();
  const pages = parseInt(document.getElementById("book-pages-input").value, 10) || 100;
  const rack = document.getElementById("book-rack-input").value.trim() || "Rak Umum";
  const stock = parseInt(document.getElementById("book-stock-input").value, 10) || 1;
  const cover = document.getElementById("book-cover-input").value.trim() || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80";
  const synopsis = document.getElementById("book-synopsis-input").value.trim();

  if (!title || !author || !isbn) {
    showToast("Harap isi Judul, Penulis, dan ISBN dengan lengkap.", "warning");
    return;
  }

  if (editingBookId) {
    // Edit existing book
    const book = AppState.books.find(b => b.id === editingBookId);
    if (book) {
      const stockDiff = stock - book.stock;
      book.title = title;
      book.author = author;
      book.category = category;
      book.isbn = isbn;
      book.publisher = publisher;
      book.year = year;
      book.pages = pages;
      book.rack = rack;
      book.stock = stock;
      book.available = Math.max(0, book.available + stockDiff);
      book.cover = cover;
      book.synopsis = synopsis;
      showToast("Data buku berhasil diperbarui!", "success");
    }
  } else {
    // Add new book (ID unik otomatis berdasarkan ID tertinggi)
    const maxIdNum = AppState.books.reduce((max, b) => {
      const num = parseInt(String(b.id).replace("BOK-", ""), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = `BOK-${String(maxIdNum + 1).padStart(3, "0")}`;
    const newBook = {
      id: newId,
      title,
      author,
      category,
      isbn,
      publisher,
      year,
      pages,
      rack,
      stock,
      available: stock,
      rating: 4.8,
      cover,
      synopsis
    };
    AppState.books.unshift(newBook);
    showToast(`Buku baru berhasil ditambahkan! ID: ${newId}`, "success");
  }

  saveBooks();
  closeModal("book-form-modal");
  renderAdminStats();
  renderAdminBooksTable();
  renderBooks();
}

// Delete Book
function deleteBook(bookId) {
  const book = AppState.books.find(b => b.id === bookId);
  if (!book) return;

  const isCurrentlyBorrowed = book.available < book.stock;
  let warn = `Hapus buku "${book.title}" dari katalog?`;
  if (isCurrentlyBorrowed) {
    warn += `\n\nCatatan: Buku ini sedang dipinjam sebanyak ${book.stock - book.available} eksemplar.`;
  }

  if (!confirm(warn)) return;

  AppState.books = AppState.books.filter(b => b.id !== bookId);
  AppState.bookmarks = AppState.bookmarks.filter(id => id !== bookId);
  saveBooks();
  saveBookmarks();
  updateBookmarkBadge();

  renderAdminStats();
  renderAdminBooksTable();
  renderBooks();
  showToast("Buku berhasil dihapus dari perpustakaan.", "info");
}

// Export Database as JSON
function exportDataJSON() {
  const exportData = {
    appName: "PustakaHub",
    exportedAt: new Date().toISOString(),
    books: AppState.books,
    loans: AppState.loans
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `pustakahub_backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast("Database berhasil diekspor ke file JSON!", "success");
}

// Export Circulation Report as CSV
function exportCirculationCSV() {
  const headers = ["ID Transaksi", "Nama Peminjam", "NIM/ID", "Judul Buku", "Tgl Pinjam", "Tgl Jatuh Tempo", "Status", "Tgl Kembali", "Denda (Rp)"];
  
  const rows = AppState.loans.map(l => {
    return [
      `"${l.id}"`,
      `"${l.borrowerName}"`,
      `"${l.borrowerId}"`,
      `"${l.bookTitle.replace(/"/g, '""')}"`,
      `"${l.borrowDate}"`,
      `"${l.dueDate}"`,
      `"${l.status}"`,
      `"${l.returnDate || "-"}"`,
      `"${l.fineAmount || 0}"`
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `laporan_sirkulasi_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();

  showToast("Laporan sirkulasi berhasil diekspor ke CSV!", "success");
}

// Hook up admin search and filter inputs
document.addEventListener("DOMContentLoaded", () => {
  const adminSearch = document.getElementById("admin-book-search");
  if (adminSearch) {
    adminSearch.addEventListener("input", renderAdminBooksTable);
  }

  const adminLoanFilter = document.getElementById("admin-loan-filter-status");
  if (adminLoanFilter) {
    adminLoanFilter.addEventListener("change", renderAdminLoansTable);
  }

  const bookForm = document.getElementById("book-form");
  if (bookForm) {
    bookForm.addEventListener("submit", handleSaveBook);
  }
});

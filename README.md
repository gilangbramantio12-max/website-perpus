# 📚 PustakaHub - Sistem Informasi Perpustakaan Digital

Aplikasi web perpustakaan modern, responsif, dan siap hosting (*production-ready*). Dirancang untuk memudahkan pengelolaan katalog buku, sirkulasi peminjaman & pengembalian buku mandiri, denda otomatis, struk digital, serta dashboard statistik bagi pustakawan.

---

## 🌟 Fitur Utama

### 1. Modul Pengunjung / Anggota (OPAC Catalog)
- **Katalog Buku Visual**: Tampilan sampul buku resolusi tinggi, rating, status ketersediaan (*Tersedia / Habis Dipinjam*), serta lokasi rak fisik.
- **Pencarian Cepat & Filter Multi-Kategori**:
  - Filter kategori: *Teknologi & Komputer, Sains & Matematika, Sastra & Fiksi, Bisnis & Finansial, Sejarah & Sosial, Pengembangan Diri*.
  - Filter status ketersediaan dan sorting (Terpopuler, Judul A-Z, Tahun Terbit, Rating).
- **Detail Buku Komprehensif**: Menampilkan ISBN, Penerbit, Jumlah Halaman, Lokasi Rak, dan Sinopsis lengkap.
- **Simulasi Peminjaman Mandiri**:
  - Formulir peminjaman dengan data peminjam (Nama, NIM/NIS, WhatsApp).
  - Pilihan durasi peminjaman (3 hari, 7 hari, 14 hari) dengan kalkulasi otomatis tanggal jatuh tempo.
  - Pengurangan otomatis stok buku di sistem.
- **Struk Peminjaman Digital (Printable Receipt)**:
  - Bukti peminjaman dengan Kode Transaksi unik (`TRX-XXXX`), barcode simulasi, dan tombol cetak struk langsung.
- **Modul "Buku Saya" (Active Loans)**:
  - Pantau buku yang sedang dipinjam dengan indikator *countdown* sisa hari.
  - Deteksi keterlambatan dan kalkulasi denda otomatis (Rp 1.000 / hari).
  - Fitur pengembalian buku mandiri yang otomatis memulihkan stok buku.
- **Daftar Favorit (Bookmark / Wishlist)**.
- **Dark Mode & Light Mode**: Desain modern dengan dukungan tema gelap otomatis.

### 2. Modul Pustakawan / Administrator
- **Dashboard Statistik Real-Time**:
  - Total Judul Buku & Eksemplar Fisik.
  - Jumlah Buku Sedang Dipinjam.
  - Riwayat Peminjaman Selesai.
  - Kas Total Denda Terkumpul.
- **Manajemen Katalog Buku (CRUD)**:
  - Tambah buku baru dengan form lengkap.
  - Edit informasi buku dan penyesuaian stok fisik.
  - Hapus buku dari katalog.
- **Tabel Sirkulasi Transaksi**:
  - Filter transaksi berdasarkan status (*Semua, Aktif, Terlambat, Dikembalikan*).
  - Proses pengembalian dan pelunasan denda oleh pustakawan.
- **Ekspor Data & Backup**:
  - Ekspor seluruh database ke format **JSON** (Backup data).
  - Ekspor laporan sirkulasi peminjaman ke format **CSV** (Kompatibel dengan Microsoft Excel / Google Sheets).

---

## 🚀 Cara Menjalankan di Komputer (Lokal)

### Cara 1: Menggunakan Script 1-Klik (Windows)
Cukup klik ganda (double-click) file:
```text
start.bat
```
Browser akan otomatis terbuka di `http://localhost:3000`.

### Cara 2: Menggunakan Terminal / Node.js
```bash
npm start
# atau
node server.js
```
Lalu buka browser Anda di: `http://localhost:3000`

### Cara 3: Langsung Buka File HTML (Tanpa Server)
Klik 2x file `index.html` pada File Explorer Anda. Semua fungsi berjalan lancar menggunakan `localStorage` peramban.

---

## 🌐 Cara Hosting Gratis (Online & Bisa Diakses Siapa Saja)

Aplikasi ini telah dilengkapi konfigurasi deployment untuk semua platform hosting modern tanpa memerlukan setup tambahan:

### 1. Netlify Drop (Paling Cepat & Mudah - 10 Detik Online)
1. Buka situs [app.netlify.com/drop](https://app.netlify.com/drop) di browser.
2. *Drag and Drop* (seret) folder proyek `PENILAIAN PAK AL` ini ke area upload Netlify.
3. Tunggu 5-10 detik. Website Anda langsung **LIVE** dengan alamat URL gratis `https://nama-unik.netlify.app` dan sertifikat SSL aktif!

### 2. Vercel (Rekomendasi untuk Tampilan Profesional)
1. Buka [vercel.com](https://vercel.com) dan masuk menggunakan akun GitHub/Email Anda.
2. Klik **"Add New"** > **"Project"**.
3. Hubungkan repositori GitHub proyek ini (atau upload via Vercel CLI dengan perintah `npx vercel`).
4. File `vercel.json` sudah disediakan sehingga tidak perlu konfigurasi lagi, klik **Deploy**.

### 3. GitHub Pages (100% Gratis Selamanya)
1. Buat repositori baru di GitHub (misal: `web-perpustakaan`).
2. Push semua file dari folder ini ke repositori tersebut:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi web perpustakaan PustakaHub"
   git branch -M main
   git remote add origin https://github.com/USERNAME/web-perpustakaan.git
   git push -u origin main
   ```
3. Buka menu **Settings** > **Pages** di repositori GitHub Anda.
4. Pada bagian *Build and deployment* > *Source*, pilih **GitHub Actions** (alur kerja `.github/workflows/deploy.yml` sudah disiapkan otomatis).
5. Website Anda akan aktif di: `https://USERNAME.github.io/web-perpustakaan`.

---

## 📁 Struktur Direktori Proyek

```text
├── index.html                   # Halaman antarmuka utama (Katalog & Dashboard Admin)
├── css/
│   └── style.css                # Kustomisasi CSS, animasi kartu buku, efek glassmorphism
├── js/
│   ├── data.js                  # Data awal katalog buku & transaksi (seed data)
│   ├── app.js                   # Logika katalog, pencarian, peminjaman, & denda
│   └── admin.js                 # Logika dashboard pustakawan, CRUD buku, & ekspor data
├── .github/
│   └── workflows/
│       └── deploy.yml           # Alur kerja otomatis deployment ke GitHub Pages
├── server.js                    # Server HTTP Node.js bawaan (zero external dependencies)
├── start.bat                    # Script peluncur 1-klik untuk pengguna Windows
├── package.json                 # Metadata proyek & npm scripts
├── vercel.json                  # Konfigurasi deployment Vercel
├── netlify.toml                 # Konfigurasi deployment Netlify
└── README.md                    # Dokumentasi lengkap & panduan hosting
```

---

## 🛠️ Lisensi & Modifikasi
Proyek ini bersifat *open-source* di bawah lisensi MIT. Anda bebas mengubah judul, menambahkan koleksi buku, mengganti logo, atau menyesuaikan tarif denda perpustakaan.

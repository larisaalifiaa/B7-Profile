# B7-Profile — Sistem Informasi Portofolio Akademik Dosen

Sistem informasi akademik berbasis web modern yang dirancang untuk mengelola, menyusun, dan memvisualisasikan portofolio akademik serta data Tridharma Perguruan Tinggi bagi dosen dan staf akademik secara terpusat, aman, dan interaktif.

---

## 👤 Identitas Mahasiswa

* **Nama:** Larisa Alifia Handini
* **NIM:** 2411523026
* **Tugas:** Proyek Akhir Praktikum Pemrograman Web (PWEB)

---

## 🚀 Fitur Utama

Sistem **B7-Profile** dilengkapi dengan fitur-fitur premium yang menunjang pengelolaan data akademik secara efisien:

1. **Dashboard Ringkasan (Tridharma Stats)**
   * Menampilkan ringkasan statistik portofolio dalam bentuk kartu (*stat cards*) yang berjejer horizontal (3 kolom).
   * Desain kartu dilengkapi dengan garis aksen gradien warna, indikator denyut warna (*pulsing dot*), dan gambar elemen latar belakang (*thematic watermark icon*) yang interaktif.
2. **Profil Mandiri (My Profile)**
   * Informasi detail data pribadi (Nama, NIP, TTL, Jenis Kelamin, Alamat, No. Telepon).
   * Informasi kepegawaian (Divisi/Unit, Status Pegawai, Jabatan Fungsional, Gelar Akademik).
   * Fitur sunting foto profil dan data pribadi secara instan.
3. **Portofolio Terintegrasi (My Portfolio)**
   * Pengelolaan riwayat Pendidikan, Penelitian, Publikasi, Pengabdian Masyarakat, Kepanitiaan, dan Riwayat Penugasan.
4. **Ekspor Portofolio ke PDF**
   * Fitur mengunduh ringkasan portofolio dosen secara resmi ke dalam dokumen PDF menggunakan pustaka `pdfkit`.
5. **Multi-Theme & Mode Gelap (Dark Mode)**
   * Mendukung perpindahan tema secara instan (Default, Claude, Doom 64, Supabase) dan pergantian mode terang/gelap yang tersimpan secara lokal di peramban (*localStorage*).
6. **Keamanan Akun (Security)**
   * Fitur enkripsi password menggunakan metode hashing `bcryptjs`.
   * Halaman ubah password mandiri yang aman dilengkapi dengan validasi session.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

### **Backend (Server-Side)**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database Driver:** `mysql2` (dengan fitur *connection pooling* dan Promise-based queries)
* **Session Management:** `express-session` & `express-mysql-session` (untuk persistence login di database)
* **PDF Engine:** `pdfkit` (untuk render berkas PDF secara server-side)

### **Frontend (Client-Side)**
* **Template Engine:** EJS (Embedded JavaScript templates)
* **Styling & Components:** Tailwind CSS & Basecoat (Vanilla CSS + JS components untuk UI bergaya *shadcn/ui*)
* **Interactivity:** HTMX (untuk pembaruan konten parsial tanpa memuat ulang seluruh halaman, membuat navigasi secepat Single Page Application/SPA)

---

## 📂 Struktur Proyek

```bash
B7-Profile/
├── bin/
│   └── www                  # Entry point server HTTP
├── controllers/
│   ├── employeeController.js # Logika data pegawai & portofolio
│   ├── indexController.js    # Logika autentikasi login & dashboard
│   └── usersController.js    # Logika dasar pengguna
├── lib/
│   └── db.js                 # Konfigurasi koneksi MySQL Pool
├── middlewares/
│   ├── acl.js                # Middleware Access Control List (ACL)
│   └── auth.js               # Middleware verifikasi session login
├── public/
│   ├── assets/               # Berkas CSS & JS Basecoat, HTMX, dan Gambar
│   ├── stylesheets/
│   │   └── style.css         # CSS Kustom (Glow, Cards, Grid, Aksen)
│   └── uploads/              # Folder penyimpanan foto profil terunggah
├── routes/
│   └── index.js              # Router utama Express
├── scripts/
│   ├── init_db.js            # Script inisialisasi tabel database
│   └── seed_data.js          # Script pengisi data dummy awal
├── views/
│   ├── partials/             # Template header, footer, navbar, sidebar
│   ├── change_password.ejs   # Halaman Ubah Password
│   ├── home.ejs              # Halaman Dashboard
│   ├── login.ejs             # Halaman Login
│   ├── portfolio.ejs         # Halaman My Portfolio
│   ├── profile_edit.ejs      # Halaman Sunting Profil
│   └── profile.ejs           # Halaman Detail Profil
├── app.js                    # Konfigurasi middleware utama Express
├── package.json              # Daftar ketergantungan (dependencies)
└── .env                      # Konfigurasi variabel lingkungan (environment variables)
```

---

## ⚙️ Panduan Inisialisasi & Instalasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi B7-Profile di komputer lokal Anda:

### **1. Clone Repositori**
```bash
git clone https://github.com/larisaalifiaa/B7-Profile.git
cd B7-Profile
```

### **2. Instal Ketergantungan (Dependencies)**
```bash
npm install
```

### **3. Konfigurasi Variabel Lingkungan (`.env`)**
Buat berkas bernama `.env` di direktori utama proyek Anda dan isi dengan konfigurasi database MySQL Anda:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=password_mysql_anda
DB_NAME=db_tb_pweb_v2
SESSION_SECRET=b7_profile_super_secret_key
PORT=3000
```

### **4. Siapkan Database**
Jalankan script inisialisasi database untuk membuat skema tabel secara otomatis:
```bash
node scripts/init_db.js
```
Setelah tabel berhasil dibuat, Anda dapat mengisi data awal (dummy data) termasuk akun admin/dosen uji coba dengan menjalankan:
```bash
node scripts/seed_data.js
```

### **5. Jalankan Aplikasi**
* **Mode Produksi:**
  ```bash
  npm start
  ```
* **Mode Pengembangan (dengan Auto-Reload):**
  ```bash
  npm run dev
  ```
Buka peramban (browser) Anda dan akses alamat `http://localhost:3000`.

---

## 🔑 Hak Akses & Akun Uji Coba

Berdasarkan inisialisasi script `seed_data.js`, Anda dapat masuk ke sistem menggunakan akun dosen uji coba berikut:
* **Username:** `larisa@mail.com`
* **Password:** `password123`

---

## 🛡️ Sistem Otorisasi (ACL)

Proyek ini dilengkapi dengan **Role-Based Access Control (RBAC)** yang membatasi akses URL berdasarkan *permissions* pengguna.
* Tabel terkait: `roles`, `permissions`, `role_has_permissions`, dan `user_has_roles`.
* Middleware proteksi route terletak pada berkas [acl.js](file:///C:/Users/USER/pweb%20bismillah%20A/facultyware/middlewares/acl.js). Anda dapat memproteksi rute dengan memanggil middleware:
  ```javascript
  const { checkPermission } = require('../middlewares/acl');
  router.get('/route-khusus', checkPermission('nama_permission'), controller.action);
  ```

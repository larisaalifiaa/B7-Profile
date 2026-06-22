# B7-Profile

Sistem informasi akademik berbasis web modern yang dirancang untuk mengelola, menyusun, dan memvisualisasikan portofolio akademik serta data Tridharma Perguruan Tinggi bagi dosen dan staf akademik secara terpusat, aman, dan interaktif.

---

## 👤 Identitas Mahasiswa

* **Nama:** Larisa Alifia Handini
* **NIM:** 2411523026

---

## 🚀 Fitur Utama

* **Lihat & Sunting Profile** (termasuk unggah foto profil mandiri)
* **Manajemen Portfolio Dinamis** (Pegawai Dosen melihat 6 tab lengkap, sedangkan Tenaga Kependidikan/Tendik hanya melihat 3 tab: Pendidikan, Kepanitiaan, dan Penugasan)
* **Unduh Portfolio (PDF)** (Ekspor berkas PDF dinamis, di mana data Penelitian, Publikasi, dan Pengabdian secara otomatis disembunyikan untuk pegawai Tendik)
* **Ubah Password** (Fitur keamanan enkripsi `bcrypt` mandiri)
* **Sistem Otorisasi & ACL** (Akses route dan tampilan dinamis berbasis hak akses Dosen/Tendik)

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

Berdasarkan inisialisasi script `seed_data.js`, Anda dapat masuk ke sistem menggunakan akun uji coba berikut:

* **Akun Dosen:**
  * **Email/Username:** `larisa@mail.com`
  * **Password:** `password123`

* **Akun Tenaga Kependidikan / Tendik):**
  * **Email/Username:** `budi@mail.com`
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

---

## 🧪 Pengujian E2E (End-to-End Testing)

Proyek ini telah dilengkapi dengan unit test otomatis berbasis **Playwright** untuk memverifikasi seluruh alur sistem (login, hak akses Dosen & Tendik, sunting profil, serta unduh berkas PDF).

Untuk menjalankan pengujian otomatis:
1. Pastikan database lokal/Laragon aktif.
2. Jalankan perintah berikut di terminal:
   ```bash
   npx playwright test
   ```


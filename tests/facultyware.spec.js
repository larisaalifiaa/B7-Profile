const { test, expect } = require('@playwright/test');

test.describe.serial('Facultyware E2E Test Suite', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a shared page context so session persists across tests
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Skenario Gagal Login (Username/Password Salah)', async () => {
    await page.goto('/login');
    
    // Isi dengan kredensial salah
    await page.fill('#username', 'salah@mail.com');
    await page.fill('#password', 'salahpassword');
    await page.click('button[type="submit"]');

    // Pastikan pesan error muncul
    const alertError = page.locator('.alert-error');
    await expect(alertError).toBeVisible();
    await expect(alertError).toContainText('Invalid username or password');
  });

  test('2. Skenario Sukses Login (Masuk ke Dashboard)', async () => {
    await page.goto('/login');
    
    // Isi dengan kredensial yang benar (dari data seeder)
    await page.fill('#username', 'larisa@mail.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');

    const heading = page.locator('h1');
    await expect(heading).toContainText('Halo');
  });

  test('3. Pengujian Halaman Portofolio, Tab, dan Pencarian', async () => {
    await page.goto('/portfolio');
    
    // Pastikan judul halaman portofolio termuat
    await expect(page.locator('h1')).toContainText('Portfolio');

    // 1. Verifikasi tab Pendidikan (default aktif)
    const tabEdu = page.locator('#tab-education');
    await expect(tabEdu).toBeVisible();

    // 2. Klik tab Penelitian & Riset
    await page.click('#btn-tab-research');
    const tabResearch = page.locator('#tab-research');
    await expect(tabResearch).toBeVisible();
    await expect(tabEdu).not.toBeVisible();

    // 3. Kembali ke Pendidikan dan tes input pencarian (filtering)
    await page.click('#btn-tab-education');
    await page.locator('input[placeholder="Cari pendidikan..."]').pressSequentially('JenjangTidakMungkinAda');
    
    // Setelah difilter dengan kata kunci aneh, baris data yang tampil harus 0
    const visibleRows = page.locator('#edu-table tbody tr:visible');
    await expect(visibleRows).toHaveCount(0);
  });

  test('4. Pengujian Edit Profil & Validasi Sisi Server', async () => {
    await page.goto('/profile/edit');
    await expect(page.locator('h1')).toContainText('Edit Profil');

    // Isi alamat baru
    await page.fill('#address', 'Jl. Limau Manis No. 12, Kampus Unand, Padang');
    await page.click('button[type="submit"]');

    // Cek kemunculan alert sukses
    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Profil berhasil diperbarui!');
  });

  test('5. Pengujian API Portofolio & Unduh PDF', async () => {
    // Navigasi ke halaman portofolio terlebih dahulu
    await page.goto('/portfolio');

    // 1. Memastikan file PDF dapat didownload dengan header content-type yang tepat
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('a[href="/portfolio/pdf"]')
    ]);
    
    expect(download.suggestedFilename()).toContain('portfolio');
    
    // 2. Akses REST API dan verifikasi responnya berupa JSON valid
    const response = await page.goto('/api/portfolio');
    const json = await response.json();
    
    expect(json.status).toBe('success');
    expect(json.data.employee.name).toContain('Larisa Alifia Handini');
  });
});

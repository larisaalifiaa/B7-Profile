const db = require("../lib/db");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Help format date (YYYY-MM-DD)
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 1. View Portfolio
const viewPortfolio = async (req, res, next) => {
  const userId = req.session.userId;
  try {
    // Fetch employee details
    const [empRows] = await db.query(`
      SELECT e.*, u.email, u.photo, ou.name AS org_unit_name, es.name AS emp_status_name 
      FROM employees e 
      JOIN users u ON e.id = u.id 
      LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id 
      LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
      WHERE e.id = ?
    `, [userId]);

    if (empRows.length === 0) {
      return res.status(404).render("error", {
        message: "Data Pegawai tidak ditemukan.",
        error: { status: 404, stack: "" }
      });
    }
    const employee = empRows[0];

    // Fetch lecturer record if exists
    const [lecRows] = await db.query("SELECT * FROM lecturers WHERE id = ?", [userId]);
    const lecturer = lecRows.length > 0 ? lecRows[0] : null;

    // Fetch education history
    const [eduHistory] = await db.query(`
      SELECT * FROM education_histories 
      WHERE employee_id = ? 
      ORDER BY start_year ASC
    `, [userId]);

    // Fetch research
    const [research] = await db.query(`
      SELECT r.*, rm.role 
      FROM research r 
      JOIN research_members rm ON r.id = rm.research_id 
      WHERE rm.lecturer_id = ? 
      ORDER BY r.start_date DESC
    `, [userId]);

    // Fetch publications
    const [publications] = await db.query(`
      SELECT p.*, pa.author_order, pa.is_corresponding 
      FROM publications p 
      JOIN publication_authors pa ON p.id = pa.publication_id 
      WHERE pa.lecturer_id = ? 
      ORDER BY p.publication_date DESC
    `, [userId]);

    // Fetch community services
    const [services] = await db.query(`
      SELECT cs.*, csm.role 
      FROM community_services cs 
      JOIN community_service_members csm ON cs.id = csm.community_service_id 
      WHERE csm.lecturer_id = ? 
      ORDER BY cs.start_date DESC
    `, [userId]);

    // Fetch committees
    const [committees] = await db.query(`
      SELECT c.*, cm.role, cm.is_leader 
      FROM committees c 
      JOIN committee_members cm ON c.id = cm.committee_id 
      WHERE cm.employee_id = ? 
      ORDER BY c.start_date DESC
    `, [userId]);

    // Fetch assignments
    const [assignments] = await db.query(`
      SELECT * FROM assignments 
      WHERE assigned_to = ? 
      ORDER BY start_date DESC
    `, [userId]);

    res.render("portfolio", {
      title: "Portofolio Pribadi",
      employee,
      lecturer,
      eduHistory,
      research,
      publications,
      services,
      committees,
      assignments,
      formatDate
    });
  } catch (err) {
    next(err);
  }
};

// 2. View Profile
const viewProfile = async (req, res, next) => {
  const userId = req.session.userId;
  try {
    const [empRows] = await db.query(`
      SELECT e.*, u.email, u.photo, ou.name AS org_unit_name, es.name AS emp_status_name 
      FROM employees e 
      JOIN users u ON e.id = u.id 
      LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id 
      LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
      WHERE e.id = ?
    `, [userId]);

    if (empRows.length === 0) {
      return res.status(404).render("error", {
        message: "Data profil tidak ditemukan.",
        error: { status: 404, stack: "" }
      });
    }

    const [lecRows] = await db.query("SELECT * FROM lecturers WHERE id = ?", [userId]);
    const lecturer = lecRows.length > 0 ? lecRows[0] : null;

    res.render("profile", {
      title: "Profil Lengkap",
      employee: empRows[0],
      lecturer,
      formatDate
    });
  } catch (err) {
    next(err);
  }
};

// 3. Edit Profile Page
const editProfilePage = async (req, res, next) => {
  const userId = req.session.userId;
  try {
    const [empRows] = await db.query(`
      SELECT e.*, u.email, u.photo, ou.name AS org_unit_name, es.name AS emp_status_name 
      FROM employees e 
      JOIN users u ON e.id = u.id 
      LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id 
      LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
      WHERE e.id = ?
    `, [userId]);

    if (empRows.length === 0) {
      return res.status(404).render("error", {
        message: "Data profil tidak ditemukan.",
        error: { status: 404, stack: "" }
      });
    }

    res.render("profile_edit", {
      title: "Update Profil",
      employee: empRows[0],
      error: null,
      success: null,
      formatDate
    });
  } catch (err) {
    next(err);
  }
};

// 4. Update Profile
const updateProfile = async (req, res, next) => {
  const userId = req.session.userId;

  // Reload employee details for form re-rendering on validation error
  const reloadData = async () => {
    const [empRows] = await db.query(`
      SELECT e.*, u.email, u.photo, ou.name AS org_unit_name, es.name AS emp_status_name 
      FROM employees e 
      JOIN users u ON e.id = u.id 
      LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id 
      LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
      WHERE e.id = ?
    `, [userId]);
    return empRows[0];
  };

  // Handle multer error passed from middleware
  if (req.multerError) {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: req.multerError,
      success: null,
      formatDate
    });
  }

  const {
    name,
    national_id_number,
    tax_id_number,
    birth_place,
    birth_date,
    gender,
    religion,
    marital_status,
    address,
    phone_number
  } = req.body;

  let photoFilename = null;
  if (req.file) {
    photoFilename = req.file.filename;
  }

  // Validations
  if (!name || name.trim() === "") {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: "Nama lengkap wajib diisi.",
      success: null,
      formatDate
    });
  }

  if (!national_id_number || !/^\d{16}$/.test(national_id_number)) {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: "NIK wajib berupa 16 digit angka.",
      success: null,
      formatDate
    });
  }

  if (phone_number && !/^\d{9,15}$/.test(phone_number)) {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: "Nomor telepon wajib berupa 9 hingga 15 digit angka.",
      success: null,
      formatDate
    });
  }

  if (!birth_date || isNaN(new Date(birth_date).getTime())) {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: "Tanggal lahir tidak valid.",
      success: null,
      formatDate
    });
  }

  if (new Date(birth_date) > new Date()) {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: "Tanggal lahir tidak boleh di masa depan.",
      success: null,
      formatDate
    });
  }

  if (!address || address.trim() === "") {
    const employee = await reloadData();
    return res.render("profile_edit", {
      title: "Update Profil",
      employee,
      error: "Alamat wajib diisi.",
      success: null,
      formatDate
    });
  }

  try {
    // Start Transaction
    await db.query("START TRANSACTION");

    // Update users table
    if (photoFilename) {
      await db.query(
        "UPDATE users SET name = ?, photo = ?, updated_at = NOW() WHERE id = ?",
        [name, photoFilename, userId]
      );
    } else {
      await db.query(
        "UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?",
        [name, userId]
      );
    }

    // Update employees table
    await db.query(`
      UPDATE employees SET 
        name = ?, 
        national_id_number = ?, 
        tax_id_number = ?, 
        birth_place = ?, 
        birth_date = ?, 
        gender = ?, 
        religion = ?, 
        marital_status = ?, 
        address = ?, 
        phone_number = ?, 
        updated_at = NOW() 
      WHERE id = ?
    `, [
      name,
      national_id_number,
      tax_id_number || null,
      birth_place,
      birth_date,
      gender,
      religion || null,
      marital_status,
      address,
      phone_number || null,
      userId
    ]);

    await db.query("COMMIT");

    // Fetch updated employee details
    const updatedEmployee = await reloadData();

    res.render("profile_edit", {
      title: "Update Profil",
      employee: updatedEmployee,
      error: null,
      success: "Profil berhasil diperbarui!",
      formatDate
    });
  } catch (err) {
    await db.query("ROLLBACK");
    next(err);
  }
};

// 5. Change Password Page
const changePasswordPage = (req, res) => {
  res.render("change_password", {
    title: "Ubah Password",
    error: null,
    success: null
  });
};

// 6. Change Password
const changePassword = async (req, res, next) => {
  const userId = req.session.userId;
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return res.render("change_password", {
      title: "Ubah Password",
      error: "Semua kolom password wajib diisi.",
      success: null
    });
  }

  if (new_password.length < 8) {
    return res.render("change_password", {
      title: "Ubah Password",
      error: "Password baru minimal harus 8 karakter.",
      success: null
    });
  }

  if (new_password !== confirm_password) {
    return res.render("change_password", {
      title: "Ubah Password",
      error: "Konfirmasi password baru tidak cocok.",
      success: null
    });
  }

  try {
    // Retrieve current hashed password
    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) {
      return res.render("change_password", {
        title: "Ubah Password",
        error: "Pengguna tidak ditemukan.",
        success: null
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.render("change_password", {
        title: "Ubah Password",
        error: "Password saat ini salah.",
        success: null
      });
    }

    // Hash the new password and update
    const hashedNew = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [hashedNew, userId]);

    res.render("change_password", {
      title: "Ubah Password",
      error: null,
      success: "Password berhasil diubah!"
    });
  } catch (err) {
    next(err);
  }
};

// 7. Export Portfolio PDF
const exportPortfolioPDF = async (req, res, next) => {
  const userId = req.session.userId;
  try {
    // Fetch all portfolio details
    const [empRows] = await db.query(`
      SELECT e.*, u.email, u.photo, ou.name AS org_unit_name, es.name AS emp_status_name 
      FROM employees e 
      JOIN users u ON e.id = u.id 
      LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id 
      LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
      WHERE e.id = ?
    `, [userId]);

    if (empRows.length === 0) {
      return res.status(404).send("Data pegawai tidak ditemukan");
    }
    const employee = empRows[0];

    const [lecRows] = await db.query("SELECT * FROM lecturers WHERE id = ?", [userId]);
    const lecturer = lecRows.length > 0 ? lecRows[0] : null;

    const [eduHistory] = await db.query("SELECT * FROM education_histories WHERE employee_id = ? ORDER BY start_year ASC", [userId]);
    const [research] = await db.query(`
      SELECT r.*, rm.role FROM research r 
      JOIN research_members rm ON r.id = rm.research_id 
      WHERE rm.lecturer_id = ? 
      ORDER BY r.start_date DESC
    `, [userId]);
    const [publications] = await db.query(`
      SELECT p.*, pa.author_order, pa.is_corresponding FROM publications p 
      JOIN publication_authors pa ON p.id = pa.publication_id 
      WHERE pa.lecturer_id = ? 
      ORDER BY p.publication_date DESC
    `, [userId]);
    const [services] = await db.query(`
      SELECT cs.*, csm.role FROM community_services cs 
      JOIN community_service_members csm ON cs.id = csm.community_service_id 
      WHERE csm.lecturer_id = ? 
      ORDER BY cs.start_date DESC
    `, [userId]);

    const [committees] = await db.query(`
      SELECT c.*, cm.role, cm.is_leader FROM committees c 
      JOIN committee_members cm ON c.id = cm.committee_id 
      WHERE cm.employee_id = ? 
      ORDER BY c.start_date DESC
    `, [userId]);

    const [assignments] = await db.query("SELECT * FROM assignments WHERE assigned_to = ? ORDER BY start_date DESC", [userId]);

    // Create a new PDF document with buffered pages for dynamic footer page counting
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 10, left: 50, right: 50 },
      bufferPages: true
    });

    // Set headers for response download
    const filename = `portfolio-${employee.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    
    doc.pipe(res);

    // Helper to draw horizontal lines
    const drawLine = (yVal, color = "#cbd5e1", lineWidthVal = 1) => {
      doc.moveTo(50, yVal).lineTo(545, yVal).lineWidth(lineWidthVal).strokeColor(color).stroke();
    };

    // --- PDF Official Letterhead (Kop Surat) ---
    const drawKopSurat = () => {
      const logoPath = path.join(__dirname, "../public/assets/images/unand_logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 62, height: 62 });
      }

      doc.fillColor("#0f172a");
      doc.font("Times-Bold");
      
      doc.fontSize(14).text("UNIVERSITAS ANDALAS", 50, 40, { align: "center", width: 495 });
      doc.fontSize(12).text("FAKULTAS TEKNOLOGI INFORMASI", 50, 56, { align: "center", width: 495 });
      doc.fontSize(11).text("DEPARTEMEN SISTEM INFORMASI", 50, 70, { align: "center", width: 495 });
      
      doc.font("Times-Roman").fontSize(8.2).fillColor("#334155");
      doc.text("Kampus Limau Manis, Padang, Sumatera Barat 25163", 50, 85, { align: "center", width: 495 });
      doc.text("Telepon: (0751) 777xxx | Email: fti@unand.ac.id | Website: https://fti.unand.ac.id", 50, 96, { align: "center", width: 495 });

      // Double line below kop (Thick + Thin)
      drawLine(112, "#0f172a", 1.8);
      drawLine(115, "#0f172a", 0.6);
    };

    // Initial page draws Kop Surat
    drawKopSurat();
    let y = 135;

    // --- Document Title ---
    doc.fillColor("#0f172a").fontSize(13).font("Times-Bold").text("PORTOFOLIO AKADEMIK PEGAWAI", 50, y, { align: "center" });
    y += 25;

    // --- Profile Summary Section (Mockup aligned data style) ---
    // Profile Picture (on the right)
    let photoInserted = false;
    if (employee.photo) {
      const photoPath = path.join(__dirname, "../public/uploads", employee.photo);
      if (fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, 470, y, { width: 75, height: 100 });
          photoInserted = true;
        } catch (e) {
          console.error("Error drawing image in PDF:", e);
        }
      }
    }

    doc.fillColor("#0f172a").font("Times-Bold").fontSize(11).text("DATA PEGAWAI", 50, y);
    
    // Aligned metadata
    doc.font("Times-Roman").fontSize(9);
    const details = [
      ["Nama Lengkap", employee.name],
      ["NIP", employee.employee_number || "-"],
      ["Divisi / Unit Kerja", employee.org_unit_name || "-"],
      ["Status Pegawai", `${employee.emp_status_name || "-"} (${employee.status})`],
      ["Tanggal Bergabung", formatDate(employee.hire_date)]
    ];
    
    if (lecturer) {
      details.push(["Jabatan Fungsional", `${lecturer.functional_position || "-"} (${lecturer.academic_rank || "-"})`]);
    }

    let detailY = y + 18;
    details.forEach(([label, val]) => {
      doc.fillColor("#475569").font("Times-Bold").text(label, 50, detailY, { width: 110 });
      doc.fillColor("#475569").font("Times-Roman").text(":", 165, detailY);
      doc.fillColor("#0f172a").font("Times-Roman").text(val, 175, detailY, { width: photoInserted ? 280 : 360 });
      detailY += 15;
    });

    y = detailY + 15;
    drawLine(y, "#cbd5e1", 1);
    y += 15;

    // --- Helper function to check page breaks ---
    const checkPageBreak = (needed) => {
      // A4 usable height: ~780px, footer at 780, leave 20px buffer
      if (y + needed > 755) {
        doc.addPage();
        drawKopSurat();
        y = 135;
      }
    };
    // --- Section Header Helper ---
    const drawSectionHeader = (titleText) => {
      checkPageBreak(35);
      doc.fillColor("#0f172a").fontSize(10).font("Times-Bold").text(titleText, 50, y + 2);
      y += 22;
    };

    // Helper to draw a beautiful grid-lined table in PDF
    const drawPDFTable = (headers, widths, rows, alignments = []) => {
      const startX = 50;
      const headerHeight = 22;
      const rowHeight = 20;

      // 1. Draw Header
      checkPageBreak(headerHeight);
      
      // Header Background
      doc.rect(startX, y, 495, headerHeight).fill("#f8fafc");
      doc.fillColor("#0f172a").font("Times-Bold").fontSize(8);
      
      let curX = startX;
      headers.forEach((h, i) => {
        const align = alignments[i] || "left";
        const padding = align === "center" ? 0 : 5;
        doc.text(h, curX + padding, y + 7, { width: widths[i] - (padding * 2), align: align });
        curX += widths[i];
      });
      
      // Draw border box for header cells
      curX = startX;
      widths.forEach((w) => {
        doc.rect(curX, y, w, headerHeight).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
        curX += w;
      });
      
      y += headerHeight;

      // 2. Draw Rows
      if (rows.length === 0) {
        checkPageBreak(rowHeight);
        doc.rect(startX, y, 495, rowHeight).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
        doc.fillColor("#64748b").font("Times-Italic").fontSize(8);
        doc.text("Tidak ada data.", startX + 10, y + 6, { width: 475, align: "left" });
        y += rowHeight;
      } else {
        rows.forEach((row) => {
          checkPageBreak(rowHeight);
          
          doc.fillColor("#334155").font("Times-Roman").fontSize(8);
          
          let rowX = startX;
          row.forEach((cellVal, i) => {
            const align = alignments[i] || "left";
            const padding = align === "center" ? 0 : 5;
            doc.text(cellVal || "-", rowX + padding, y + 6, { width: widths[i] - (padding * 2), align: align, ellipsis: true });
            rowX += widths[i];
          });
          
          // Draw border box for row cells
          rowX = startX;
          widths.forEach((w) => {
            doc.rect(rowX, y, w, rowHeight).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
            rowX += w;
          });
          
          y += rowHeight;
        });
      }
      y += 15; // margin bottom for table
    };

    // --- 1. Pendidikan ---
    drawSectionHeader("Riwayat Pendidikan");
    const eduHeaders = ["No", "Gelar", "Institusi", "Bidang Studi", "Tahun Masuk", "Tahun Lulus", "IPK"];
    const eduWidths = [25, 60, 150, 120, 50, 50, 40];
    const eduAligns = ["center", "center", "left", "left", "center", "center", "center"];
    const eduRows = eduHistory.map((edu, idx) => [
      (idx + 1).toString(),
      edu.degree || "-",
      edu.institution || "-",
      edu.major || "-",
      (edu.start_year || "").toString(),
      edu.end_year ? edu.end_year.toString() : "Sekarang",
      edu.gpa ? parseFloat(edu.gpa).toFixed(2) : "-"
    ]);
    drawPDFTable(eduHeaders, eduWidths, eduRows, eduAligns);

    // --- 2. Penelitian ---
    drawSectionHeader("Penelitian");
    const resHeaders = ["No", "Judul Penelitian", "Peran", "Sumber Pendanaan", "Tahun Masuk", "Anggaran", "Status"];
    const resWidths = [25, 170, 70, 80, 50, 50, 50];
    const resAligns = ["center", "left", "left", "left", "center", "right", "center"];
    const resRows = research.map((resItem, idx) => [
      (idx + 1).toString(),
      resItem.title || "-",
      resItem.role || "-",
      resItem.funding_source || "-",
      resItem.start_date ? new Date(resItem.start_date).getFullYear().toString() : "-",
      resItem.budget ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(parseFloat(resItem.budget)) : "-",
      resItem.status || "-"
    ]);
    drawPDFTable(resHeaders, resWidths, resRows, resAligns);

    // --- 3. Publikasi Ilmiah ---
    drawSectionHeader("Publikasi Ilmiah");
    const pubHeaders = ["No", "Judul Artikel", "Tanggal Publikasi", "DOI", "Penulis Ke-", "Korespondensi?"];
    const pubWidths = [25, 200, 70, 100, 50, 50];
    const pubAligns = ["center", "left", "center", "left", "center", "center"];
    const pubRows = publications.map((pub, idx) => [
      (idx + 1).toString(),
      pub.title || "-",
      formatDate(pub.publication_date),
      pub.doi || "-",
      pub.author_order ? pub.author_order.toString() : "-",
      pub.is_corresponding ? "Ya" : "Tidak"
    ]);
    drawPDFTable(pubHeaders, pubWidths, pubRows, pubAligns);

    // --- 4. Pengabdian Masyarakat ---
    drawSectionHeader("Pengabdian Masyarakat");
    const srvHeaders = ["No", "Kegiatan Pengabdian", "Lokasi", "Peran", "Sumber Dana", "Status"];
    const srvWidths = [25, 170, 100, 80, 70, 50];
    const srvAligns = ["center", "left", "left", "left", "left", "center"];
    const srvRows = services.map((srv, idx) => [
      (idx + 1).toString(),
      srv.title || "-",
      srv.location || "-",
      srv.role || "-",
      srv.funding_source || "-",
      srv.status || "-"
    ]);
    drawPDFTable(srvHeaders, srvWidths, srvRows, srvAligns);

    // --- 5. Kepanitiaan ---
    drawSectionHeader("Kepanitiaan");
    const cmtHeaders = ["No", "Nama Kepanitiaan", "Deskripsi", "Peran", "Ketua?", "Status"];
    const cmtWidths = [25, 170, 120, 80, 50, 50];
    const cmtAligns = ["center", "left", "left", "left", "center", "center"];
    const cmtRows = committees.map((cmt, idx) => [
      (idx + 1).toString(),
      cmt.name || "-",
      cmt.description || "-",
      cmt.role || "-",
      cmt.is_leader ? "Ya" : "Tidak",
      cmt.status || "-"
    ]);
    drawPDFTable(cmtHeaders, cmtWidths, cmtRows, cmtAligns);

    // --- 6. Penugasan Kerja ---
    drawSectionHeader("Penugasan Kerja");
    const asmHeaders = ["No", "Judul Tugas", "Deskripsi", "Prioritas", "Status"];
    const asmWidths = [25, 200, 130, 60, 80];
    const asmAligns = ["center", "left", "left", "center", "center"];
    const asmRows = assignments.map((asm, idx) => [
      (idx + 1).toString(),
      asm.title || "-",
      asm.description || "-",
      (asm.priority || "-").toUpperCase(),
      asm.status || "-"
    ]);
    drawPDFTable(asmHeaders, asmWidths, asmRows, asmAligns);

    // --- Dynamic Footers on All Pages ---
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      
      // Bottom border separator line
      drawLine(780, "#e2e8f0", 0.5);
      
      doc.fontSize(8).font("Times-Roman").fillColor("#64748b");
      
      // Left Footer
      doc.text(`Dicetak pada: ${today}`, 50, 788, { align: "left", width: 240 });
      
      // Right Footer (Page numbering)
      doc.text(`Halaman ${i + 1} dari ${range.count}`, 250, 788, { align: "right", width: 295 });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};

// 8. REST API for Portfolio
const getPortfolioAPI = async (req, res, next) => {
  const userId = req.session.userId;
  try {
    // Fetch details
    const [empRows] = await db.query(`
      SELECT e.*, u.email, u.photo, ou.name AS org_unit_name, es.name AS emp_status_name 
      FROM employees e 
      JOIN users u ON e.id = u.id 
      LEFT JOIN organization_units ou ON e.organization_unit_id = ou.id 
      LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
      WHERE e.id = ?
    `, [userId]);

    if (empRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Data tidak ditemukan." });
    }
    const employee = empRows[0];

    const [lecRows] = await db.query("SELECT * FROM lecturers WHERE id = ?", [userId]);
    const lecturer = lecRows.length > 0 ? lecRows[0] : null;

    const [eduHistory] = await db.query("SELECT * FROM education_histories WHERE employee_id = ? ORDER BY start_year ASC", [userId]);
    
    const [research] = await db.query(`
      SELECT r.*, rm.role FROM research r 
      JOIN research_members rm ON r.id = rm.research_id 
      WHERE rm.lecturer_id = ? 
      ORDER BY r.start_date DESC
    `, [userId]);

    const [publications] = await db.query(`
      SELECT p.*, pa.author_order, pa.is_corresponding FROM publications p 
      JOIN publication_authors pa ON p.id = pa.publication_id 
      WHERE pa.lecturer_id = ? 
      ORDER BY p.publication_date DESC
    `, [userId]);

    const [services] = await db.query(`
      SELECT cs.*, csm.role FROM community_services cs 
      JOIN community_service_members csm ON cs.id = csm.community_service_id 
      WHERE csm.lecturer_id = ? 
      ORDER BY cs.start_date DESC
    `, [userId]);

    const [committees] = await db.query(`
      SELECT c.*, cm.role, cm.is_leader FROM committees c 
      JOIN committee_members cm ON c.id = cm.committee_id 
      WHERE cm.employee_id = ? 
      ORDER BY c.start_date DESC
    `, [userId]);

    const [assignments] = await db.query("SELECT * FROM assignments WHERE assigned_to = ? ORDER BY start_date DESC", [userId]);

    res.json({
      status: "success",
      data: {
        employee,
        lecturer,
        education_histories: eduHistory,
        research,
        publications,
        community_services: services,
        committees,
        assignments
      }
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

module.exports = {
  viewPortfolio,
  viewProfile,
  editProfilePage,
  updateProfile,
  changePasswordPage,
  changePassword,
  exportPortfolioPDF,
  getPortfolioAPI
};

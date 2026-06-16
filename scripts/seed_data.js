const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // 1. Insert Organization Unit
    const [orgs] = await db.query('SELECT * FROM organization_units WHERE id = 1');
    if (orgs.length === 0) {
      await db.query(`
        INSERT INTO organization_units 
        (id, name, code, parent_id, type, description, organization_unit_id, created_at, updated_at) 
        VALUES 
        (1, 'Jurusan Teknologi Informasi', 'JTI', NULL, 'department', 'Jurusan Teknologi Informasi', 1, NOW(), NOW())
      `);
      console.log('Inserted organization unit: Jurusan Teknologi Informasi');
    }

    // 2. Insert Employment Status
    const [statuses] = await db.query('SELECT * FROM employment_statuses WHERE id = 1');
    if (statuses.length === 0) {
      await db.query(`
        INSERT INTO employment_statuses 
        (id, name, description, created_at, updated_at) 
        VALUES 
        (1, 'PNS', 'Pegawai Negeri Sipil', NOW(), NOW())
      `);
      console.log('Inserted employment status: PNS');
    }

    // 3. Create/Retrieve User "Larisa"
    let userId;
    const hashedPassword = await bcrypt.hash('password', 10);
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', ['larisa@mail.com']);
    if (users.length === 0) {
      const [result] = await db.query(`
        INSERT INTO users 
        (name, email, password, created_at, updated_at) 
        VALUES 
        (?, ?, ?, NOW(), NOW())
      `, ['Larisa Alifia Handini', 'larisa@mail.com', hashedPassword]);
      userId = result.insertId;
      console.log(`Created user "Larisa Alifia Handini" with ID: ${userId}`);
    } else {
      userId = users[0].id;
      // Reset password to default 'password' to ensure consistent E2E test state
      await db.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, userId]);
      console.log(`User "Larisa Alifia Handini" already exists with ID: ${userId} (default password reset)`);
    }

    // 3.5 Create/Retrieve User "Budianto" (Tendik)
    let budiId;
    const [budiUsers] = await db.query('SELECT * FROM users WHERE email = ?', ['budi@mail.com']);
    if (budiUsers.length === 0) {
      const [result] = await db.query(`
        INSERT INTO users 
        (name, email, password, created_at, updated_at) 
        VALUES 
        (?, ?, ?, NOW(), NOW())
      `, ['Budianto, S.Kom.', 'budi@mail.com', hashedPassword]);
      budiId = result.insertId;
      console.log(`Created user "Budianto, S.Kom." (Tendik) with ID: ${budiId}`);
    } else {
      budiId = budiUsers[0].id;
      await db.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [hashedPassword, budiId]);
      console.log(`User "Budianto, S.Kom." already exists with ID: ${budiId} (default password reset)`);
    }

    // 4. Create Employee record for Larisa
    const [employees] = await db.query('SELECT * FROM employees WHERE id = ?', [userId]);
    if (employees.length === 0) {
      await db.query(`
        INSERT INTO employees 
        (id, employee_number, national_id_number, tax_id_number, name, birth_place, birth_date, gender, religion, marital_status, address, phone_number, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at) 
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 'active', NOW(), NOW())
      `, [
        userId,
        '2411523026', // NIM / Employee Number
        '1234567890123456',
        '12.345.678.9-012.000',
        'Larisa Alifia Handini',
        'Padang',
        '2002-05-15',
        'female',
        'Islam',
        'single',
        'Jl. Limau Manis No. 12, Padang',
        '081234567890',
        '2024-01-01'
      ]);
      console.log('Inserted employee record for Larisa');
    }

    // 4.5 Create Employee record for Budianto
    const [budiEmployees] = await db.query('SELECT * FROM employees WHERE id = ?', [budiId]);
    if (budiEmployees.length === 0) {
      await db.query(`
        INSERT INTO employees 
        (id, employee_number, national_id_number, tax_id_number, name, birth_place, birth_date, gender, religion, marital_status, address, phone_number, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at) 
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 'active', NOW(), NOW())
      `, [
        budiId,
        '199502032021121002', // Employee Number / NIP
        '9876543210987654',
        '98.765.432.1-012.000',
        'Budianto, S.Kom.',
        'Padang',
        '1995-02-03',
        'male',
        'Islam',
        'married',
        'Jl. Indarung No. 45, Padang',
        '082198765432',
        '2021-12-01'
      ]);
      console.log('Inserted employee record for Budianto');
    }

    // 5. Create Lecturer record for Larisa
    const [lecturers] = await db.query('SELECT * FROM lecturers WHERE id = ?', [userId]);
    if (lecturers.length === 0) {
      await db.query(`
        INSERT INTO lecturers 
        (id, academic_rank, functional_position, expertise, created_at, updated_at) 
        VALUES 
        (?, ?, ?, ?, NOW(), NOW())
      `, [userId, 'Asisten Ahli', 'Dosen', 'Web Development & Database Systems']);
      console.log('Inserted lecturer record for Larisa');
    }

    // 6. Create ACL Roles and Permissions
    const [roles] = await db.query('SELECT * FROM roles WHERE name = ?', ['staff']);
    let roleId;
    if (roles.length === 0) {
      const [res] = await db.query(`INSERT INTO roles (name, guard_name, created_at, updated_at) VALUES ('staff', 'web', NOW(), NOW())`);
      roleId = res.insertId;
      console.log(`Created role 'staff' with ID: ${roleId}`);
    } else {
      roleId = roles[0].id;
    }

    // Add Permissions
    const permissions = ['manage_profile', 'view_portfolio'];
    const permIds = {};
    for (const p of permissions) {
      const [perms] = await db.query('SELECT * FROM permissions WHERE name = ?', [p]);
      if (perms.length === 0) {
        const [res] = await db.query(`INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES (?, 'web', NOW(), NOW())`, [p]);
        permIds[p] = res.insertId;
        console.log(`Created permission '${p}' with ID: ${permIds[p]}`);
      } else {
        permIds[p] = perms[0].id;
      }

      // Link Role to Permission
      const [rp] = await db.query('SELECT * FROM role_has_permissions WHERE role_id = ? AND permission_id = ?', [roleId, permIds[p]]);
      if (rp.length === 0) {
        await db.query(`INSERT INTO role_has_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, permIds[p]]);
        console.log(`Linked role 'staff' to permission '${p}'`);
      }
    }

    // Link User to Role in model_has_roles
    const [mr] = await db.query('SELECT * FROM model_has_roles WHERE role_id = ? AND model_id = ?', [roleId, userId]);
    if (mr.length === 0) {
      await db.query(`INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`, [roleId, userId]);
      console.log(`Assigned role 'staff' to user ${userId}`);
    }

    const [mrBudi] = await db.query('SELECT * FROM model_has_roles WHERE role_id = ? AND model_id = ?', [roleId, budiId]);
    if (mrBudi.length === 0) {
      await db.query(`INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`, [roleId, budiId]);
      console.log(`Assigned role 'staff' to user ${budiId}`);
    }

    // 7. Seed Education History
    const [edu] = await db.query('SELECT * FROM education_histories WHERE employee_id = ?', [userId]);
    if (edu.length === 0) {
      await db.query(`
        INSERT INTO education_histories 
        (employee_id, degree, institution, major, start_year, end_year, gpa, created_at, updated_at) 
        VALUES 
        (?, 'S.Kom.', 'Universitas Andalas', 'Sistem Informasi', 2020, 2024, 3.85, NOW(), NOW()),
        (?, 'M.T.', 'Institut Teknologi Bandung', 'Teknik Informatika', 2024, 2026, 3.90, NOW(), NOW())
      `, [userId, userId]);
      console.log('Inserted education histories for Larisa');
    }

    const [eduBudi] = await db.query('SELECT * FROM education_histories WHERE employee_id = ?', [budiId]);
    if (eduBudi.length === 0) {
      await db.query(`
        INSERT INTO education_histories 
        (employee_id, degree, institution, major, start_year, end_year, gpa, created_at, updated_at) 
        VALUES 
        (?, 'S.Kom.', 'Universitas Andalas', 'Sistem Informasi', 2013, 2017, 3.50, NOW(), NOW())
      `, [budiId]);
      console.log('Inserted education histories for Budianto');
    }

    // 8. Seed Research and Research Members
    const [resList] = await db.query('SELECT * FROM research');
    let researchId;
    if (resList.length === 0) {
      const [res] = await db.query(`
        INSERT INTO research 
        (title, description, start_date, end_date, funding_source, budget, status, created_at, updated_at) 
        VALUES 
        ('Pengembangan Sistem Portofolio Dosen Berbasis Web', 'Membangun aplikasi portofolio akademik untuk manajemen dosen.', '2025-01-01', '2025-06-01', 'Jurusan', 15000000.00, 'completed', NOW(), NOW())
      `);
      researchId = res.insertId;
      console.log(`Created research project with ID: ${researchId}`);
      await db.query(`
        INSERT INTO research_members 
        (research_id, lecturer_id, role, created_at, updated_at) 
        VALUES 
        (?, ?, 'Ketua Peneliti', NOW(), NOW())
      `, [researchId, userId]);
      console.log('Linked Larisa as Ketua Peneliti');
    }

    // 9. Seed Publications and Publication Authors
    const [pubList] = await db.query('SELECT * FROM publications');
    let pubId;
    if (pubList.length === 0) {
      const [res] = await db.query(`
        INSERT INTO publications 
        (title, publication_date, doi, url, abstract, research_id, created_at, updated_at) 
        VALUES 
        ('Implementation of Responsive Web Systems in Faculty Management', '2025-06-01', '10.12345/jti.v1i1.123', 'https://journal.jti.unand.ac.id/paper1', 'Abstract content about responsive web systems for faculty management.', ?, NOW(), NOW())
      `, [researchId || 1]);
      pubId = res.insertId;
      console.log(`Created publication with ID: ${pubId}`);
      await db.query(`
        INSERT INTO publication_authors 
        (publication_id, lecturer_id, author_order, is_corresponding, created_at, updated_at) 
        VALUES 
        (?, ?, 1, 1, NOW(), NOW())
      `, [pubId, userId]);
      console.log('Linked Larisa as Author 1 (Corresponding Author)');
    }

    // 10. Seed Community Services and Members
    const [csList] = await db.query('SELECT * FROM community_services');
    let csId;
    if (csList.length === 0) {
      const [res] = await db.query(`
        INSERT INTO community_services 
        (title, description, location, start_date, end_date, funding_source, status, created_at, updated_at) 
        VALUES 
        ('Pelatihan Pembuatan Website Sekolah untuk Guru SMA Padang', 'Pemberdayaan masyarakat dalam literasi digital.', 'SMA N 1 Padang', '2025-08-10', '2025-08-12', 'Mandiri', 'completed', NOW(), NOW())
      `);
      csId = res.insertId;
      console.log(`Created community service with ID: ${csId}`);
      await db.query(`
        INSERT INTO community_service_members 
        (community_service_id, lecturer_id, role, created_at, updated_at) 
        VALUES 
        (?, ?, 'Instruktur', NOW(), NOW())
      `, [csId, userId]);
      console.log('Linked Larisa as Instruktur');
    }

    // 11. Seed Committees and Committee Members
    const [commList] = await db.query('SELECT * FROM committees');
    let commId;
    if (commList.length === 0) {
      const [res] = await db.query(`
        INSERT INTO committees 
        (name, description, objective, expected_outcome, start_date, end_date, created_by, status, employee_id, created_at, updated_at) 
        VALUES 
        ('Panitia Seminar Nasional Teknologi Informasi', 'Seminar tahunan JTI.', 'Menyelenggarakan seminar nasional', 'Laporan kegiatan', '2025-09-01', '2025-09-30', ?, 'completed', ?, NOW(), NOW())
      `, [userId, userId]);
      commId = res.insertId;
      console.log(`Created committee with ID: ${commId}`);
      await db.query(`
        INSERT INTO committee_members 
        (committee_id, employee_id, role, is_leader, created_at, updated_at) 
        VALUES 
        (?, ?, 'Sekretaris', 0, NOW(), NOW())
      `, [commId, userId]);
      console.log('Linked Larisa as Sekretaris');
    }

    const [budiComm] = await db.query('SELECT * FROM committee_members WHERE employee_id = ?', [budiId]);
    if (budiComm.length === 0) {
      const [res] = await db.query(`
        INSERT INTO committees 
        (name, description, objective, expected_outcome, start_date, end_date, created_by, status, employee_id, created_at, updated_at) 
        VALUES 
        ('Panitia Ujian Tengah Semester FTI', 'Kepanitiaan pelaksana UTS tingkat fakultas.', 'Menyelenggarakan UTS dengan tertib', 'Laporan kelulusan dan kehadiran', '2026-04-01', '2026-04-15', ?, 'completed', ?, NOW(), NOW())
      `, [budiId, budiId]);
      const budiCommId = res.insertId;
      await db.query(`
        INSERT INTO committee_members 
        (committee_id, employee_id, role, is_leader, created_at, updated_at) 
        VALUES 
        (?, ?, 'Anggota Pelaksana', 0, NOW(), NOW())
      `, [budiCommId, budiId]);
      console.log('Linked Budianto as Anggota Pelaksana for Panitia UTS');
    }

    // 12. Seed Assignments
    const [assignList] = await db.query('SELECT * FROM assignments WHERE assigned_to = ?', [userId]);
    if (assignList.length === 0) {
      await db.query(`
        INSERT INTO assignments 
        (title, description, assigned_by, assigned_to, parent_id, start_date, due_date, status, priority, assigned_by_id, assigned_to_id, parent_id_id, created_at, updated_at) 
        VALUES 
        ('Penyusunan Kurikulum Baru 2026', 'Menyusun kurikulum sistem informasi berbasis Outcome-Based Education.', ?, ?, NULL, '2026-01-10', '2026-03-31', 'completed', 'high', ?, ?, 0, NOW(), NOW())
      `, [userId, userId, userId, userId]);
      console.log('Inserted assignment for Larisa');
    }

    const [budiAssign] = await db.query('SELECT * FROM assignments WHERE assigned_to = ?', [budiId]);
    if (budiAssign.length === 0) {
      await db.query(`
        INSERT INTO assignments 
        (title, description, assigned_by, assigned_to, parent_id, start_date, due_date, status, priority, assigned_by_id, assigned_to_id, parent_id_id, created_at, updated_at) 
        VALUES 
        ('Penginputan Data Nilai Mahasiswa', 'Memasukkan data nilai mahasiswa pasca UTS ke portal akademik.', ?, ?, NULL, '2026-04-16', '2026-04-30', 'completed', 'medium', ?, ?, 0, NOW(), NOW())
      `, [budiId, budiId, budiId, budiId]);
      console.log('Inserted assignment for Budianto');
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();

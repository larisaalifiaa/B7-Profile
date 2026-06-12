const db = require('../lib/db');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    console.log('Seeding additional employees...');

    const additionalStaff = [
      {
        name: 'Dr. Budi Santoso, M.T.',
        email: 'budi@mail.com',
        employee_number: '2411523027',
        national_id_number: '3201021203850001',
        tax_id_number: '12.345.678.9-013.000',
        birth_place: 'Jakarta',
        birth_date: '1985-03-12',
        gender: 'male',
        religion: 'Islam',
        marital_status: 'married',
        address: 'Jl. Khatib Sulaiman No. 45, Padang',
        phone_number: '081298765432',
        hire_date: '2015-08-01',
        academic_rank: 'Lektor',
        functional_position: 'Dosen',
        expertise: 'Software Engineering & Cloud Computing',
        degree: 'S.T.',
        institution: 'Universitas Indonesia',
        major: 'Teknik Elektro',
        start_year: 2003,
        end_year: 2007,
        gpa: 3.75,
        degree_m: 'M.T.',
        inst_m: 'Institut Teknologi Bandung',
        major_m: 'Teknik Informatika',
        start_m: 2008,
        end_m: 2010,
        gpa_m: 3.82,
        degree_d: 'Dr.',
        inst_d: 'Universitas Indonesia',
        major_d: 'Ilmu Komputer',
        start_d: 2011,
        end_d: 2015,
        gpa_d: 3.95
      },
      {
        name: 'Dewi Lestari, M.Sc.',
        email: 'dewi@mail.com',
        employee_number: '2411523028',
        national_id_number: '3201025508900002',
        tax_id_number: '12.345.678.9-014.000',
        birth_place: 'Bandung',
        birth_date: '1990-08-15',
        gender: 'female',
        religion: 'Kristen',
        marital_status: 'single',
        address: 'Jl. Gajah Mada No. 89, Padang',
        phone_number: '082134567890',
        hire_date: '2018-03-01',
        academic_rank: 'Asisten Ahli',
        functional_position: 'Dosen',
        expertise: 'Artificial Intelligence & Machine Learning',
        degree: 'S.Kom.',
        institution: 'Universitas Andalas',
        major: 'Sistem Informasi',
        start_year: 2008,
        end_year: 2012,
        gpa: 3.80,
        degree_m: 'M.Sc.',
        inst_m: 'National University of Singapore',
        major_m: 'Computer Science',
        start_m: 2014,
        end_m: 2016,
        gpa_m: 3.88
      },
      {
        name: 'Eko Prasetyo, M.T.',
        email: 'eko@mail.com',
        employee_number: '2411523029',
        national_id_number: '3201022210880003',
        tax_id_number: '12.345.678.9-015.000',
        birth_place: 'Surabaya',
        birth_date: '1988-10-22',
        gender: 'male',
        religion: 'Islam',
        marital_status: 'married',
        address: 'Jl. Sawahan No. 12, Padang',
        phone_number: '081345678901',
        hire_date: '2016-09-01',
        academic_rank: 'Lektor Kepala',
        functional_position: 'Dosen',
        expertise: 'Computer Networks & Cybersecurity',
        degree: 'S.T.',
        institution: 'Institut Teknologi Sepuluh Nopember',
        major: 'Teknik Elektro',
        start_year: 2006,
        end_year: 2010,
        gpa: 3.65,
        degree_m: 'M.T.',
        inst_m: 'Institut Teknologi Bandung',
        major_m: 'Teknik Elektro',
        start_m: 2011,
        end_m: 2013,
        gpa_m: 3.78
      }
    ];

    // Ensure staff role exists
    const [roles] = await db.query("SELECT id FROM roles WHERE name = 'staff'");
    if (roles.length === 0) {
      throw new Error("Role 'staff' does not exist. Please run seed_data.js first.");
    }
    const roleId = roles[0].id;

    for (const staff of additionalStaff) {
      // Check if user already exists
      const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [staff.email]);
      let staffUserId;
      if (existingUsers.length === 0) {
        const hashedPassword = await bcrypt.hash('password', 10);
        const [userResult] = await db.query(
          "INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
          [staff.name, staff.email, hashedPassword]
        );
        staffUserId = userResult.insertId;
        console.log(`Created user ${staff.name} with ID: ${staffUserId}`);
      } else {
        staffUserId = existingUsers[0].id;
        console.log(`User ${staff.name} already exists with ID: ${staffUserId}`);
      }

      // Check if employee record exists
      const [existingEmp] = await db.query("SELECT id FROM employees WHERE id = ?", [staffUserId]);
      if (existingEmp.length === 0) {
        await db.query(`
          INSERT INTO employees 
          (id, employee_number, national_id_number, tax_id_number, name, birth_place, birth_date, gender, religion, marital_status, address, phone_number, organization_unit_id, hire_date, employment_status_id, status, created_at, updated_at) 
          VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 'active', NOW(), NOW())
        `, [
          staffUserId,
          staff.employee_number,
          staff.national_id_number,
          staff.tax_id_number,
          staff.name,
          staff.birth_place,
          staff.birth_date,
          staff.gender,
          staff.religion,
          staff.marital_status,
          staff.address,
          staff.phone_number,
          staff.hire_date
        ]);
        console.log(`Inserted employee record for ${staff.name}`);
      }

      // Check if lecturer record exists
      const [existingLec] = await db.query("SELECT id FROM lecturers WHERE id = ?", [staffUserId]);
      if (existingLec.length === 0) {
        await db.query(`
          INSERT INTO lecturers 
          (id, academic_rank, functional_position, expertise, created_at, updated_at) 
          VALUES 
          (?, ?, ?, ?, NOW(), NOW())
        `, [staffUserId, staff.academic_rank, staff.functional_position, staff.expertise]);
        console.log(`Inserted lecturer record for ${staff.name}`);
      }

      // Assign role in model_has_roles
      const [existingMr] = await db.query("SELECT * FROM model_has_roles WHERE role_id = ? AND model_id = ?", [roleId, staffUserId]);
      if (existingMr.length === 0) {
        await db.query("INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)", [roleId, staffUserId]);
        console.log(`Assigned role 'staff' to ${staff.name}`);
      }

      // Seed Education History for this employee
      const [existingEdu] = await db.query("SELECT id FROM education_histories WHERE employee_id = ?", [staffUserId]);
      if (existingEdu.length === 0) {
        // Bachelor's
        await db.query(`
          INSERT INTO education_histories 
          (employee_id, degree, institution, major, start_year, end_year, gpa, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [staffUserId, staff.degree, staff.institution, staff.major, staff.start_year, staff.end_year, staff.gpa]);

        // Master's
        await db.query(`
          INSERT INTO education_histories 
          (employee_id, degree, institution, major, start_year, end_year, gpa, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [staffUserId, staff.degree_m, staff.inst_m, staff.major_m, staff.start_m, staff.end_m, staff.gpa_m]);

        // Doctorate (if applicable)
        if (staff.degree_d) {
          await db.query(`
            INSERT INTO education_histories 
            (employee_id, degree, institution, major, start_year, end_year, gpa, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [staffUserId, staff.degree_d, staff.inst_d, staff.major_d, staff.start_d, staff.end_d, staff.gpa_d]);
        }
        console.log(`Inserted education histories for ${staff.name}`);
      }
    }

    console.log('Additional employee seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding additional employees:', err);
    process.exit(1);
  }
}

run();

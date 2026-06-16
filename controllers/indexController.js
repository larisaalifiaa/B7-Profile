const bcrypt = require("bcryptjs");
const db = require("../lib/db");

const index = (req, res) => {
  res.redirect("/home");
};

const home = async (req, res, next) => {
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

    const employee = empRows.length > 0 ? empRows[0] : null;

    // Check if the user is a lecturer (Dosen)
    const [lecRows] = await db.query("SELECT * FROM lecturers WHERE id = ?", [userId]);
    const isLecturer = lecRows.length > 0;

    const [[eduCount]] = await db.query("SELECT COUNT(*) AS count FROM education_histories WHERE employee_id = ?", [userId]);
    const [[resCount]] = await db.query("SELECT COUNT(*) AS count FROM research_members WHERE lecturer_id = ?", [userId]);
    const [[pubCount]] = await db.query("SELECT COUNT(*) AS count FROM publication_authors WHERE lecturer_id = ?", [userId]);
    const [[serCount]] = await db.query("SELECT COUNT(*) AS count FROM community_service_members WHERE lecturer_id = ?", [userId]);
    const [[comCount]] = await db.query("SELECT COUNT(*) AS count FROM committee_members WHERE employee_id = ?", [userId]);
    const [[asnCount]] = await db.query("SELECT COUNT(*) AS count FROM assignments WHERE assigned_to = ?", [userId]);

    res.render("home", { 
      title: "Dashboard", 
      employee,
      isLecturer,
      stats: {
        education: eduCount.count,
        research: resCount.count,
        publications: pubCount.count,
        services: serCount.count,
        committees: comCount.count,
        assignments: asnCount.count
      }
    });
  } catch (err) {
    next(err);
  }
};

const loginPage = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  }
  res.render("login", { title: "Login", error: null });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      username,
    ]);

    if (rows.length === 0) {
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render("login", {
        title: "Login",
        error: "Invalid username or password",
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.name;

    res.redirect("/home");
  } catch (err) {
    next(err);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  index,
  home,
  loginPage,
  login,
  logout
};

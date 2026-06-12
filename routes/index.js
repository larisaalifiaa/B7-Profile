var express = require("express");
var router = express.Router();
const indexController = require("../controllers/indexController");
const employeeController = require("../controllers/employeeController");
const { isAuthenticated } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/acl");
const multer = require("multer");
const path = require("path");

// Configure multer for profile photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "photo-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Max size: 2MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Format berkas tidak diizinkan! Hanya diperbolehkan format .jpg, .jpeg, dan .png"));
    }
  }
});

/* GET home page. */
router.get("/", indexController.index);

router.get("/home", isAuthenticated, indexController.home);

router.get("/login", indexController.loginPage);

router.post("/login", indexController.login);

router.get("/logout", indexController.logout);

// Portfolio & Profile routes
router.get("/portfolio", isAuthenticated, checkPermission("view_portfolio"), employeeController.viewPortfolio);
router.get("/portfolio/pdf", isAuthenticated, checkPermission("view_portfolio"), employeeController.exportPortfolioPDF);

router.get("/profile", isAuthenticated, checkPermission("manage_profile"), employeeController.viewProfile);
router.get("/profile/edit", isAuthenticated, checkPermission("manage_profile"), employeeController.editProfilePage);
router.post(
  "/profile/edit", 
  isAuthenticated, 
  checkPermission("manage_profile"), 
  (req, res, next) => {
    upload.single("photo")(req, res, function (err) {
      if (err) {
        req.multerError = err.message;
      }
      next();
    });
  },
  employeeController.updateProfile
);

router.get("/profile/password", isAuthenticated, employeeController.changePasswordPage);
router.post("/profile/password", isAuthenticated, employeeController.changePassword);

// REST API Route
router.get("/api/portfolio", isAuthenticated, employeeController.getPortfolioAPI);

module.exports = router;

const express = require("express");
const c = require("../controllers");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

router.post("/auth/register", asyncHandler(c.register));
router.post("/auth/login", asyncHandler(c.login));
router.get("/doctors", asyncHandler(c.listDoctors));
router.get("/doctors/:id", asyncHandler(c.getDoctor));
router.get("/services", asyncHandler(c.listServices));
router.get("/services/:id", asyncHandler(c.getService));
router.get("/appointments", auth, asyncHandler(c.listAppointments));
router.get("/appointments/:id", auth, asyncHandler(c.getAppointment));
router.post("/appointments", auth, asyncHandler(c.createAppointment));
router.put("/appointments/:id", auth, asyncHandler(c.updateAppointment));
router.delete("/appointments/:id", auth, asyncHandler(c.deleteAppointment));
router.get("/profile", auth, asyncHandler(c.getProfile));
router.put("/profile", auth, asyncHandler(c.updateProfile));
router.get("/medical-records", auth, asyncHandler(c.listRecords));
router.get("/medical-records/:id", auth, asyncHandler(c.getRecord));
router.get("/dashboard", auth, asyncHandler(c.dashboard));
router.post("/contact", asyncHandler(c.contact));
module.exports = router;

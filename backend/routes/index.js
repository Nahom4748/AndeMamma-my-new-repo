// routes/index.js

const express = require("express");
const router = express.Router();

// Import sub-routers
const installRouter = require("./install.routes");
const loginRouter = require("./login.routes");
const supplierRouter = require("./supplier.routes");
const userRouter = require("./users.routes");
const collectionRouter=require("./collection.routes");
const marketorRouter = require("./marketors.routes");
const monthlyReportRouter = require("./MonthlyReport.routes");
const itemRouter = require("./item.routes");
const salesRouter = require("./sales.routes");
// import dashboardStatsRouter = require("./dashboardStats.routes");
const dashboardStatsRouter = require("./dashboardStats.routes");
const mammasProductRouter = require("./mammasproduct.routes");


// Use routers
router.use(installRouter);
router.use(loginRouter);
router.use(supplierRouter);
router.use(userRouter);
router.use(collectionRouter);
router.use(marketorRouter);
router.use(monthlyReportRouter);
router.use(itemRouter);
router.use(salesRouter);
router.use(dashboardStatsRouter);
router.use(mammasProductRouter);


module.exports = router;


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
// Use routers
router.use(installRouter);
router.use(loginRouter);
router.use(supplierRouter);
router.use(userRouter);
router.use(collectionRouter);
router.use(marketorRouter);


module.exports = router;


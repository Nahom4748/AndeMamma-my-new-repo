const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// Define user-related routes
router.post("/users", userController.CreateUser);
router.get("/users", userController.Users);
router.get("/roles", userController.CompanyRoles);
router.put("/users/:id", userController.UpdateUser);
router.delete('/users/:id', userController.DeleteUser);
router.get("/users/Marketor", userController.GetMarketors);



module.exports = router;
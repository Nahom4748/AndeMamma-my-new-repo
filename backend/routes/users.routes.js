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
router.post("/mamas",userController.createmamas)
router.get("/mamas",userController.getAllMammas)
router.put("/mamas/:id",userController.udateMammas)
router.delete("/mamas/:id",userController.deleteMammas)





module.exports = router;
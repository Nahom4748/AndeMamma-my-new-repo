const e = require("express");
const userService = require("./user.service");
const bcrypt = require("bcrypt");

async function logIn({ email, password }) {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    return { status: "fail", message: "Invalid email or password" };
  }

  const isMatch = await bcrypt.compare(password, user.password_hashed);
  console.log(isMatch)
  if (!isMatch) {
    return { status: "fail", message: "Invalid email or password" };
  }

  return { status: "success", data: user };
}

module.exports = { logIn };

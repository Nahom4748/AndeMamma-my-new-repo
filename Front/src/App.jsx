import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/Admin/AdminDashboard";
import Datadashboard from "./components/DataEncoder/Datadashboard";
import NewDashboard from "./components/NewDashboard";

function App() {
  return (
    <Router>
      {/* <Header /> */}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<AdminDashboard/>} />
        <Route path="/Datadashboard" element={<Datadashboard/>} />
        <Route path="/admin" element={<NewDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo/Heading */}
        <div
          className="text-2xl md:text-3xl font-extrabold text-white tracking-wide cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="text-green-200">Andemamma</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 items-center">
          <button
            className="text-white font-semibold hover:text-green-200 transition"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="bg-white text-green-700 font-bold px-5 py-2 rounded-full shadow hover:bg-green-100 transition"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-green-700 px-4 pb-4">
          <button
            className="block w-full text-left text-white font-semibold py-2 hover:text-green-200"
            onClick={() => {
              navigate("/login");
              setMenuOpen(false);
            }}
          >
            Login
          </button>
          <button
            className="block w-full text-left bg-white text-green-700 font-bold py-2 rounded-full mt-2 shadow hover:bg-green-100"
            onClick={() => {
              navigate("/register");
              setMenuOpen(false);
            }}
          >
            Register
          </button>
        </div>
      )}
    </header>
  );
}
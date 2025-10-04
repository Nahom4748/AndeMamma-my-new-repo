import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import axios from "axios";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
    headers: { "Content-Type": "application/json" }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Please fill in all fields");
      }

      const response = await api.post("/login", formData);
      console.log(response.data)

      if (response.data.status === "success") {
        const token = response.data.data.user_token;
        const userInfo = response.data.data.user_info;

        localStorage.setItem("authToken", token);
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        navigate("/dashboard");
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error) {
      let errorMessage = "Login failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-10 cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-green-600 text-white p-3 rounded-lg shadow-md">
            <span className="text-2xl font-black">A</span>
          </div>
          <span className="ml-3 text-3xl font-bold text-gray-800">
            nde<span className="text-green-600">Mamma</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
              <p className="mt-2 text-gray-500">Sign in to continue</p>
              {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <FiMail className="absolute top-3 left-3 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="pl-10 pr-3 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <FiLock className="absolute top-3 left-3 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                    className="pl-10 pr-3 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 ${isLoading && "opacity-70"}`}
              >
                {isLoading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></span>
                ) : (
                  <>Sign In <FiArrowRight className="ml-2" /></>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")} className="text-green-600 hover:text-green-500 font-medium">
                Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

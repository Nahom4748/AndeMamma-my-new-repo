import React from "react";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-green-600 to-green-400 text-white py-20 px-6 text-center">
      <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Welcome to Andemamma Collection</h1>
      <p className="text-xl mb-8 max-w-2xl mx-auto">
        Discover our exclusive green-themed collection, innovative paper solutions, and efficient staff system. Join us to experience the future of eco-friendly management!
      </p>
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        <div className="bg-white/20 rounded-xl p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-2">Collection</h2>
          <p>Explore our curated eco-friendly products.</p>
        </div>
        <div className="bg-white/20 rounded-xl p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-2">Paper</h2>
          <p>Go paperless with our digital solutions.</p>
        </div>
        <div className="bg-white/20 rounded-xl p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-2">Staff System</h2>
          <p>Manage your team with ease and efficiency.</p>
        </div>
      </div>
    </section>
  );
}
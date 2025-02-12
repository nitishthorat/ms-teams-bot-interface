"use client";
import React from "react";

interface NavbarProps {
  onToggleModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleModal }) => {
  return (
    <nav className="bg-indigo-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-lg font-bold">MS Teams Bot Creator</h1>
        <button
          onClick={onToggleModal}
          className="bg-white text-indigo-600 px-4 py-2 rounded-md shadow hover:bg-gray-100 transition"
        >
          Create Bot
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

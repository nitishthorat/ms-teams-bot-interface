"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ChatInterface from "@/components/ChatInterface";
import CreationForm from "./creation-form";

const HomePage = () => {
  const bots = [
    { id: 1, name: "Bot A", description: "Description for Bot A" },
    { id: 2, name: "Bot B", description: "Description for Bot B" },
    { id: 3, name: "Bot C", description: "Description for Bot C" },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  useEffect(() => {}, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <Navbar onToggleModal={toggleModal} />

      {/* Main Content */}
      <ChatInterface />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={toggleModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              &#x2715;
            </button>
            <CreationForm />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;

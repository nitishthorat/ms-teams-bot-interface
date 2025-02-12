"use client";

import React, { useState } from "react";

const CreationForm = () => {
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [botResponse, setBotResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const createBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setBotResponse("");

    // Fetch tokens from localStorage
    const azureToken = localStorage.getItem("azureToken");
    const graphToken = localStorage.getItem("graphToken");

    if (!graphToken) {
      setLoading(false);
      setBotResponse("Error: Graph token is missing from localStorage.");
      return;
    }

    try {
      const res = await fetch("/api/createBot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botName,
          botDescription,
          azureToken,
          graphToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBotResponse("Bot successfully created!");
        console.log("Bot Creation Data:", data);
      } else {
        setBotResponse(`Error: ${data.error || "Failed to create bot"}`);
      }
    } catch (error) {
      console.error("Error creating bot:", error);
      setBotResponse("An unexpected error occurred while creating the bot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-md rounded-md p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        Create MS Teams Bot
      </h1>
      <form onSubmit={createBot} className="space-y-4">
        <div>
          <label
            htmlFor="botName"
            className="block text-sm font-medium text-gray-700"
          >
            Bot Name:
          </label>
          <input
            type="text"
            id="botName"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your bot's name"
          />
        </div>
        <div>
          <label
            htmlFor="botDescription"
            className="block text-sm font-medium text-gray-700"
          >
            Bot Description:
          </label>
          <input
            type="text"
            id="botDescription"
            value={botDescription}
            onChange={(e) => setBotDescription(e.target.value)}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter a description for your bot"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md font-medium text-white ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 transition"
          }`}
        >
          {loading ? "Creating Bot..." : "Create Bot"}
        </button>
      </form>
      {botResponse && (
        <p
          className={`mt-4 text-center text-sm font-medium ${
            botResponse.includes("Error") ? "text-red-600" : "text-green-600"
          }`}
        >
          {botResponse}
        </p>
      )}
    </div>
  );
};

export default CreationForm;

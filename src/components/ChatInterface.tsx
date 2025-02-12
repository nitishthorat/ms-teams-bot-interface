"use client";
import React, { useEffect, useState } from "react";

interface Bot {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  appId: string;
}

const ChatInterface: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<
    { sender: string; text?: string; attachment?: File }[]
  >([]);
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch("/api/bots/getAllBots", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("azureToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bots: ${response.statusText}`);
        }

        const data = await response.json();
        const botList = data.value.map((bot: any) => ({
          id: bot.id,
          name: bot.name,
          description: bot.properties.displayName || "No description available",
          appId: bot.properties.msaAppId,
          endpoint: bot.properties.endpoint,
        }));

        console.log(data);

        setBots(botList);
        setSelectedBot(botList[0]);
      } catch (error) {
        console.error("Error fetching bots:", error);
      }
    };

    fetchBots();
  }, []);

  const handleBotSelect = (bot: Bot) => {
    setSelectedBot(bot);
    setMessages([]);
  };

  const handleAddToTeams = (bot: Bot) => {
    console.log(bot);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBot) return;

    const payload: any = {
      type: "message",
    };

    if (inputText.trim()) {
      payload.text = inputText.trim();
      setMessages((prev) => [...prev, { sender: "user", text: inputText }]);
    }

    if (attachment) {
      payload.attachments = [
        {
          contentType: attachment.type,
          contentUrl: URL.createObjectURL(attachment),
          name: attachment.name,
        },
      ];
      setMessages((prev) => [...prev, { sender: "user", attachment }]);
      setAttachment(null);
    }

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("azureToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const botResponse = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: botResponse.text },
      ]);
    } catch (error) {
      console.error("Error communicating with bot:", error);
    } finally {
      setInputText("");
    }
  };

  return (
    <div className="flex flex-1">
      <div className="w-1/4 bg-gray-100 p-4 border-r border-gray-300">
        <h2 className="text-lg font-bold mb-4">My Bots</h2>
        <ul className="space-y-2">
          {bots.map((bot) => (
            <li
              key={bot.id}
              onClick={() => handleBotSelect(bot)}
              className={`p-2 cursor-pointer rounded-md flex items-center justify-between ${
                selectedBot?.id === bot.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-800 hover:bg-gray-200"
              }`}
            >
              <span
                onClick={() => handleBotSelect(bot)}
                className={`flex-1 ${
                  selectedBot?.id === bot.id ? "font-bold text-indigo-600" : ""
                }`}
              >
                {bot.name}
              </span>
              <a
                href={`https://teams.microsoft.com/l/chat/0/0?users=28:${bot.appId}`}
                className="ml-2"
              >
                <img
                  src="https://dev.botframework.com/Client/Images/Add-To-MSTeams-Buttons.png"
                  alt="Add to Teams"
                  className="w-24 h-auto" // Adjust width as needed
                />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedBot ? (
          <>
            <div className="bg-indigo-500 text-white p-4">
              <h1 className="text-lg font-bold">{selectedBot.name}</h1>
              <p className="text-sm">{selectedBot.description}</p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-md max-w-sm ${
                      msg.sender === "user"
                        ? "bg-gray-200 text-gray-800 self-end ml-auto"
                        : "bg-indigo-100 text-indigo-800"
                    }`}
                  >
                    {msg.text}
                    {msg.attachment && (
                      <div>
                        <a
                          href={URL.createObjectURL(msg.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          {msg.attachment.name}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-300">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="border border-gray-300 rounded-md shadow-sm"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">No bots available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;

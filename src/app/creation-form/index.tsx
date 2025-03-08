"use client";

import React, { useState } from "react";
import fs from "fs";
import path from "path";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";

const CreationForm = () => {
  const [botName, setBotName] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [outlineIcon, setOutlineIcon] = useState<File | null>(null);
  const [colorIcon, setColorIcon] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [botResponse, setBotResponse] = useState("");

  // Handle file selection and validation
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "image/png") {
      setFile(file);
    } else {
      alert("Please upload a valid PNG file.");
      event.target.value = ""; // Reset file input
    }
  };

  const createBot = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setBotResponse("");

    const azureToken = localStorage.getItem("azureToken") || "";
    const graphToken = localStorage.getItem("graphToken") || "";
    const formData = {
      botName: botName,
      developerName: developerName,
      websiteUrl: websiteUrl,
      privacyUrl: privacyUrl,
      termsUrl: termsUrl,
      shortDescription: shortDescription,
      longDescription: longDescription,
      azureToken: azureToken,
      graphToken: graphToken,
    };

    try {
      const res = await fetch("/api/createAzureBot", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setBotResponse("Bot successfully created in Azure!");
        console.log("Azure Bot Creation Data:", data);
        const zipBuffer = await createManifestPackage(data.msaAppId);
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

  const createManifestPackage = async (botId: string): Promise<Buffer> => {
    try {
      console.log("In create app manifest");
      console.log(`Bot id: ${botId}`);
      const manifestId = uuidv4();

      // ✅ Step 1: Construct the manifest JSON dynamically
      const manifest = {
        $schema:
          "https://developer.microsoft.com/en-us/json-schemas/teams/v1.19/MicrosoftTeams.schema.json",
        version: "1.0.0",
        manifestVersion: "1.19",
        id: manifestId,
        name: { short: botName, full: botName },
        developer: {
          name: developerName,
          mpnId: "",
          websiteUrl: websiteUrl,
          privacyUrl: privacyUrl,
          termsOfUseUrl: termsUrl,
        },
        description: {
          short: shortDescription,
          full: longDescription,
        },
        icons: { outline: "outline.png", color: "color.png" },
        accentColor: "#FFFFFF",
        webApplicationInfo: {
          id: botId,
          resource: "",
        },
        bots: [
          {
            botId: botId,
            scopes: ["team", "personal", "groupChat"],
            supportsFiles: true,
            supportsCalling: false,
            supportsVideo: true,
          },
        ],
        composeExtensions: [
          {
            botId: botId,
            commands: [
              {
                id: "exampleCmd1",
                title: "Example Command",
                type: "query",
                context: ["compose", "commandBox"],
                description: "Example command description",
                initialRun: true,
                fetchTask: false,
              },
            ],
          },
        ],
        permissions: ["identity", "messageTeamMembers"],
        validDomains: ["yourbot.azurewebsites.net"],
        defaultInstallScope: "team",
        defaultGroupCapability: {
          team: "bot",
          groupchat: "bot",
          meetings: "bot",
        },
      };

      // ✅ Step 2: Convert manifest JSON to string
      const manifestJsonString = JSON.stringify(manifest, null, 2);

      // ✅ Step 3: Create a ZIP file
      const zip = new JSZip();

      zip.file("manifest.json", manifestJsonString); // Add manifest.json

      if (outlineIcon) {
        const outlineBuffer = await outlineIcon.arrayBuffer();
        zip.file("outline.png", Buffer.from(outlineBuffer));
      }

      if (colorIcon) {
        const colorBuffer = await colorIcon.arrayBuffer();
        zip.file("color.png", Buffer.from(colorBuffer));
      }

      // ✅ Step 4: Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      const zipBlob = new Blob([zipBuffer], { type: "application/zip" });

      // Create a download link dynamically
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = "manifest_package.zip";

      // Append link, trigger click, and remove the link
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      console.log("✅ Manifest package created successfully!");
      return zipBuffer;
    } catch (error) {
      console.error("❌ Error creating manifest package:", error);
      throw error;
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-md rounded-md p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        Create MS Teams Bot
      </h1>
      <form onSubmit={createBot} className="space-y-4">
        {/* Bot Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bot Name:
          </label>
          <input
            type="text"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Developer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Developer Name:
          </label>
          <input
            type="text"
            value={developerName}
            onChange={(e) => setDeveloperName(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Website URL:
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Privacy URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Privacy Policy URL:
          </label>
          <input
            type="url"
            value={privacyUrl}
            onChange={(e) => setPrivacyUrl(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Terms of Use URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Terms of Use URL:
          </label>
          <input
            type="url"
            value={termsUrl}
            onChange={(e) => setTermsUrl(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Short Description:
          </label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Long Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Long Description:
          </label>
          <textarea
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Outline Icon (PNG) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Outline Icon (PNG only):
          </label>
          <input
            type="file"
            accept="image/png"
            onChange={(e) => handleFileChange(e, setOutlineIcon)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Color Icon (PNG) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Color Icon (PNG only):
          </label>
          <input
            type="file"
            accept="image/png"
            onChange={(e) => handleFileChange(e, setColorIcon)}
            required
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
        >
          {loading ? "Uploading Bot Data..." : "Submit Bot Details"}
        </button>
      </form>

      {/* Display Response Message */}
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

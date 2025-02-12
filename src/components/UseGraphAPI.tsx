import React from "react";

const UseGraphAPI = () => {
  const callGraphAPI = async () => {
    const graphToken = JSON.parse(localStorage.getItem("graphToken") || "{}");

    if (!graphToken.access_token) {
      console.error("Graph token is not available.");
      return;
    }

    try {
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${graphToken.access_token}`,
        },
      });

      const data = await response.json();
      console.log("Graph API Response:", data);
    } catch (error) {
      console.error("Error calling Graph API:", error);
    }
  };

  return <button onClick={callGraphAPI}>Call Graph API</button>;
};

export default UseGraphAPI;

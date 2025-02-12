import { useEffect } from "react";

const TokenHandler = () => {
  useEffect(() => {
    const fetchAndStoreTokens = async () => {
      try {
        const response = await fetch("/api/token");
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.statusText}`);
        }

        const data = await response.json();

        // Store tokens in localStorage as JSON strings
        localStorage.setItem("graphToken", JSON.stringify(data.graphToken));
        localStorage.setItem("azureToken", JSON.stringify(data.azureToken));

        console.log("Tokens stored in localStorage.");
      } catch (error) {
        console.error("Error fetching or storing tokens:", error);
      }
    };

    fetchAndStoreTokens();
  }, []);

  return null; // This component doesn't render anything
};

export default TokenHandler;

import fetch from "cross-fetch";

const AZURE_TOKEN_URL = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

// Function to fetch the access token
export const getAccessToken = async (
  scope: string
): Promise<{ token: string; expiresIn: number }> => {
  // Construct request parameters
  const params = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID!,
    client_secret: process.env.AZURE_CLIENT_SECRET!,
    scope,
    grant_type: "client_credentials",
  });

  try {
    // Make the request to the Azure OAuth endpoint
    const response = await fetch(AZURE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    // Parse the response
    const data = await response.json();

    // Check if the response contains required fields
    if (!data.access_token || !data.expires_in) {
      throw new Error(
        "Invalid response from Azure: Missing 'access_token' or 'expires_in'"
      );
    }

    // Return the token and expiry time
    return {
      token: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error: any) {
    console.error("Error fetching access token:", error.message);
    throw new Error(`Failed to fetch token: ${error.message}`);
  }
};

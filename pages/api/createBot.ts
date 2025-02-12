import { NextApiRequest, NextApiResponse } from "next";

const AZURE_MANAGEMENT_API_URL =
  process.env.AZURE_MANAGEMENT_API_URL || "https://management.azure.com";
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || "";
const RESOURCE_GROUP = process.env.RESOURCE_GROUP || "";
const TENANT_ID = process.env.TENANT_ID || "";
const CLIENT_ID = process.env.CLIENT_ID || "";
const CLIENT_SECRET = process.env.CLIENT_SECRET || "";

// Fetch Access Token if not available in LocalStorage
async function getAccessTokenFromAzure() {
  const response = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://management.azure.com/.default",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Azure token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createAzureApp(graphToken: string, botName: string) {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/applications",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${graphToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: `${botName}-App`,
        signInAudience: "AzureADMyOrg",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create Azure Application: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

async function createBotRegistration(
  azureToken: string,
  botName: string,
  botDescription: string,
  appId: string
): Promise<any> {
  const endpoint = `${AZURE_MANAGEMENT_API_URL}/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.BotService/botServices/${botName}?api-version=2021-03-01`;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${azureToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: "global",
        kind: "registration",
        sku: { name: "F0" },
        properties: {
          displayName: botName,
          description: botDescription,
          endpoint: `https://55eb-2601-642-4e00-50-89ad-428-1233-386b.ngrok-free.app`, // Update this to the correct endpoint
          msaAppId: appId,
          runtimeVersion: "v4.0",
        },
      }),
    });

    // Log status and response body
    console.log("Azure API Response Status:", response.status);

    const responseText = await response.text();
    console.log("Azure API Response Body:", responseText);

    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(
        `Failed to create Bot Registration: ${response.statusText} (HTTP ${response.status})\nResponse: ${responseText}`
      );
    }

    // Parse and return the response data
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    console.error("Error creating bot registration:", error);
    throw error; // Rethrow the error for further handling if needed
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { botName, botDescription, azureToken, graphToken } = req.body;

  try {
    // Use provided tokens or fetch new ones
    const azureAccessToken = azureToken || (await getAccessTokenFromAzure());
    const graphAccessToken = graphToken;

    if (!graphAccessToken) {
      return res.status(400).json({ error: "Graph Token is required." });
    }

    // Step 1: Create Azure Application
    const appData = await createAzureApp(graphAccessToken, botName);
    console.log(appData);

    // Step 2: Register Bot
    const botData = await createBotRegistration(
      azureAccessToken,
      botName,
      botDescription,
      appData.appId
    );

    res.status(200).json({
      message: "Bot successfully created!",
      appData,
      botData,
    });
  } catch (error) {
    console.error("Error creating bot:", error);
    res.status(500).json({ error: "Failed to create bot" });
  }
}

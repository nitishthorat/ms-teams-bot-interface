import { NextApiRequest, NextApiResponse } from "next";

const AZURE_MANAGEMENT_API_URL = "https://management.azure.com";
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID || "";
const RESOURCE_GROUP = process.env.RESOURCE_GROUP || "";

const apiPermissions = [
  {
    id: "ebf0f66e-9fb1-49e4-a278-222f76911cf4",
    type: "Scope",
  },
  {
    id: "5922d31f-46c8-4404-9eaf-2117e390a8a4",
    type: "Scope",
  },
  {
    id: "6b7d71aa-70aa-4810-a8d9-5d9fb2830017",
    type: "Role",
  },
  {
    id: "294ce7c9-31ba-490a-ad7d-97a7d075e4ed",
    type: "Role",
  },
  {
    id: "7e9a077b-3711-42b9-b7cb-5fa5f3f7fea7",
    type: "Scope",
  },
  {
    id: "2280dda6-0bfd-44ee-a2f4-cb867cfc4c1e",
    type: "Role",
  },
  {
    id: "485be79e-c497-4b35-9400-0e3fa7f2a5d4",
    type: "Scope",
  },
  {
    id: "9e19bae1-2623-4c4f-ab6e-2664615ff9a0",
    type: "Role",
  },
  {
    id: "a96d855f-016b-47d7-b51c-1218a98d791c",
    type: "Role",
  },
  {
    id: "b98bfd41-87c6-45cc-b104-e2de4f0dafb9",
    type: "Scope",
  },
];

// Disable Next.js built-in body parser (since we're handling multipart/form-data manually)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`Form Data: ${req.body}`);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Manually parse the incoming form-data request
    const formData = JSON.parse(req.body);
    console.log(formData);

    // Extract required fields
    const botName = formData.botName;
    const shortDescription = formData.shortDescription;
    const azureToken = formData.azureToken;
    const graphToken = formData.graphToken;

    // Validate required fields
    if (!graphToken)
      return res.status(400).json({ error: "Graph Token is required." });
    if (!botName)
      return res.status(400).json({ error: "Bot Name is required." });
    if (!azureToken)
      return res.status(400).json({ error: "Azure Token is required." });

    console.log(graphToken);

    // Step 1: Create Azure Application
    const appData = await createAzureApp(graphToken, botName);
    console.log("✅ Azure App Created:", appData);

    // Step 2: Register Bot in Azure
    const botData = await createBotRegistration(
      azureToken,
      botName,
      shortDescription,
      appData.appId
    );
    console.log("🤖 Bot Registration Successful:", botData);

    // Respond with success data
    return res.status(200).json({
      message: "Bot successfully created!",
      msaAppId: appData.appId,
    });
  } catch (error) {
    console.error("❌ Error creating bot:", error);
    return res.status(500).json({ error: "Failed to create bot" });
  }
}

// Function to create an Azure App
async function createAzureApp(graphToken: string, botName: string) {
  try {
    const createAppResponse = await fetch(
      "https://graph.microsoft.com/v1.0/applications",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: `${botName}-App`,
          signInAudience: "AzureADMultipleOrgs",
          requiredResourceAccess: [
            {
              resourceAppId: "00000003-0000-0000-c000-000000000000", // Microsoft Graph App ID
              resourceAccess: apiPermissions,
            },
          ],
        }),
      }
    );

    if (!createAppResponse.ok) {
      throw new Error(
        `Failed to create Azure Application: ${await createAppResponse.text()}`
      );
    }

    const appData = await createAppResponse.json();

    const appId = appData.appId;
    const objectId = appData.id; // Needed for client secret generation

    // ✅ Step 2: Generate Client Secret
    const clientSecret = await generateClientSecret(graphToken, objectId);

    return { appId, objectId, clientSecret };
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

async function generateClientSecret(graphToken: string, objectId: string) {
  try {
    const createSecretResponse = await fetch(
      `https://graph.microsoft.com/v1.0/applications/${objectId}/addPassword`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passwordCredential: {
            displayName: "BotAppSecret",
            endDateTime: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ).toISOString(),
          },
        }),
      }
    );

    if (!createSecretResponse.ok) {
      throw new Error(
        `Failed to generate client secret: ${createSecretResponse.statusText}`
      );
    }

    const secretData = await createSecretResponse.json();
    console.log("🔑 Client Secret Generated:", secretData.secretText);

    // Save the appid and client secret in db here

    return secretData.secretText; // ✅ Only returned once, cannot be retrieved again!
  } catch (error) {
    console.error("❌ Error generating client secret:", error);
    throw error;
  }
}

// Function to register bot in Azure
async function createBotRegistration(
  azureToken: string,
  botName: string,
  botDescription: string,
  appId: string
): Promise<any> {
  const endpoint = `${AZURE_MANAGEMENT_API_URL}/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.BotService/botServices/${botName}-${Date.now()}?api-version=2021-03-01`;
  console.log("App id: ", appId);
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
          endpoint:
            "https://5b5f-2601-642-4e00-50-fc01-d442-e6ad-c807.ngrok-free.app/api/messages", // Update with correct bot endpoint
          msaAppId: appId,
          runtimeVersion: "v4.0",
        },
      }),
    });

    console.log(response.statusText);

    if (!response.ok) {
      throw new Error(
        `Failed to create Bot Registration: ${await response.text()}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error creating bot registration:", error);
    throw error;
  }
}

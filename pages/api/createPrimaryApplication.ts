import type { NextApiRequest, NextApiResponse } from "next";

type CreatePrimaryAppRequest = {
  tenantId: string;
  subscriptionId: string;
};

type CreatePrimaryAppResponse = {
  message: string;
  data?: {
    appId: string;
    tenantId: string;
    subscriptionId: string;
  };
};

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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreatePrimaryAppResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { tenantId, subscriptionId } = req.body as CreatePrimaryAppRequest;

  if (!tenantId || !subscriptionId) {
    return res.status(400).json({
      message: "Both tenantId and subscriptionId are required.",
    });
  }

  try {
    // Mocking creation of a primary app (could be database entry or Azure SDK integration)
    const appId = `app-${Date.now()}`;

    return res.status(200).json({
      message: "Primary application created successfully.",
      data: {
        appId,
        tenantId,
        subscriptionId,
      },
    });
  } catch (error) {
    console.error("Error creating primary app:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

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

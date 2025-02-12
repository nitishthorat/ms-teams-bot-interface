import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "cross-fetch";

const AZURE_TOKEN_URL = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`;

const fetchToken = async (scope: string): Promise<any> => {
  const params = new URLSearchParams({
    client_id: process.env.AZURE_CLIENT_ID!,
    client_secret: process.env.AZURE_CLIENT_SECRET!,
    scope,
    grant_type: "client_credentials",
  });

  const response = await fetch(AZURE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch token: ${errorText}`);
  }

  return response.json();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const [graphToken, azureToken] = await Promise.all([
      fetchToken("https://graph.microsoft.com/.default"),
      fetchToken("https://management.azure.com/.default"),
    ]);

    res.status(200).json({ graphToken, azureToken });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "cross-fetch";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tenantId, clientId, clientSecret } = req.body;

  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const fetchToken = async (scope: string): Promise<any> => {
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope,
      grant_type: "client_credentials",
    });

    const response = await fetch(url, {
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

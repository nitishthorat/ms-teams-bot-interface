import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "cross-fetch";

const AZURE_BOT_LIST_URL =
  "https://management.azure.com/subscriptions/7aaa66ce-b624-488c-a07a-0ab111cc805a/providers/Microsoft.BotService/botServices?api-version=2021-03-01";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }

  try {
    const response = await fetch(AZURE_BOT_LIST_URL, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch bots: ${errorText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Error fetching bot list:", error.message);
    res.status(500).json({ error: error.message });
  }
}

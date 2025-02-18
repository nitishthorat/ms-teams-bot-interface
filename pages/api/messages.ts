import type { NextApiRequest, NextApiResponse } from "next";
import { BotFrameworkAdapter, TurnContext, MessageFactory } from "botbuilder";

// ✅ Set up Bot Adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.APP_ID || "",
  appPassword: process.env.APP_PASSWORD || "",
});

// ✅ Handle errors
adapter.onTurnError = async (context: TurnContext, error: Error) => {
  console.error("🔴 Bot Error:", error);
  await context.sendActivity("Oops! Something went wrong.");
};

// ✅ Main Bot Logic
const handleIncomingMessage = async (context: TurnContext) => {
  const userMessage = context.activity.text; // Extract user message
  console.log("🟢 Received Message:", userMessage);

  // ✅ Respond with a static message
  const replyText = "Hello! This is a static response from the bot.";
  await context.sendActivity(MessageFactory.text(replyText));
};

// ✅ Next.js API Route Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("👀 Bot endpoint hit with method:", req.method);
  console.log("👀 Request body:", JSON.stringify(req.body, null, 2));

  // ✅ CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Handle CORS Preflight Requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // ✅ Process incoming bot message
    await adapter.processActivity(req, res, async (turnContext) => {
      console.log("Activity type:", turnContext.activity.type);
      console.log(
        "Activity payload:",
        JSON.stringify(turnContext.activity, null, 2)
      );
      await handleIncomingMessage(turnContext);
    });
  } catch (error) {
    console.error("🔴 Error processing bot message:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

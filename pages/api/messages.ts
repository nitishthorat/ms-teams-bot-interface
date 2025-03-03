import type { NextApiRequest, NextApiResponse } from "next";
import { BotFrameworkAdapter, TurnContext, MessageFactory } from "botbuilder";
import { verifyBotRequest } from "./verifyBotRequest";

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
  if (context.activity.type !== "message") {
    console.log("🟡 Ignoring non-message activity.");
    return;
  }

  console.log(
    "🟢 Received Message:",
    JSON.stringify(context.activity, null, 2)
  );

  if (context.activity.attachments && context.activity.attachments.length > 0) {
    const attachment = context.activity.attachments[0];

    console.log("📂 Received Attachment:", JSON.stringify(attachment, null, 2));

    if (!attachment.contentType) {
      await context.sendActivity("⚠️ Attachment missing content type.");
      return;
    }

    // ✅ Handling Microsoft Teams File Attachments
    if (attachment.contentType === "text/html") {
      await context.sendActivity(`Static message from MS teams`);

      return;
    }
    if (
      attachment.contentType ===
      "application/vnd.microsoft.teams.file.download.info"
    ) {
      console.log("📂 Detected a Teams File attachment.");

      // Extract download URL
      const fileInfo = attachment.content as any;
      if (fileInfo && fileInfo.downloadUrl) {
        console.log("🔗 File Download URL:", fileInfo.downloadUrl);

        // ✅ Send a message with the download link instead of an attachment
        await context.sendActivity(
          `📎 Here is your file: [${attachment.name}](${fileInfo.downloadUrl})`
        );
      } else {
        console.error("❌ Missing download URL in Teams file attachment.");
        await context.sendActivity(
          "⚠️ Unable to retrieve file. No download URL found."
        );
      }
      return;
    }

    // ✅ List of supported attachment types (for non-Teams specific files)
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "application/pdf",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(attachment.contentType)) {
      console.error("❌ Unsupported attachment type:", attachment.contentType);
      await context.sendActivity(
        `⚠️ Unsupported file type: ${attachment.contentType}`
      );
      return;
    }

    // ✅ Send back the attachment for other supported formats
    const reply = MessageFactory.attachment({
      contentType: attachment.contentType,
      contentUrl: attachment.contentUrl,
      name: attachment.name,
    });

    await context.sendActivity(reply);
  } else {
    // ✅ Respond with a static message
    await context.sendActivity(
      "Hello! This is a static response from the bot."
    );
  }
};

// ✅ Next.js API Route Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("👀 Bot endpoint hit with method:", req.method);
  console.log("👀 Request body:", JSON.stringify(req.body, null, 2));
  await verifyBotRequest(req);

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

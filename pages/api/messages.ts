import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

// Interface for the Bot Framework activity
interface BotFrameworkActivity {
  type: string;
  text: string;
  from?: {
    id: string;
    name: string;
  };
  conversation?: {
    id: string;
  };
}

// Interface for the response
interface ChatResponse {
  text: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Conversation history cache (in-memory, replace with a more robust solution in production)
const conversationHistory: Record<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | { message: string }>
) {
  // Handle different HTTP methods
  if (req.method === "GET") {
    return res.status(200).json({ message: "Bot service is running" });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Validate request
    await validateRequest(req);

    // Parse the incoming activity
    const activity: BotFrameworkActivity = req.body;

    // Process the message
    const responseText = await processMessageWithOpenAI(activity);

    // Respond with the bot's message
    return res.status(200).json({
      text: responseText,
    });
  } catch (error) {
    console.error("Error processing bot message:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
}

// Basic request validation
async function validateRequest(req: NextApiRequest): Promise<void> {
  // Check for required fields
  if (!req.body || !req.body.text) {
    throw new Error("Invalid request: Missing message text");
  }

  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }
}

// Message processing logic with OpenAI
async function processMessageWithOpenAI(
  activity: BotFrameworkActivity
): Promise<string> {
  // Use conversation ID or generate a unique identifier
  const conversationId = activity.conversation?.id || "default-conversation";

  // Initialize conversation history for this conversation if not exists
  if (!conversationHistory[conversationId]) {
    conversationHistory[conversationId] = [];
  }

  // Add current user message to conversation history
  conversationHistory[conversationId].push({
    role: "user",
    content: activity.text,
  });

  // Limit conversation history to last 10 messages to manage token usage
  if (conversationHistory[conversationId].length > 10) {
    conversationHistory[conversationId].shift();
  }

  try {
    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // You can change to gpt-4 if preferred
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Provide concise and friendly responses.",
        },
        ...conversationHistory[conversationId],
      ],
      max_tokens: 150, // Limit response length
      temperature: 0.7, // Control randomness of response
    });

    // Extract the AI's response
    const aiResponse =
      completion.choices[0].message.content?.trim() ||
      "I'm not sure how to respond to that.";

    // Add AI response to conversation history
    conversationHistory[conversationId].push({
      role: "assistant",
      content: aiResponse,
    });

    return aiResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);

    // Fallback response in case of API error
    return "I'm experiencing some difficulties right now. Could you please try again?";
  }
}

// Explicitly configure API route
export const config = {
  api: {
    bodyParser: true,
  },
};

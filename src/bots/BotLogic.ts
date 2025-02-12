import { ActivityHandler, TurnContext } from "botbuilder";

export class MyBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages
    this.onMessage(async (context: TurnContext, next) => {
      const userMessage = context.activity.text;

      // Echo back the user's message
      await context.sendActivity(`You said: "${userMessage}"`);

      // Proceed to the next middleware
      await next();
    });

    // Handle new members joining the conversation
    this.onConversationUpdate(async (context: TurnContext, next) => {
      if (context.activity.membersAdded) {
        for (const member of context.activity.membersAdded) {
          if (member.id !== context.activity.recipient.id) {
            await context.sendActivity("Welcome! How can I assist you?");
          }
        }
      }
      await next();
    });
  }
}

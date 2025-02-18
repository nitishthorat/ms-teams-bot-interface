import {
  TeamsActivityHandler,
  TurnContext,
  MessageFactory,
  ConversationParameters,
  ConversationReference,
  BotFrameworkAdapter,
} from "botbuilder";

export class MyBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context: TurnContext, next) => {
      console.log("🟢 Received message:", context.activity.text);

      // ✅ Respond with a static message
      await this.sendStaticMessage(context);

      await next();
    });
  }

  private async sendStaticMessage(context: TurnContext) {
    try {
      const reply = MessageFactory.text(
        "Hello, user! This is a static message from the bot."
      );
      await context.sendActivity(reply);
    } catch (error) {
      console.error("🔴 Error sending message:", error);
    }
  }
}

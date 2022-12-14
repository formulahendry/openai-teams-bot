import {
  TeamsActivityHandler,
  CardFactory,
  TurnContext,
  AdaptiveCardInvokeValue,
  AdaptiveCardInvokeResponse,
} from "botbuilder";
import rawWelcomeCard from "./adaptiveCards/welcome.json";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { Configuration, OpenAIApi } from "openai";
import config from "./config";

export class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    const configuration = new Configuration({
      apiKey: config.openaiApiKey,
    });
    const openai = new OpenAIApi(configuration);

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");

      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(context.activity);
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: txt,
        temperature: 0,
        max_tokens: 2048,
      });

      await context.sendActivity(response.data.choices[0].text);

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          const card = AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
      }
      await next();
    });
  }
}

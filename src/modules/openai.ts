import {OpenAI} from 'openai';
import { Request } from 'express'

  
interface ChatGPTMessage {
    content: string;
    role: string;
}

export default class OpenAITools {
  
    static toChatGPTMessageArray(obj: any): ChatGPTMessage[] {
        if (!Array.isArray(obj)) {
          throw new Error("Object is not an array");
        }
      
        return obj.map(item => {
          if (typeof item !== 'object' || typeof item.content !== 'string' || typeof item.role !== 'string') {
            throw new Error("Invalid item in array");
          }
          return item as ChatGPTMessage;
        });
      }

    static parseReqBody(req: Request): OpenAI.Chat.ChatCompletionMessageParam[] {
        try {
          let newArray = OpenAITools.toChatGPTMessageArray(req.body.messages);
          return newArray.map(element => {
            if (element.role === "user") {
              let model: OpenAI.Chat.ChatCompletionUserMessageParam = {
                content: element.content,
                role: 'user'
              };
              return model
            } else if (element.role === "system") {
              let model: OpenAI.Chat.ChatCompletionSystemMessageParam = {
                content: element.content,
                role: 'system'
              };
              return model
            } else {
              let model: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
                content: element.content,
                role: 'assistant'
              };
              return model
            }
          })
        } catch (error) {
          console.error("Error during OpenAI API call:", error);
          return [];
        }  
      }
}
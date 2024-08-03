"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OpenAITools {
    static toChatGPTMessageArray(obj) {
        if (!Array.isArray(obj)) {
            throw new Error("Object is not an array");
        }
        return obj.map(item => {
            if (typeof item !== 'object' || typeof item.content !== 'string' || typeof item.role !== 'string') {
                throw new Error("Invalid item in array");
            }
            return item;
        });
    }
    static parseReqBody(req) {
        try {
            let newArray = OpenAITools.toChatGPTMessageArray(req.body.messages);
            return newArray.map(element => {
                if (element.role === "user") {
                    let model = {
                        content: element.content,
                        role: 'user'
                    };
                    return model;
                }
                else if (element.role === "system") {
                    let model = {
                        content: element.content,
                        role: 'system'
                    };
                    return model;
                }
                else {
                    let model = {
                        content: element.content,
                        role: 'assistant'
                    };
                    return model;
                }
            });
        }
        catch (error) {
            console.error("Error during OpenAI API call:", error);
            return [];
        }
    }
}
exports.default = OpenAITools;
//# sourceMappingURL=openai.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = require("openai");
const openai_2 = __importDefault(require("./modules/openai"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
const apiKey = process.env.OPENAI_API_KEY || "";
console.log(apiKey);
const openai = new openai_1.OpenAI({
    apiKey: apiKey,
});
app.get('/', (_req, res) => {
    return res.send('Express Typescript on Vercel');
});
app.get('/ping', (_req, res) => {
    return res.send('pong 🏓');
});
app.post('/chat/streams', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // let auth = checkAuthorization(req);
    // if (auth.code !== 200) {
    //     return res.status(401).json(auth);
    // }
    var e_1, _a;
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
    });
    let clientConnected = true;
    // if (typeof auth.data  === 'string') {
    //   res.end();
    // }
    let transformedArray = openai_2.default.parseReqBody(req);
    console.log(transformedArray);
    try {
        const completion = yield openai.chat.completions.create({
            model: req.body["model"] || "gpt-3.5-turbo",
            messages: transformedArray,
            stream: true,
            max_tokens: 2000
        });
        try {
            // 监听数据并发送到客户端
            for (var completion_1 = __asyncValues(completion), completion_1_1; completion_1_1 = yield completion_1.next(), !completion_1_1.done;) {
                const part = completion_1_1.value;
                if (!clientConnected) {
                    break;
                }
                // console.log("ww:" + counting + part.choices[0]?.delta?.content || '');
                res.write(`data: ${JSON.stringify(part)}\n`);
                yield delay(150);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (completion_1_1 && !completion_1_1.done && (_a = completion_1.return)) yield _a.call(completion_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        res.end();
    }
    catch (error) {
        console.error("Error during OpenAI API call:", error);
    }
    req.on('close', () => {
        console.log("close");
        clientConnected = false;
    });
}));
app.listen(port, () => {
    return console.log(`Server is listening on ${port}`);
});
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
//# sourceMappingURL=index.js.map
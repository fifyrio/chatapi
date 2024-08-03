import express, { Request, Response } from 'express';
import {OpenAI} from 'openai';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {convertBase64ToJpeg, compressImage} from './image'
import {uploadImage} from './upload'
import {getHomeData} from './home'
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const port = 3800; // 你可以选择任何可用的端口
app.use(express.json());
const apiKey = process.env.OPENAI_API_KEY || "";
const jwtSecret = process.env.JWT_SECRET || "";

//TODO: use in dev
const proxy = 'http://127.0.0.1:7890';
const agent = new HttpsProxyAgent(proxy);

const openai = new OpenAI({
    apiKey: apiKey,
    // httpAgent: agent
});

function delay(time: number | undefined) {
return new Promise(resolve => setTimeout(resolve, time));
}

interface AuthResponse {
  message: string;
  code: number;
  data: CustomJwtPayload | string
}

interface ChatGPTMessage {
  content: string;
  role: string;
}

interface CustomJwtPayload extends JwtPayload {
  // 添加你的自定义属性
  token: string;
  user_id: string;
  // model: string;
  // nsfw_check: boolean;
  // user: string;
  // messages: ChatGPTMessage[];
}

function checkAuthorization(req: Request): AuthResponse {
    const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length);
    
    try {
      var decodedToken = jwt.verify(token, jwtSecret) as CustomJwtPayload;      
      return {
        code: 200,
        message: "",
        data: decodedToken
      };      
    } catch(err) {   
      console.log(err);
      return {
        code: 401,
        message: "Authorization token expired",
        data: ""
      };
    }
  } else {    
    return {
      code: 401,      
      message: "Authorization token invalid",
      data: ""
    };
  }
}

function toChatGPTMessageArray(obj: any): ChatGPTMessage[] {
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

function parseReqBody(req: Request): OpenAI.Chat.ChatCompletionMessageParam[] {
  try {
    let newArray = toChatGPTMessageArray(req.body.messages);
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

// Define the /home/rec endpoint for POST request
app.post('/home/rec', (req, res) => {
  // Extract 'local' from the request body
  const { local } = req.body;

  // Define the response template
  getHomeData(local)
  .then(json => {    
    let data = {
      data: json, 
      code: 200
    };    
    res.json(data);
  })
  .catch(err => {
    console.error(err);
    res.json({code: 400, data: null});
  });
});

app.post('/images/gen', async (req: Request, res: Response) => {
  let auth = checkAuthorization(req);
  if (auth.code !== 200) {
      return res.status(401).json(auth);
  }

  res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked'
  });
    
  res.write(`data: ${JSON.stringify({data: {stage: "Perfecting pixels..."}})}\n\n`);
  await delay(100);
  
  res.write(`data: ${JSON.stringify({data: {stage: "Processing colors..."}})}\n\n`);
  await delay(100);
  
  res.write(`data: ${JSON.stringify({data: {stage: "Fine-tuning..."}})}\n\n`);
  let prompt = req.body["prompt"] || ""
  let model = req.body["model"] || "dall-e-2"  
  
  if (prompt === "") {
    let part = {data: {
      image: ""
    }}
    res.write(`data: ${JSON.stringify(part)}\n\n`);
    res.end();
    return;
  }
 
  const response = await openai.images.generate({
    model: model,
    prompt: prompt,
    n: 1,    
    size: model === 'dall-e-3'? "1024x1024" : "512x512",
    response_format: 'b64_json'
  });
  let base64String = response.data[0].b64_json || "";
  const uuid = uuidv4();  
  const outputPath = `./cache/${uuid}.jpeg`;
  console.log('Base64 To Jpeg:', outputPath);
  convertBase64ToJpeg(base64String, outputPath);
  const compressPath = `./cache/${uuid}-s.jpeg`;
  await compressImage(outputPath, compressPath, 80)
  console.log('uploadImage:', compressPath);
  const data = await uploadImage(compressPath, `${uuid}.jpeg`);
  console.log(data)

  let part = {data: {
    image: data
  }}
  res.write(`data: ${JSON.stringify(part)}\n\n`);
  res.end();
})

app.post('/chat/streams', async (req: Request, res: Response) => {       
    let auth = checkAuthorization(req);
    if (auth.code !== 200) {
        return res.status(401).json(auth);
    }
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
    });
    // res.setHeader('Content-Type', 'text/event-stream');
    // res.setHeader('Cache-Control', 'no-cache');
    // res.setHeader('Connection', 'keep-alive');
    // res.flushHeaders(); // 清空头部信息并发送
    
    /*
    // 每秒发送一次数据
    console.log(auth.data);
    const intervalId = setInterval(() => {
      if (typeof auth.data  !== 'string') {
        let authData = auth.data as CustomJwtPayload
        const data = { timestamp: new Date().toISOString(), data: authData.messages };
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
      
    }, 1000);    

    // 监听客户端断开连接
    req.on('close', () => {
        clearInterval(intervalId);
        console.log("close");
        res.end();
    });
    */
    /*  */  
    
    let clientConnected = true;    
    
    if (typeof auth.data  === 'string') {
      res.end();
    }
    /**/
    let transformedArray: OpenAI.Chat.ChatCompletionMessageParam[] = parseReqBody(req)
    
    try {            
      const completion = await openai.chat.completions.create(
        {
          model: req.body["model"] || "gpt-3.5-turbo",
          messages: transformedArray,   
          stream: true,			
          max_tokens: 2000
        }
      );
      
      // 监听数据并发送到客户端
      for await (const part of completion) {
          if (!clientConnected) {
              break;
          }
          // console.log("ww:" + counting + part.choices[0]?.delta?.content || '');
          res.write(`data: ${JSON.stringify(part)}\n`);
          await delay(150);        
      }          
      res.end();
    } catch (error) {
        console.error("Error during OpenAI API call:", error);
    }

    req.on('close', () => {
      console.log("close");
        clientConnected = false;
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

import express, { Request, Response } from 'express'
import {OpenAI} from 'openai';
import OpenAITools from './modules/openai';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express()
const port = process.env.PORT || 3000
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY || "";
const openai = new OpenAI({
    apiKey: apiKey,
});

app.get('/', (_req: Request, res: Response) => {
	return res.send('Express Typescript on Vercel')
})

app.get('/ping', (_req: Request, res: Response) => {
	return res.send('pong 🏓')
})

app.post('/chat/streams', async (req: Request, res: Response) => {       
    // let auth = checkAuthorization(req);
    // if (auth.code !== 200) {
    //     return res.status(401).json(auth);
    // }
    
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

    
    let transformedArray: OpenAI.Chat.ChatCompletionMessageParam[] = OpenAITools.parseReqBody(req);
	console.log(transformedArray);
    
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
	return console.log(`Server is listening on ${port}`)
})


function delay(time: number | undefined) {
	return new Promise(resolve => setTimeout(resolve, time));
}
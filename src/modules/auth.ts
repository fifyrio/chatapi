import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

interface AuthResponse {
message: string;
code: number;
data: CustomJwtPayload | string
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

const jwtSecret = process.env.JWT_SECRET || "";
console.log(jwtSecret);

export default class AuthTool {
    static checkAuthorization(req: Request): AuthResponse {
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
}
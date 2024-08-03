import fs from 'fs';
import * as dotenv from 'dotenv';
import { PutObjectCommand, S3Client, PutObjectCommandInput } from '@aws-sdk/client-s3';

dotenv.config();

const bucketName = 'chatmentor';
const SPACES_SECRET = process.env.SPACES_SECRET || "";
const SPACES_KEY_ID = process.env.SPACES_KEY_ID || "";
const cdn_host = "https://chatmentor.sfo3.cdn.digitaloceanspaces.com";
const image_placeholder = 'image_placeholder.svg'
const endpoint = 'https://sfo3.digitaloceanspaces.com';
if (!SPACES_SECRET) {
  throw new Error('SPACES_SECRET environment variable is not set.');
}

const s3Client = new S3Client({
  endpoint: endpoint, 
  forcePathStyle: false, 
  region: "sfo3", 
  credentials: {
    accessKeyId: SPACES_KEY_ID, 
    secretAccessKey: SPACES_SECRET 
  }
});

export async function uploadImage(localImagePath: string, key: string) {
  try {
      const fileContent = fs.readFileSync(localImagePath);

      const params: PutObjectCommandInput = {
        Bucket: bucketName, 
        Key: key,
        Body: fileContent, 
        ACL: "public-read", 
      };

      try {
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log(
          "Successfully uploaded object: " +
            params.Bucket +
            "/" +
            params.Key
        );        
        return `${cdn_host}/${key}`;
      } catch (err) {        
        console.log("Error", err);
        return `${cdn_host}/${image_placeholder}`;
      }
  } catch (error) {   
      console.error('Error uploading image:', error);
      return `${cdn_host}/${image_placeholder}`;
  }
}
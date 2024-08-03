import fs from 'fs';
import sharp from 'sharp';

export async function compressImage(inputPath: string, outputPath: string, quality: number = 50) {
    await sharp(inputPath)
        .jpeg({
            quality: quality // Quality ranges from 1-100 (lower means more compression)
        })
        .toFile(outputPath);
}

export function convertBase64ToJpeg(base64: string, outputPath: string) {
    // 移除 base64 数据的头部（如果有的话），比如 "data:image/jpeg;base64,"
    const base64Data = base64.replace(/^data:image\/jpeg;base64,/, "");

    // 将 base64 字符串解码为二进制数据
    const buffer = Buffer.from(base64Data, 'base64');

    // 将数据写入文件
    fs.writeFileSync(outputPath, buffer);
}

function test() {
    const filePath = './cache/file.txt'; // Replace with your file path
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const outputPath = './cache/output.jpeg';
        convertBase64ToJpeg(data, outputPath);
        
        const cPath = './cache/output-s.jpeg';
        compressImage(outputPath, cPath, 80)
    });
}
// test();
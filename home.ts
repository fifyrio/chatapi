
import { readFile } from 'fs/promises';
import path from 'path';

export async function getHomeData(local: String) {
    const localPath = "/jsons/home";
    // 获取当前目录的绝对路径
    const currentDirectory = __dirname;
    // 获取当前目录的上一级目录
    const parentDirectory = path.resolve(currentDirectory, '..');
    const jsonFilePath = path.join(parentDirectory, `${localPath}/${local}.json`);

    try {
        // 使用 readFile 读取文件内容
        const data = await readFile(jsonFilePath, { encoding: 'utf8' });
        // 将读取的内容解析为 JSON
        const json = JSON.parse(data);
        return json;
      } catch (err) {
        // 错误处理
        console.error('Error reading file:', err);
        throw err; // 抛出错误，允许调用者处理
      }
}
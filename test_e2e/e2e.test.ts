import * as fs from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import * as prettier from 'prettier';
import { build } from '../src/build';

const readdir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// This excludes directories.
const readdirRec = async (root: string, intermediate = ''): Promise<string[]> => {
  let allFiles: string[] = [];
  const dirPath = path.join(root, intermediate);
  const files = await readdir(dirPath);
  for (let fileName of files) {
    const relPath = path.join(intermediate, fileName);
    const stat = await fileStat(path.join(root, relPath));
    if (stat.isDirectory()) {
      const children = await readdirRec(root, relPath);
      allFiles = [...allFiles, ...children];
    } else {
      allFiles.push(relPath);
    }
  }
  return allFiles;
};

describe('E2E', () => {
  const e2eDir = path.join(__dirname, 'samples');
  const testDirs = fs.readdirSync(e2eDir);

  for (let testDirName of testDirs) {
    it(testDirName, async () => {
      const testDirPath = path.join(e2eDir, testDirName);
      await build({ cwd: testDirPath });

      const distPath = path.join(testDirPath, 'dist');
      const distFiles = await readdirRec(distPath);
      for (let filePath of distFiles) {
        const content = await readFile(path.join(distPath, filePath));
        const ext = path.extname(filePath);
        switch (ext) {
          case '.html': {
            const html = prettier.format(String(content), { parser: 'html' });
            expect(html).toMatchSnapshot(filePath);
            break;
          }

          case '.json': {
            const json = JSON.parse(String(content));
            expect(json).toMatchSnapshot(filePath);
            break;
          }

          default:
            throw new Error(`unexpected file extension: ${ext}`);
        }
      }
    });
  }
});

import * as fs from 'fs';
import { promisify } from 'util';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as prettier from 'prettier';

const readDir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const removeFile = promisify(fs.unlink);
const removeDir = promisify(fs.rmdir);

// This excludes directories.
const readdirRec = async (root: string, intermediate = ''): Promise<string[]> => {
  let allFiles: string[] = [];
  const dirPath = path.join(root, intermediate);
  const files = await readDir(dirPath);
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

const rmdirRec = async (dirPath: string) => {
  const fileNames = await readDir(dirPath);
  for (let name of fileNames) {
    const filePath = path.join(dirPath, name);
    const stat = await fileStat(filePath);
    if (stat.isDirectory()) {
      await rmdirRec(filePath);
    } else {
      await removeFile(filePath);
    }
  }
  await removeDir(dirPath);
};

const spawn = (cmd: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const p = childProcess.spawn(cmd, args);
    p.stdout.on('data', (data) => {
      console.log(String(data));
    });
    p.stderr.on('data', (data) => {
      console.error(String(data));
    });
    p.on('close', (code) => {
      code === 0 ? resolve() : reject();
    });
  });
};

describe('E2E', () => {
  const e2eDir = path.join(__dirname, 'samples');
  const runnerPath = path.join(__dirname, 'run.js');
  const testDirs = fs.readdirSync(e2eDir);

  for (let testDirName of testDirs) {
    it(testDirName, async () => {
      const testDirPath = path.join(e2eDir, testDirName);
      const distPath = path.join(testDirPath, 'dist');

      if (fs.existsSync(distPath)) {
        await rmdirRec(path.join(testDirPath, 'dist'));
      }
      await spawn('node', [runnerPath, testDirPath]);

      const distFiles = await readdirRec(distPath);
      for (let filePath of distFiles) {
        const snapshot = await makeSnapshot(distPath, filePath);
        expect(snapshot).toMatchSnapshot(filePath);
      }
    });
  }
});

const makeSnapshot = async (dir: string, filePath: string): Promise<any> => {
  if (filePath.endsWith('.client.js')) {
    return filePath;
  }

  const content = await readFile(path.join(dir, filePath));
  const ext = path.extname(filePath);
  switch (ext) {
    case '.json': {
      return JSON.parse(String(content));
    }

    case '.html': {
      return prettier.format(String(content), { parser: 'html' });
    }

    case '.js': {
      return prettier.format(String(content), { parser: 'babel' });
    }

    case '.css': {
      return prettier.format(String(content), { parser: 'css' });
    }

    default:
      throw new Error(`unexpected file extension: ${ext}`);
  }
};

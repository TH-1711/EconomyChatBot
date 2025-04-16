import * as path from 'path';

export const getDataPath = (...paths: string[]) => {
  return path.join(process.cwd(), '../data', ...paths);
};

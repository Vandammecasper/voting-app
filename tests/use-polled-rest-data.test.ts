import fs from 'fs';
import path from 'path';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('usePolledRestData', () => {
  it('uses a focus-scoped SDK subscription instead of REST polling', () => {
    const source = read('hooks/usePolledRestData.ts');
    expect(source).toContain('useFocusEffect');
    expect(source).toContain('subscribeToData');
    expect(source).not.toContain('restGet');
    expect(source).not.toContain('setInterval');
    expect(source).not.toContain('from \'@/services/firebaseRest\'');
  });
});

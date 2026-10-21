import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.join(__dirname, '..');

function read(relPath: string) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('TextInput touch targets (TASK-2)', () => {
  it('exports a floored touchTarget helper', () => {
    const scaleUtil = read('utils/scale.ts');
    expect(scaleUtil).toContain('export function touchTarget');
    expect(scaleUtil).toContain('MIN_TOUCH_TARGET = 44');
    expect(scaleUtil).toContain('Math.max(min, scale(size');
  });

  it('uses touchTarget on primary TextInput entry points', () => {
    const files = [
      'app/(tabs)/settings/feature-requests.tsx',
      'app/(tabs)/settings/team-edit.tsx',
      'app/userInput.tsx',
      'app/voting.tsx',
      'app/waitingRoom.tsx',
      'components/vote-draft-panel.tsx',
    ];
    for (const file of files) {
      expect(read(file)).toContain('touchTarget(');
    }
  });
});

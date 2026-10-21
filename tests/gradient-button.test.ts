import * as fs from 'fs';
import * as path from 'path';

const repoRoot = path.join(__dirname, '..');

function read(relPath: string) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('PrimaryButton label (TASK-1)', () => {
  const button = read('components/gradient-button.tsx');
  const featureRequests = read('app/(tabs)/settings/feature-requests.tsx');

  it('keeps layout styles off the gradient so flex:1 cannot clip the label', () => {
    expect(button).toContain('accessibilityLabel={children}');
    expect(button).toContain('adjustsFontSizeToFit');
    expect(button).toContain('numberOfLines={1}');
    expect(button).toMatch(/style=\{\[styles\.button, styles\.fill\]\}/);
    expect(button).not.toMatch(/style=\{\[styles\.button, style\]\}/);
  });

  it('shows Save / Saving… in the feature-requests modal with a dedicated text style', () => {
    expect(featureRequests).toContain("isSaving ? 'Saving…' : 'Save'");
    expect(featureRequests).toContain('textStyle={styles.modalSaveButtonText}');
    expect(featureRequests).toContain('modalSaveButtonText');
  });
});

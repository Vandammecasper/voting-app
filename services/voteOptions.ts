/** Names a voter may pick as MVP — never their own. */
export function mvpVoteOptions(names: string[], voterName?: string | null): string[] {
  const self = voterName?.trim();
  if (!self) {
    return names;
  }
  return names.filter((name) => name !== self);
}

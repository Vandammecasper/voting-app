/** @jest-environment node */

const fs = require('fs');
const path = require('path');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');

const matrix = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../security/authorization-matrix.json'), 'utf8')
);
const rules = fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8');

function contextFor(testEnv, principal) {
  if (principal === 'anon') {
    return testEnv.unauthenticatedContext();
  }
  const uid = matrix.uids[principal];
  if (!uid) {
    throw new Error(`Unknown principal ${principal}`);
  }
  return testEnv.authenticatedContext(uid);
}

function refFor(ctx, dbPath) {
  return ctx.database().ref(dbPath);
}

async function runCase(testEnv, testCase) {
  const ctx = contextFor(testEnv, testCase.principal);
  const ref = refFor(ctx, testCase.path);
  if (testCase.action === 'get') {
    return ref.get();
  }
  if (testCase.action === 'set') {
    return ref.set(testCase.data ?? null);
  }
  if (testCase.action === 'update') {
    return ref.update(testCase.data);
  }
  if (testCase.action === 'delete') {
    return ref.remove();
  }
  throw new Error(`Unknown action ${testCase.action}`);
}

describe('authorization matrix', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-vote-rules',
      database: {
        host: '127.0.0.1',
        port: 9000,
        rules,
      },
    });
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  for (const testCase of matrix.cases) {
    it(`${testCase.id} (${testCase.allow ? 'allow' : 'deny'})`, async () => {
      const fixture = matrix.fixtures[testCase.fixture];
      if (!fixture) {
        throw new Error(`Unknown fixture ${testCase.fixture}`);
      }
      await testEnv.clearDatabase();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.database().ref().set(fixture);
      });

      const op = runCase(testEnv, testCase);
      if (testCase.allow) {
        await assertSucceeds(op);
      } else {
        await assertFails(op);
      }
    });
  }
});

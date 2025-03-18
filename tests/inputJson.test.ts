import {
  describe,
  test,
  expect,
  beforeEach,
  afterAll,
  beforeAll,
} from 'vitest';
import { remult, repo } from 'remult';
import { TestApiDataProvider } from 'remult/server';
import { SqlDatabase } from 'remult';
import { PostgresDataProvider } from 'remult/postgres';
import { Pool } from 'pg';
import pg from 'pg';
import { PostgresMock } from 'pgmock';
import { Spacing } from '../shared/Task';

describe('Test authorization', () => {
  let mock;
  let client;

  beforeAll(async () => {
    console.log('Creating PostgresMock instance...');
    // Create PostgresMock instance with explicit configuration
    mock = await PostgresMock.create();

    // Create a proper pg Pool
    console.log('PostgresMock config:', mock.getNodePostgresConfig());
    const config = mock.getNodePostgresConfig();
    client = new pg.Client(config);
    await client.connect();
    // Test connection
    await client.query('SELECT 1');
    console.log('Connection successful');

    console.log('Testing connection...');

    // Initialize database connection
    try {
      // Setup remult data provider
      remult.dataProvider = TestApiDataProvider({
        dataProvider: new SqlDatabase(new PostgresDataProvider(client)),
      });
    } catch (err) {
      console.error('Database connection error:', err);
      throw err;
    }
  }, 30000);

  //beforeEach(async () => {
  //  // Clear existing data before inserting
  //  try {
  //    await repo(Spacing).insert({ title: 'my task' });
  //  } catch (err) {
  //    console.error('Error in test setup:', err);
  //    throw err;
  //  }
  //}, 30000);

  afterAll(async () => {
    if (client) await client.end();
    if (mock) await mock.destroy();
  });

  test('user can create task', async () => {
    remult.user = undefined; // Simulate unauthenticated user
    await repo(Spacing).insert({
      title: 'Task 1',
      spacings: [1, 2, 3],
      change_on: [4, 5, 6],
    });
    //expect(await repo(Spacing).count()).toBe(1); // Now 2 tasks because we already have 'my task'
    expect((await repo(Spacing).findFirst()).spacings).toMatchInlineSnapshot(`
    [
      1,
      2,
      3,
    ]
  `);
  });

  test('validation should fail create task', async () => {
    remult.user = undefined; // Simulate unauthenticated user
    expect(
      await repo(Spacing).insert({
        title: 'Task 1',
        spacings: '1,2,3',
        change_on: '4,6',
      })
    ).rejects.toThrowError('Change on and spacings must be the same length');
    //expect(await repo(Spacing).count()).toBe(1); // Now 2 tasks because we already have 'my task'
  });

  //test('user can read task', async () => {
  //  remult.user = undefined; // Simulate unauthenticated user
  //  const task = await repo(Task).findFirst();
  //  expect(task).toMatchObject({ title: 'my task' });
  // });
});

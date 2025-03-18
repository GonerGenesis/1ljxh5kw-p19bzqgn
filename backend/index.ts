import express from 'express';
import { remultExpress } from 'remult/remult-express';

import { createPostgresDataProvider } from 'remult/postgres';
import { SqlDatabase } from 'remult';
import pg from 'pg';
import { PostgresMock } from 'pgmock';

import { Spacing } from '../shared/Spacing';
import { repo } from 'remult';

let connectionstring;

(async () => {
  console.log('Starting Postgres mock server...');

  const mock = await PostgresMock.create();
  connectionString = await mock.listen(0);
  console.log(`Postgres mock is now listening on ${connectionString}`);
  console.log(`To access: psql ${connectionString}`);
})().catch(console.error);

SqlDatabase.LogToConsole = true;

export const app = express();
export const api = remultExpress({
  entities: [Spacing],
  admin: true,
  ensureSchema: true,
  dataProvider: createPostgresDataProvider({
    connectionString,
  }),
  initApi: async () => {
    console.log('moep');
    if ((await repo(Spacing).count()) == 0) {
      await repo(Spacing).insert({
        title: 'Task 1',
        spacings: [1, 2, 3],
        change_on: [4, 5, 6],
      });
    }
  },
});

app.use(api);

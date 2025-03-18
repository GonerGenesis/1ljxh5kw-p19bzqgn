import express from 'express';
import { remultExpress } from 'remult/remult-express';

import { createPostgresDataProvider } from 'remult/postgres';
import { SqlDatabase } from 'remult';
import { PostgresMock } from 'pgmock';

import { Spacing } from '../shared/Spacing';
import { repo } from 'remult';


const mock = await PostgresMock.create();
const connectionString = await mock.listen(0);
console.log(`Postgres mock is now listening on ${connectionString}`);
console.log(`To access: psql ${connectionString}`);


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

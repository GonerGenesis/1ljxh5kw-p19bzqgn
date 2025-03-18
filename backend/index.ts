import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { PostgresDataProvider } from 'remult/postgres';
import { SqlDatabase } from 'remult';
import { PostgresMock } from 'pgmock';
import { Spacing } from '../shared/Spacing';
import { repo } from 'remult';
import pg from 'pg';
import cors from 'cors';

// Create Express app first (synchronously)
export const app = express();

// We'll update this later when initialized
export let api: any;

// Helper function to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Initialize everything in a single async function
async function initializeApp() {
  console.log('Setting up PostgreSQL mock...');

  let dataProvider;
  let mock;
  let client;

  try {
    // Try to use PostgresMock with getNodePostgresConfig for browser compatibility
    mock = await PostgresMock.create();

    // Add a delay to ensure the mock DB is fully initialized
    console.log('Waiting for PostgreSQL mock to initialize...');
    // await sleep(5000); // 2 second delay

    const config = mock.getNodePostgresConfig();
    console.log('PostgreSQL mock created with config');

    // Verify the database is ready by accessing it directly first
    try {
      // Alternative approach using PostgresDataProvider directly
      // Use a temporary client just for verification
      const verificationClient = new pg.Client(config);
      await verificationClient.connect();
      await verificationClient.query('SELECT 1');
      await verificationClient.end();
      console.log('PostgreSQL mock connection verified');

      // Create a new client for ongoing use
      const dbClient = new pg.Client(config);
      await dbClient.connect();

      // Pass this new connected client to the provider
      dataProvider = new SqlDatabase(new PostgresDataProvider(dbClient));
    } catch (dbError) {
      console.error('Failed to verify PostgreSQL mock connection:', dbError);
      throw dbError;
    }
  } catch (e) {
    console.error('Error setting up PostgreSQL mock:', e);
    // Fallback for browser environments
    console.log('Falling back to inmemory provider');
  }

  // Enable SQL logging
  SqlDatabase.LogToConsole = true;

  // Now create the API with the dataProvider that's definitely initialized
  api = remultExpress({
    entities: [Spacing],
    admin: true,
    ensureSchema: true,
    dataProvider,
    initApi: async () => {
      if ((await repo(Spacing).count()) === 0) {
        await repo(Spacing).insert({
          title: 'Task 1',
          spacings: [1, 2, 3],
          change_on: [4, 5, 6],
        });
      }
    },
  });

  app.use(cors());
  // Use the API with the app that was created synchronously
  app.use(api);

  return { api, mock };
}

// Call initializeApp ONCE and store the promise
const initializationPromise = initializeApp();

// Use the same promise for server setup
initializationPromise
  .then(({ mock }) => {
    // Set up cleanup for the mock when the application exits
    if (typeof process !== 'undefined' && mock) {
      process.on('exit', () => {
        mock.destroy();
      });
    }
  })
  .catch((error) => {
    console.error('Failed to initialize server:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  });

// Use the SAME promise for the ready function
let initialized = false;
initializationPromise.then(() => {
  initialized = true;
});

export async function ready() {
  if (!initialized) {
    await initializationPromise;
  }
  return { app, api };
}

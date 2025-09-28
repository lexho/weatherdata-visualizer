import { SerialToDatabase } from './SerialToDatabase.js';
import config from 'config';
import express from 'express';
import { dbFilenameRaw, dbCounter } from './SerialToDatabase.js';
import { mergeDatabasesWithRxJS } from './mergeTwoDatabases.js'

//const version1 = config.get('app.version')
//const version = `${version1}, September 2025`
const port = config.get('app.port')
const MAX_ROWS_TO_MERGE =  config.get('app.database.maxrowsmerge');

function main() {
  console.log('----------------- Starting Application -----------------');

  const serialToDatabase = new SerialToDatabase();

  console.log('--------------------------------------------------------\n')

  // Start the Serial Reader
  serialToDatabase.start();

  // prepare webserver
  const app = express();
  app.use(express.static('public'));
  app.get('/', (req,res) => {
    res.end("hello!")
  })

  app.get('/api', (req, res) => {
    const datasets = serialToDatabase.getData();

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Allow requests from any origin
    });
    res.end(JSON.stringify(datasets));
  })

  app.get('/downloaddb', async (req, res) => {
    try {
        const outputFilename = dbFilenameRaw;
        // In SerialToDatabase, dbCounter is the *current* file being written to.
        // The previous file is dbCounter - 1.
        const dbFilenameOld = `./data/weather${dbCounter - 1}.db`;
        const dbFilenameNew = `./data/weather${dbCounter}.db`;
        await mergeDatabasesWithRxJS(dbFilenameOld, dbFilenameNew, outputFilename, MAX_ROWS_TO_MERGE);

        res.download(outputFilename, 'weather.db'); // Provide a user-friendly name for the download
    } catch (error) {
        console.error('Failed to merge and provide database for download:', error);
        res.status(500).send('Error creating database file for download.');
    }
});

  app.listen(8080, () => {
    console.log(`weatherstation web app listening on port ${port}`);
  });
}

main();

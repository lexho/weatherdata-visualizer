import { SerialToDatabase } from './SerialToDatabase.js';
import config from 'config';
import express from 'express';
import { createDatabaseForDownload } from './model.js'

//const version1 = config.get('app.version')
//const version = `${version1}, September 2025`
const port = config.get('app.port')

function main() {
  console.log('----------------- Starting Application -----------------');

  const serialToDatabase = new SerialToDatabase();

  console.log('--------------------------------------------------------\n')

  // Start the Serial Reader
  serialToDatabase.start();

  // prepare webserver
  const app = express();
  app.use(express.static('public'));
  app.get('/', (req, res) => {
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

  const outputFilename = config.get('app.database.filename')

  app.get('/downloaddb', async (req, res) => {
    await createDatabaseForDownload()
    res.download(outputFilename, 'weather.db');
  
  });

  app.listen(8080, () => {
    console.log(`weatherstation web app listening on port ${port}`);
  });
}

main();

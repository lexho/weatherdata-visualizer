// /path/to/your/project/DataEmitter.js
import { EventEmitter } from 'events';
import { fromEvent } from 'rxjs';
import { map, takeUntil, tap, filter, bufferCount, bufferTime } from 'rxjs/operators';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'
import { FakeSerialPort } from './FakeSerialPort.js';
import sqlite from 'sqlite3';
import fs from 'node:fs';
import { rmSync, linkSync } from 'node:fs';
import { exec } from 'node:child_process';
import config from 'config';

const dataDir = "./data/"
function getDBCounter() {
  // Ensure data directory exists
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }
  const files = fs.readdirSync(dataDir);
  const dbNumbers = files
    .map(file => {
      const match = file.match(/^weather(\d+)\.db$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);

  return dbNumbers.length > 0 ? Math.max(...dbNumbers) : 1;
}

const version = config.get('app.version')
const serialport = config.get('app.serialport')
const maxBufferSize = config.get('app.maxBufferSize')
const buffertime = config.get('app.bufferTime')
const useFakeSerial = config.get('app.useFakeSerial')
const baudRate = config.get('app.baudRate')

let db;
export let dbCounter = getDBCounter()
export let dbFilenameRaw = config.get('app.database.filename')
let dbFilename
const dbLimit = config.get('app.database.filesizelimit') // 100 MB 100 000 000 B

function linkDatabase() {
  const filename = dbFilenameRaw
  const filename_express = `./public/download/weather.db`
  rmSync(filename, { force: true });
  linkSync(dbFilename, filename)
  rmSync(filename_express, { force: true });
  linkSync(dbFilename, filename_express)
}

function incrementDBFilename(name) {
  console.log("increment db filename")
  const filename = dbFilenameRaw
  linkDatabase();
  dbCounter++;
  dbFilename = `./data/weather${dbCounter}.db`
  console.log(`create db file: ${dbFilename}`)
  initializeDatabase();
}

function initializeDatabase() {
  console.log(`db filename: '${dbFilename}'`)
  console.log(`db limit: ${dbLimit} Bytes`)

  // Ensure data directory exists
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }

  db = new sqlite.Database(dbFilename, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
      process.exit(1);
    }
    console.log(`Connected to database: ${dbFilename}`);
  });

  db.serialize(() => {
    // Create table if it doesn't exist
    db.run('CREATE TABLE IF NOT EXISTS Weather (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, date TEXT, time TEXT, temp REAL, pressure REAL, tendency TEXT, windspeed REAL, winddir TEXT)');
  });
}

/**
 * A class that writes buffered data to a database
 */
export class SerialToDatabase {
  #counter = 0;
  #port;
  #dataSubscription;

  constructor() {
    console.log("version: " +  version)
    if (useFakeSerial) console.log('serial: using FakeSerialPort for testing.');
    // Initialize DB on startup
    let dbFilenameRaw_splitted = dbFilenameRaw.split('.')
    dbFilename = dbFilenameRaw_splitted[0] + dbCounter + "." + dbFilenameRaw_splitted[1]
    initializeDatabase();
    linkDatabase();
    console.log(`bufferTime: ${buffertime} ms`)
    console.log(`maxBufferSize: ${maxBufferSize}`)
    console.log('SerialToDatabase initialized.');
  }

  time1111 = new Date().getTime()
  item = {
    id: 0,
    timestamp: 0,
    date: 0,
    time: 0,
    weather: {
      temp: { value: 0 },
      pressure: { value: 0 },
      tendency: { value: "" },
      windspeed: { value: 0 },
      winddir: { value: "" }
    }
  };
  datasets = [this.item, this.item, this.item, this.item, this.item]; // datasets for web app gui
  getData() {
    return this.datasets;
  }

  /**
   * Starts watching the file for changes and emitting data events.
   */
  start() {
    try {
      if (!useFakeSerial) {
        this.#port = new SerialPort({
          path: serialport,
          baudRate: baudRate,
        });
      } else {
        this.#port = new FakeSerialPort();
      }
    } catch (err) {
      console.error('Failed to open serial port:', err.message);
      console.log('Retrying in 10 seconds...');
      setTimeout(() => this.reset(), 10000);
      return;
    }

    const parser = this.#port.pipe(new ReadlineParser({ delimiter: '\n' }));

    this.#port.on("open", () => {
      console.log("serial port open")
    });

    this.#port.on('error', (err) => {
      console.error('SerialPort reported an error:', err.message);
      this.reset();
    });
    const data$ = fromEvent(parser, 'data');
    //const close$ = fromEvent(this, 'close');

    this.#dataSubscription = data$.pipe(
      //takeUntil(close$),
      tap(line => console.log('got word from arduino: ', line)),
      filter(line => line.length > 25),
      //tap(line => console.log('filtered line: ', line)),
      tap(line => {
        let date1111 = new Date().getTime()
        let diff = date1111 - this.time1111
        this.time1111 = date1111
        //console.log("diff: " + diff)
        if (diff > 120000) {
          console.error("120 seconds since data received. is serial connection down?");
          this.reset()
        }
        return line;
      }),
      map(line => line.trimEnd()), // remove trailing characters at the end of the line
      map(line => line.split(' ')),
      map(d => {
        let date = new Date();
        let date1 = date.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
        const options = {
          hour12: false,
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        };
        let time = date.toLocaleTimeString("de-DE", options);
        const id = this.#counter++;
        const timestamp = date.getTime();
        const temp = d[0].match(/[0-9.]+/)?.[0];
        const pressure = d[1].match(/[0-9.]+/)?.[0];
        const tendency = d[2];
        const windspeed = d[3].match(/[0-9.]+/)?.[0];
        const winddir = d[4];

        return {
          id: id,
          timestamp: timestamp,
          date: date1,
          time: time,
          weather: {
            temp: { value: temp },
            pressure: { value: pressure },
            tendency: { value: tendency },
            windspeed: { value: windspeed },
            winddir: { value: winddir }
          }
        };
      }),
      tap(dataset => { this.datasets.push(dataset); this.datasets.shift() }),
      // bufferTime will emit a buffer of items every `buffertime` milliseconds,
      // OR when the buffer reaches `buffercount` items, whichever happens first.
      bufferTime(buffertime, null, maxBufferSize)
    ).subscribe(
      {
        next: (dataBatch) => {
          if (dataBatch.length === 0) return; // Don't process empty batches

          console.log(`--- Collected a batch of ${dataBatch.length} data points ---`);
          // write data to database
          console.log("write data to database (" + dataBatch.length + " datasets)")
          fs.stat(dbFilename, (err, stats) => {
            if (err) {
              console.error(err);
            }
            const file_size = stats.size
            console.log(`db: ${dbFilename} filesize: ${file_size} B`)
            if (file_size > dbLimit) {
              console.log("file is too big")
              incrementDBFilename()
              exec(`sqlite3 ${dbFilename} < createTable.sql`);
            }
            // we have access to the file stats in `stats`
          });
          for (let dataset of dataBatch) {
            writeToDatabase(dataset);
          }
          //this.collectedData.push(...dataBatch);
        },
        error: (err) => {
          console.error('An error occurred in the RxJS stream:', err);
          // An error here often indicates a problem with the underlying port. Reset it.
          this.reset();
        },
        complete: () => console.log('Data collection complete.'),
      });
  }

  /**
   * Stops emitting data events.
   * Stops watching the file and emitting data events. */
  stop() {
    console.log('Stopping SerialToDatabase');

    if (this.#dataSubscription) {
      this.#dataSubscription.unsubscribe();
    }
    if (this.#port && this.#port.isOpen) {
      this.#port.close();
      console.log('Serial port closed.');
    }
  }

  reset() {
    console.log('Resetting SerialPort connection...');
    this.stop();
    console.log('Attempting to restart in 5 seconds...');
    setTimeout(() => this.start(), 5000);
  }
}

function writeToDatabase(dataset) {
  //console.log("write to database: id: " + dataset.id)

  //db = new sqlite.Database(DB_filename);

  db.serialize(() => {
    //console.log(dataset)
    const query = 'INSERT INTO Weather (timestamp, date, time, temp, pressure, tendency, windspeed, winddir) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const timestamp = dataset.timestamp
    const date = dataset.date
    const time = dataset.time
    const temp = dataset.weather.temp.value
    const pressure = dataset.weather.pressure.value
    const tendency = dataset.weather.tendency.value
    const windspeed = dataset.weather.windspeed.value
    const winddir = dataset.weather.winddir.value
    db.run(query, [timestamp, date, time, temp, pressure, tendency, windspeed, winddir], (error, results) => {
      if (error) {
        console.error('DB insert error:', error.message);
      }
    });
  });
}
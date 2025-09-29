import sqlite from 'sqlite3';
import fs from 'node:fs';
import config from 'config';
import { rmSync, linkSync } from 'node:fs';
import { exec } from 'node:child_process';
import { createDatabaseForDownload as createDatabaseForDownload1, createDatabaseForDownloadSingle as createDatabaseForDownloadSingle1 } from './mergeTwoDatabases.js';

let db
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

let dbCounter = getDBCounter()
let dbFilenameRaw = config.get('app.database.filename')
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

export function init() {
    let dbFilenameRaw_splitted = dbFilenameRaw.split('.')
    dbFilename = dbFilenameRaw_splitted[0] + dbCounter + "." + dbFilenameRaw_splitted[1]
    initializeDatabase();
    linkDatabase();
}

const MAX_ROWS_TO_MERGE = config.get('app.database.maxrowsmerge');
const outputFilename = dbFilenameRaw; // 'data/weather.db'

export async function createDatabaseForDownload() {
    const dbFilenameOld = `./data/weather${dbCounter - 1}.db`;
    const dbFilenameNew = `./data/weather${dbCounter}.db`;
    if (dbCounter == 1) {
        await createDatabaseForDownloadSingle1(dbFilenameNew, outputFilename, MAX_ROWS_TO_MERGE)
    }
    if (dbCounter > 1) {
        await createDatabaseForDownload1(dbFilenameOld, dbFilenameNew, outputFilename, MAX_ROWS_TO_MERGE)
    }
}

export async function getAll() {
}

export async function save(dataset) {
    return new Promise((resolve, reject) => {
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
                } else {
                    resolve(results);
                }
            });
        });
    })
}
export async function saveBatch(dataBatch) {
    return new Promise((resolve, reject) => {
        fs.stat(dbFilename, (err, stats) => {
            if (err) {
                console.error(err);
            }
            const file_size = stats.size
            console.log(`write data to database (${dataBatch.length} datasets), db: ${dbFilename}, filesize: ${file_size} B`);
            if (file_size > dbLimit) {
                console.log("file is too big")
                incrementDBFilename()
                exec(`sqlite3 ${dbFilename} < createTable.sql`);
            }
            // we have access to the file stats in `stats`
        });
        db.serialize(() => {
            for (const dataset of dataBatch) {
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
                    } else {
                        resolve(results);
                    }
                });
            }
        })
    })
}
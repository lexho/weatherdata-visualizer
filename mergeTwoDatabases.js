import sqlite from 'sqlite3';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { unlinkSync } from 'node:fs';

// Helper to open a database with promises
function openDb(filename, mode = sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE) {
    return new Promise((resolve, reject) => {
        const db = new sqlite.Database(filename, mode, (err) => {
            if (err) {
                reject(new Error(`Failed to open DB ${filename}: ${err.message}`));
            } else {
                //console.log(`Opened DB: ${filename}`);
                resolve(db);
            }
        });
    });
}

export async function createDatabaseForDownload(dbPath1, dbPath2, dbPathOutput, limit) {
    console.log("create a database for download");
    console.log(`merge ${dbPath1} with ${dbPath2}, limit: ${limit}`);

    for (const path of [dbPath1, dbPath2]) {
        if (!fs.existsSync(path)) {
            console.error(`${path} does not exist!`);
            return;
        }
    }
    if (fs.existsSync(dbPathOutput)) {
        fs.unlinkSync(dbPathOutput); // Start with a fresh output file
    }
    if (!Number.isInteger(limit) || limit < 0) {
        console.error(`invalid limit: ${limit}`);
        return;
    }

    let dbOutput;
    try {
        dbOutput = await openDb(dbPathOutput);
        const run = promisify(dbOutput.run.bind(dbOutput));

        await run('CREATE TABLE Weather (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, date TEXT, time TEXT, temp REAL, pressure REAL, tendency TEXT, windspeed REAL, winddir TEXT)');

        // Attach other databases to the output database connection
        await run(`ATTACH DATABASE '${dbPath1}' AS db1`);
        await run(`ATTACH DATABASE '${dbPath2}' AS db2`);

        // Insert from both tables into the new one, sorted by timestamp, and limited.
        const insertSql = `
            INSERT INTO Weather (timestamp, date, time, temp, pressure, tendency, windspeed, winddir)
            SELECT timestamp, date, time, temp, pressure, tendency, windspeed, winddir FROM (
                SELECT * FROM db1.Weather
                UNION ALL
                SELECT * FROM db2.Weather
            )
            ORDER BY timestamp DESC
            LIMIT ${limit}
        `;
        await run(insertSql);

        console.log(`Successfully created merged database at ${dbPathOutput}`);

    } catch (error) {
        console.error("Error during database merge:", error);
    } finally {
        if (dbOutput) {
            dbOutput.close((err) => {
                if (err) console.error(`Error closing ${dbPathOutput}:`, err.message);
                else console.log(`Database ${dbPathOutput} closed.`);
            });
        }
    }
}

export async function createDatabaseForDownloadSingle(dbPathSource, dbPathOutput, limit) {
    console.log("create a database for download");
    //console.log(`source: ${dbPathSource}, limit: ${limit}`);

    if (!fs.existsSync(dbPathSource)) {
        console.error(`${dbPathSource} does not exist!`);
        return;
    }
    if (fs.existsSync(dbPathOutput)) {
        fs.unlinkSync(dbPathOutput); // Start with a fresh output file
    }
    if (!Number.isInteger(limit) || limit < 0) {
        console.error(`invalid limit: ${limit}`);
        return;
    }

    let dbOutput;
    try {
        dbOutput = await openDb(dbPathOutput);
        const run = promisify(dbOutput.run.bind(dbOutput));

        await run(`ATTACH DATABASE '${dbPathSource}' AS source_db`);
        const createTableSql = `
            CREATE TABLE Weather AS
            SELECT * FROM source_db.Weather
            ORDER BY timestamp DESC
            LIMIT ${limit}
        `;
        await run(createTableSql);

        //console.log(`Successfully created single database copy at ${dbPathOutput}`);
    } catch (error) {
        console.error("Error during single database creation:", error);
    } finally {
        if (dbOutput) {
            dbOutput.close((err) => {
                if (err) console.error(`Error closing ${dbPathOutput}:`, err.message);
                //else console.log(`Database ${dbPathOutput} closed.`);
            });
        }
    }
}
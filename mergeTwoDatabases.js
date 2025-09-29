import sqlite from 'sqlite3';
import fs from 'node:fs';

export function createDatabaseForDownload(dbPath1, dbPath2, dbPathOutput, limit) {
    console.log("createDatabaseForDownload")
    console.log(`merge ${dbPath1} with ${dbPath2}, limit: ${limit}`)
    if (!fs.existsSync(dbPath1)) { console.error(`${dbPath1} does not exist!`) }
    if (!fs.existsSync(dbPath2)) { console.error(`${dbPath2} does not exist!`) }
    if (!fs.existsSync(dbPathOutput)) { console.error(`${dbPathOutput} does not exist!`) }
    if (!Number.isInteger(limit) || limit < 0) { console.error(`invalid limit: ${limit}`) }

    const db = new sqlite.Database(dbPath2, sqlite.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(new Error(`Failed to open source DB ${dbPath2}: ${err.message}`));
        }
        console.log(`Opened source DB: ${dbPath2}`);
    });


    const dbOutput = new sqlite.Database(dbPathOutput, (err) => {
        if (err) {
            console.error(new Error(`Failed to open source DB ${dbPathOutput}: ${err.message}`));
        }
        console.log(`Opened source DB: ${dbPathOutput}`);
    });

    const createTableSql = 'CREATE TABLE IF NOT EXISTS Weather (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, date TEXT, time TEXT, temp REAL, pressure REAL, tendency TEXT, windspeed REAL, winddir TEXT)';
    const sql1a = `attach '${dbPath1}' as db1`
    const sql1b = "attach 'data/weather.db' as merged"
    const sql2 = "insert into weather(timestamp, date, time, temp, pressure, tendency, windspeed, winddir) select timestamp, date, time, temp, pressure, tendency, windspeed, winddir from db1.weather"
    const sql3 = "drop table merged.weather"
    const sql4 = `create table merged.weather as select * from weather LIMIT ${limit}`

    db.serialize(() => { // we are in db2
        dbOutput.run(createTableSql); // empty table in output
        db.run(sql1a); // attach db1
        db.run(sql1b); // attach output
        db.run(sql2);// db1 --> db2 (fields without id)
        db.run(sql3); // drop table if exists
        db.run(sql4); // create table with limited
    })

    db.close()
}

export function createDatabaseForDownloadSingle(dbPath1, dbPathOutput, limit) {
    console.log("createDatabaseForDownload")
    console.log(`${dbPath1}}, limit: ${limit}`)
    if (!fs.existsSync(dbPath1)) { console.error(`${dbPath1} does not exist!`) }
    if (!fs.existsSync(dbPathOutput)) { console.error(`${dbPathOutput} does not exist!`) }
    if (!Number.isInteger(limit) || limit < 0) { console.error(`invalid limit: ${limit}`) }

    const db = new sqlite.Database(dbPath1, sqlite.OPEN_READWRITE, (err) => {
        if (err) {
            console.error(new Error(`Failed to open source DB ${dbPath1}: ${err.message}`));
        }
        console.log(`Opened source DB: ${dbPath1}`);
    });


    const dbOutput = new sqlite.Database(dbPathOutput, (err) => {
        if (err) {
            console.error(new Error(`Failed to open source DB ${dbPathOutput}: ${err.message}`));
        }
        console.log(`Opened source DB: ${dbPathOutput}`);
    });

    const createTableSql = 'CREATE TABLE IF NOT EXISTS Weather (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, date TEXT, time TEXT, temp REAL, pressure REAL, tendency TEXT, windspeed REAL, winddir TEXT)';
    const sql1b = "attach 'data/weather.db' as merged"
    const sql3 = "drop table merged.weather"
    const sql4 = `create table merged.weather as select * from weather LIMIT ${limit}`

    db.serialize(() => {
        dbOutput.run(createTableSql); // create table in output
        //db.run(sql1a);
        db.run(sql1b); // attach output
        //db.run(sql2);
        db.run(sql3); // drop table
        db.run(sql4); // create table with limited
    })
    
    db.close()
}
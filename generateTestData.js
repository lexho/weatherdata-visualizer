import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = './data';

const db1Path = path.join(dataDir, 'weather_test1.db');
const db2Path = path.join(dataDir, 'weather_test2.db');

function generateWeatherData(size) {
    let datasets = []
    let timestamp = 1672621200000
    for (let i = 0; i < size; i++) {
        let date = new Date(timestamp);
        let date1 = date.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
        const options = {
          hour12: false,
          hour: "numeric",
          minute: "numeric",
          second: "numeric"
        };
        let time = date.toLocaleTimeString("de-DE", options);
        let temp = Math.round((Math.random() * 60 - 80) * 10) / 10
        let pressure = Math.round((Math.random() * 400 + 1000) * 10) / 10
        let windspeed = Math.round((Math.random() * 200 + 100) * 10) / 10 //Math.round(Math.random(200)*10)/10
        let tendency = ["falling", "steady", "rising"][Math.round(Math.random() * 2)]
        let winddir1 = ["N", "NO", "NW", "S", "SO", "SW", "O", "W", "X", "Y"]
        let winddir = winddir1[Math.round(Math.random() * winddir1.length - 1)]
        timestamp += 1000

        const data = {
        timestamp: timestamp, // 2023-01-02 02:00:00
        date: date1,
        time: time,
        temp: temp,
        pressure: pressure,
        tendency: tendency,
        windspeed: windspeed,
        winddir: winddir
    }
        datasets.push(data)
    }
    return datasets;
}

function createDatabaseWithData(dbPath, data) {
    return new Promise((resolve, reject) => {
        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Remove old DB file if it exists
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
            console.log(`Connected to ${dbPath}`);
        });

        db.serialize(() => {
            db.run('CREATE TABLE Weather (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, date TEXT, time TEXT, temp REAL, pressure REAL, tendency TEXT, windspeed REAL, winddir TEXT)', (err) => {
                if (err) return reject(err);
                console.log(`Table 'Weather' created in ${dbPath}`);
            });

            const stmt = db.prepare('INSERT INTO Weather (timestamp, date, time, temp, pressure, tendency, windspeed, winddir) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

            for (const row of data) {
                stmt.run(Object.values(row));
            }

            stmt.finalize((err) => {
                if (err) return reject(err);
                console.log(`${data.length} rows inserted into ${dbPath}`);
                db.close((err) => {
                    if (err) return reject(err);
                    console.log(`Database ${dbPath} closed.`);
                    resolve();
                });
            });
        });
    });
}

async function generate() {
    console.log('Generating test databases...');
    const weatherData1 = generateWeatherData(100)
    const weatherData2 = generateWeatherData(100)
    await createDatabaseWithData(db1Path, weatherData1);
    await createDatabaseWithData(db2Path, weatherData2);
    console.log('Test data generation complete.');
}

generate().catch(console.error);
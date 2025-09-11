// /path/to/your/project/DataEmitter.js
import { EventEmitter } from 'events';
import { fromEvent } from 'rxjs';
import { map, takeUntil, tap, filter, bufferCount } from 'rxjs/operators';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline'
import { FakeSerialPort } from './FakeSerialPort.js';
import sqlite from 'sqlite3';

/**
 * A class that emits a 'data' event every 3 seconds.
 */
export class SerialToDatabase {
  #counter = 0;
  #port;
  #dataSubscription;

  constructor() {
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
  datasets = [this.item,this.item,this.item,this.item,this.item]; // datasets for web app gui
  getData() {
    return this.datasets;
  }

  /**
   * Starts watching the file for changes and emitting data events.
   */
  start() {
    /*this.#port = new SerialPort({
      path: 'COM7',
      baudRate: 9600,
    });*/

    console.log('Using FakeSerialPort for testing.');
    this.#port = new FakeSerialPort();

    const parser = this.#port.pipe(new ReadlineParser({ delimiter: '\n' }));

    this.#port.on("open", () => {
      console.log("serial port open")
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
          process.exit(1)
        }
        return line;
      }),
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
      tap(dataset => { this.datasets.push(dataset); this.datasets.shift()}),
      bufferCount(5)
    ).subscribe(
      {
        next: (dataBatch) => {
          console.log('--- Collected a batch of 5 data points (value > 50) ---');
          //console.log(JSON.stringify(dataBatch));
          // write data to database
          console.log("write data to database (" + dataBatch.length + " datasets)")
          for (let dataset of dataBatch) {
            writeToDatabase(dataset);
          }
          //this.collectedData.push(...dataBatch);
        },
        error: (err) => console.error('An error occurred:', err),
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
}

function writeToDatabase(dataset) {
  console.log("write to database: id: " + dataset.id)
    const db = new sqlite.Database('./weather_test.db');

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
          console.error(error);
        } else {
          //console.log(results);
        }
      });
    });
  }
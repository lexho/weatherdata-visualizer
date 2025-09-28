import sqlite from 'sqlite3';
import fs from 'node:fs';
import { Observable, of, merge, EMPTY } from 'rxjs';
import { concatMap, catchError, bufferCount, finalize, take } from 'rxjs/operators';

/**
 * Wraps a db.run call in an Observable.
 * @param {sqlite.Database} db - The database instance.
 * @param {string} sql - The SQL query to run.
 * @param {any[]} [params=[]] - The parameters for the query.
 * @returns {Observable<{lastID: number, changes: number}>}
 */
function runQuery(db, sql, params = []) {
  return new Observable(subscriber => {
    db.run(sql, params, function (err) {
      if (err) {
        subscriber.error(err);
      } else {
        // 'this' is bound to the statement context by sqlite3
        subscriber.next({ lastID: this.lastID, changes: this.changes });
        subscriber.complete();
      }
    });
  });
}

/**
 * Wraps a db.get call in an Observable.
 * @param {sqlite.Database} db - The database instance.
 * @param {string} sql - The SQL query to run.
 * @param {any[]} [params=[]] - The parameters for the query.
 * @returns {Observable<any>}
 */
function getQuery(db, sql, params = []) {
  return new Observable(subscriber => {
    db.get(sql, params, (err, row) => {
      if (err) {
        subscriber.error(err);
      } else {
        subscriber.next(row);
        subscriber.complete();
      }
    });
  });
}

/**
 * Creates an Observable stream of rows from a database file.
 * @param {string} dbPath - The path to the source SQLite database.
 * @returns {Observable<any>} An observable that emits each row from the Weather table.
 */
function streamRowsFromDb(dbPath) {
  return new Observable(subscriber => {
    const db = new sqlite.Database(dbPath, sqlite.OPEN_READONLY, (err) => {
      if (err) {
        return subscriber.error(new Error(`Failed to open source DB ${dbPath}: ${err.message}`));
      }
      console.log(`Opened source DB: ${dbPath}`);
    });

    const sql = 'SELECT timestamp, date, time, temp, pressure, tendency, windspeed, winddir FROM Weather ORDER BY timestamp DESC';

    db.each(sql, [],
      (err, row) => { // Row callback
        if (err) subscriber.error(err);
        else subscriber.next(row);
      },
      (err, count) => { // Completion callback
        if (err) subscriber.error(err);
        else {
          console.log(`Finished streaming ${count} rows from ${dbPath}.`);
          subscriber.complete();
        }
      }
    );

    // Return a teardown function to close the database connection.
    return () => {
      db.close(err => {
        if (err) console.error(`Error closing source DB ${dbPath}:`, err.message);
        else console.log(`Closed source DB: ${dbPath}`);
      });
    };
  });
}

/**
 * Creates an Observable stream of rows from a database file.
 * @param {string} dbPath - The path to the source SQLite database.
 * @param {string} sql - The query to be executed
 * @returns {Observable<any>} An observable that emits each row from the Weather table.
 */
function streamRowsFromDb2(dbPath, sql) {
  return new Observable(subscriber => {
    const db = new sqlite.Database(dbPath, sqlite.OPEN_READONLY, (err) => {
      if (err) {
        return subscriber.error(new Error(`Failed to open source DB ${dbPath}: ${err.message}`));
      }
      console.log(`Opened source DB: ${dbPath}`);
    });

    //const sql = 'SELECT timestamp, date, time, temp, pressure, tendency, windspeed, winddir FROM Weather ORDER BY timestamp DESC';

    db.each(sql, [],
      (err, row) => { // Row callback
        if (err) subscriber.error(err);
        else subscriber.next(row);
      },
      (err, count) => { // Completion callback
        if (err) subscriber.error(err);
        else {
          console.log(`Finished streaming ${count} rows from ${dbPath}.`);
          subscriber.complete();
        }
      }
    );

    // Return a teardown function to close the database connection.
    return () => {
      db.close(err => {
        if (err) console.error(`Error closing source DB ${dbPath}:`, err.message);
        else console.log(`Closed source DB: ${dbPath}`);
      });
    };
  });
}

/**
 * Merges two databases using an RxJS pipeline.
 * @param {string} sourceDb1Path
 * @param {string} sourceDb2Path
 * @param {string} outputDbPath
 * @returns {Promise<void>} A promise that resolves when the merge is complete.
 */
export function mergeDatabasesWithRxJS(sourceDb1Path, sourceDb2Path, outputDbPath, maxRows) {
  return new Promise((resolve, reject) => {
    console.log(`Merging '${sourceDb1Path}' and '${sourceDb2Path}' into '${outputDbPath}' with RxJS`);
    let totalRowsWritten = 0;

    // Clean up existing output file
    if (fs.existsSync(outputDbPath)) {
      fs.unlinkSync(outputDbPath);
      console.log(`Removed existing output file: ${outputDbPath}`);
    }

    const outputDb = new sqlite.Database(outputDbPath, (err) => {
      if (err) {
        console.error(`Failed to create output DB: ${err.message}`);
        return reject(new Error(`Failed to create output DB: ${err.message}`));
      }
      console.log(`Created and connected to output database: ${outputDbPath}`);
    });

    const createTableSql = 'CREATE TABLE IF NOT EXISTS Weather (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, date TEXT, time TEXT, temp REAL, pressure REAL, tendency TEXT, windspeed REAL, winddir TEXT)';
    const insertSql = 'INSERT INTO Weather (timestamp, date, time, temp, pressure, tendency, windspeed, winddir) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

    // 1. Create the table in the output database
    runQuery(outputDb, createTableSql).pipe(
      // 2. Once table is created, merge the streams from the two source databases
      concatMap(() => {
        // CASES
        if (!fs.existsSync(sourceDb1Path) && !fs.existsSync(sourceDb2Path)) {
          // error
          let err = "files do not exist"
          reject(err);
        }
        if (!fs.existsSync(sourceDb1Path)) {
          console.log('Table created in output DB. Only db1 source streams...');
          const stream1$ = streamRowsFromDb(sourceDb2Path);
          //return stream1$.pipe(take(maxRows));
        }
        if (!fs.existsSync(sourceDb2Path)) {
          console.log('Table created in output DB. Only db2 source streams...');
          const stream1$ = streamRowsFromDb(sourceDb2Path);
          //return stream1$.pipe(take(maxRows));
        }

        // two db files exist
        // start streaming...
        console.log("two db files exist, start streaming...")
        console.log('Table created in output DB. Merging source streams...');

        const dbQueryCount = "SELECT COUNT(*) as 'count' FROM weather"
        const db2 = new sqlite.Database(sourceDb2Path, (err) => {
          if (err) {
            console.error(`Failed to create output DB: ${err.message}`);
            return reject(new Error(`Failed open DB: ${err.message}`));
          }
          console.log(`Created and connected to database: ${outputDbPath}`);
        });

        db2.get(dbQueryCount, (err, result) => {
          const db2Count = result.count
          //console.log(`count: ${result.count}`)

          if (db2Count < maxRows) { // to little data from db2 --> fill the rest with the newest data from db1
            console.log("db2Count < maxRows")
            // select count values from DB2
            let queryDb2 = `SELECT * FROM weather ORDER BY id DESC`; // select all entries
            const limit = maxRows - db2Count
            let queryDb1 = `SELECT timestamp, date, time, temp, pressure, tendency, windspeed, winddir FROM weather ORDER BY timestamp DESC LIMIT ${limit}`; // select the newest entries
            //console.log(queryDb1)

            // select maxRows-count values from DB1
            console.log('Table created in output DB. Merging source streams...');
            const stream1$ = streamRowsFromDb(sourceDb2Path); // to little data from db2
            const stream2$ = streamRowsFromDb2(sourceDb1Path, queryDb1); // fill the rest with the newest data from db1
            return merge(stream1$, stream2$).pipe(take(maxRows));       // limit the merged database size
          } else if (db2Count >= maxRows) { // there is enough data in db2
            console.log("db2Count >= maxRows")
            const stream1$ = streamRowsFromDb(sourceDb2Path); // stream only db2 but
            return stream1$.pipe(take(maxRows)); //              limit the merged database size
          }

        })

        const stream1$ = streamRowsFromDb(sourceDb1Path);
        const stream2$ = streamRowsFromDb(sourceDb2Path);
        return merge(stream1$, stream2$).pipe(take(maxRows));
      }),
      // 3. Buffer the merged rows for efficient batch insertion
      bufferCount(1000),
      // 4. Write each batch to the output database within a transaction
      concatMap(batch => {
        if (batch.length === 0) return of(0);
        return new Observable(subscriber => {
          outputDb.serialize(() => {
            outputDb.run('BEGIN TRANSACTION;');
            const stmt = outputDb.prepare(insertSql);
            batch.forEach(row => {
              stmt.run(row.timestamp, row.date, row.time, row.temp, row.pressure, row.tendency, row.windspeed, row.winddir);
            });
            stmt.finalize(err => {
              if (err) return subscriber.error(err);
              outputDb.run('COMMIT;', (commitErr) => {
                if (commitErr) return subscriber.error(commitErr);
                totalRowsWritten += batch.length;
                console.log(`Wrote a batch of ${batch.length} rows.`);
                subscriber.next(batch.length);
                subscriber.complete();
              });
            });
          });
        });
      }),
      // 5. Finalize the stream by closing the output database
      finalize(() => {
        outputDb.close((err) => {
          if (err) {
            console.error('Error closing output DB:', err.message);
            // We can still try to resolve, as the file might be usable
          }
          console.log(`Output database closed. Total rows written: ${totalRowsWritten}. Merge complete.`);
          resolve();
        });
      }),
      catchError(err => {
        console.error('An error occurred in the merge pipeline:', err.message);
        reject(err);
        return EMPTY; // Stop the stream gracefully
      })
    ).subscribe({
      error: (err) => {
        // This will be caught by the catchError above, but we keep it for safety.
        // The promise should have already been rejected.
        console.error('Subscription-level error in merge pipeline:', err.message);
      }
    });
  });
}
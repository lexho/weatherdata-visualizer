// /path/to/your/project/index.js
import { SerialToDatabase } from './SerialToDatabase.js';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const version = "v2.0, September 2025"

function main() {
  console.log('--- Starting Application ---');

  const serialToDatabase = new SerialToDatabase();

  // Start the Serial Reader
  serialToDatabase.start();

  // prepare webserver
  let style1
  try {
    style1 = readFileSync('./style.css', 'utf-8');
  } catch(err) {
    console.error(err)
  }
  const style = style1;
  let script1
  try {
    script1 = readFileSync('./fetchData.js', 'utf-8');
  } catch(err) {
    console.error(err)
  }
  const script = script1;

  createServer((req, res) => {
    console.log("request.url: " + req.url)
    if(req.url == "/database.sqlite3") {
       
    }
    if(req.url == "/api" || req.url == "/api/") {
      const datasets = serialToDatabase.getData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(datasets));
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    
    let rows = ""
    const datasets = serialToDatabase.getData();
    for (const dataset of datasets) {
      // 1541|1757492204618|10.09.2025|10:16|20.5|1017.2|falling|12.3|NW
      //let dataset = datasets[datasets.length-1]
      /* = {
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
            };*/
      //console.log(dataset)

      const timestamp = dataset.timestamp
      const date = dataset.date
      const time = dataset.time
      const temp = dataset.weather.temp.value
      const pressure = dataset.weather.pressure.value
      const tendency = dataset.weather.tendency.value
      const windspeed = dataset.weather.windspeed.value
      const winddir = dataset.weather.winddir.value

      /*let date = "10.09.2025"
      let time = "10:16"
      let temp = "20.5"
      let pressure = "1017.2"
      let tendency = "falling"
      let windspeed = "12.3"
      let winddir = "NW"*/


      const row = `<tr><td>${date}</td><td>${time}</td><td>${temp}</td><td>${pressure}</td><td>${tendency}</td><td>${windspeed}</td><td>${winddir}</td></tr>`
      //let row2 = `<tr><td>${date}</td><td>${time}</td><td>${temp}</td><td>${pressure}</td><td>${tendency}</td><td>${windspeed}</td><td>${winddir}</td></tr>`
      //let row3 = `<tr><td>${date}</td><td>${time}</td><td>${temp}</td><td>${pressure}</td><td>${tendency}</td><td>${windspeed}</td><td>${winddir}</td></tr>`
      //rows.push(row)
      rows += "\t" + row + "\n";
      //rows.push(row2)
      //rows.push(row3)
    }
    rows = `<tr><td id="date1"></td><td id="time1"></td><td id="temp1"></td><td id="pressure1"></td><td id="tendency1"></td><td id="windspeed1"></td><td id="winddir1"></td></tr>`
    rows += `<tr><td id="date2"></td><td id="time2"></td><td id="temp2"></td><td id="pressure2"></td><td id="tendency2"></td><td id="windspeed2"></td><td id="winddir2"></td></tr>`
    rows += `<tr><td id="date3"></td><td id="time3"></td><td id="temp3"></td><td id="pressure3"></td><td id="tendency3"></td><td id="windspeed3"></td><td id="winddir3"></td></tr>`
    rows += `<tr><td id="date4"></td><td id="time4"></td><td id="temp4"></td><td id="pressure4"></td><td id="tendency4"></td><td id="windspeed4"></td><td id="winddir4"></td></tr>`
    rows += `<tr><td id="date5"></td><td id="time5"></td><td id="temp5"></td><td id="pressure5"></td><td id="tendency5"></td><td id="windspeed5"></td><td id="winddir5"></td></tr>`

    const table_head = '<thead><tr><th>date</th><th>time</th><th>temp</th><th>pressure</th><th>tendency</th><th>windspeed</th><th>winddir</th></thead>\n'
    const table_body = `<tbody>\n${rows}</tbody>\n`
    const table = `<table>\n${table_head}${table_body}</table>`
    const container = `<div class="container">\n\t<h1>Wetter-Station</h1>\n<button onClick="alert('download!')">download</button>\n${table}\n<div>${version}</div>\n</div>\n`
    const response_body = `<!DOCTYPE html>\n<html>\n<head>\n<style>${style}</style>\n</head>\n<body>\n${container}<script>${script}</script></body>\n</html>`
    res.end(response_body)
  }).listen(8080, () => {
    console.log("weather station web app listening on port 8080")
  });
}

main();

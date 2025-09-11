// /path/to/your/project/FakeSerialPort.js
import { EventEmitter } from 'events';

/**
 * A fake SerialPort class for testing purposes.
 * It emits a 'data' event every second.
 */
export class FakeSerialPort extends EventEmitter {
  #intervalId = null;
  isOpen = true; // Mock the isOpen property

  constructor(options, callback) {
    super();
    // Emit 'open' event asynchronously to mimic real behavior
    process.nextTick(() => this.emit('open'));

    this.#intervalId = setInterval(() => {
      function getRandomInt(max) {
        return Math.floor(Math.random() * max);
      }
      let temp = Math.round((Math.random()*60 - 20) * 10) / 10
      let pressure = Math.round((Math.random()*400 + 1000) * 10) / 10
      let windspeed = Math.round((Math.random()*200 + 100) * 10) / 10 //Math.round(Math.random(200)*10)/10
      let tendency = ["falling", "steady", "rising"][Math.round(Math.random()*2)]
      let winddir1 = ["N", "NO", "NW", "S", "SO", "SW", "O", "W"]
      let winddir = winddir1[Math.round(Math.random()*winddir1.length-1)]
      const data = `${temp}oC ${pressure}hPa ${tendency} ${windspeed}km/h ${winddir}\n`;
      this.emit('data', data);
    }, 1000);
  }

  close() {
    clearInterval(this.#intervalId);
    this.isOpen = false;
    console.log('Fake serial port closed.');
  }

  pipe(parser) {
    this.on('data', (data) => parser.write(data));
    return parser;
  }
}

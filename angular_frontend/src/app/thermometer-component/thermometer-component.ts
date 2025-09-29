import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { interval } from 'rxjs'; // Removed as data is now passed via @Input

@Component({
  selector: 'app-thermometer-component',
  imports: [],
  templateUrl: './thermometer-component.svg',
})
export class ThermometerComponent implements OnChanges { // Implement OnChanges to react to input changes
  @Input() temperatureValue: number | undefined; // Input property to receive temperature from parent

  fill = "lightgray"
  height = 0
  strokeWidth = 0
  text = "0\u00B0C"
  name = "temperature"

  constructor() {
    // Constructor should be kept light. Logic that depends on inputs should be in ngOnChanges or ngOnInit.
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if the temperatureValue input has changed and is not undefined
    if (changes['temperatureValue'] && changes['temperatureValue'].currentValue !== undefined) {
      this._updateThermometer(changes['temperatureValue'].currentValue);
    }
  }

  private _updateThermometer(value: number): void {
    //range:  [- 25 --- + 60]
    // 280 (implied max height for the visual representation)
    if (typeof(value) !== 'number' || value > 45 || value < -15) {
      console.error("ThermometerComponent: temperature out of range [-15, 45]", value);
      this.fill = "lightgray";
      this.height = 0;
      this.strokeWidth = 0;
      this.text = value + "\u00B0C"; // Still display the value even if it's out of range
      return;
    }

    let trimmedValue = value;
    trimmedValue += 15; // Shift range from [-15, 45] to [0, 60]
    trimmedValue *= (280 / 60); // Scale to height. (max height / total range)

    this.height = trimmedValue;
    this.fill = this.computeFillColor2(value, -15, 45)
    this.strokeWidth = 2;

    this.text = Math.round(value * 10) / 10 + "\u00B0C"; // Update the displayed text
  }

  private computeFillColor2(value: number, min: number, max: number) {
        //let hue = 239
        //0 42 239
        let range = max - min
        let p = (value - min) / range; // Normalize value to a 0-1 range
        
        /*let hue = 239 - p*239// Hue-Wert zw. 0 und 239
        hue = Math.round(hue)
        const color = "hsl(" + hue + ", 76%, 60%)"*/
        // Define HSL hue values for our key colors
        const HUE_BLUE = 255;

        // Normalize the input value to a percentage (0.0 to 1.0)
        /*const range = max - min;
        let p = (value - min) / range;*/
        p = Math.max(0, Math.min(1, p)); // Clamp percentage between 0 and 1

        let hue;
        // Interpolate from Blue (cold) to Red (hot)
        hue = HUE_BLUE - (p * HUE_BLUE);
        const color = "hsl(" + Math.round(hue) + ", 100%, 55%)";
        return color;
    }

}

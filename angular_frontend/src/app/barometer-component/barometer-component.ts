import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-barometer-component',
  imports: [],
  templateUrl: './barometer.svg',
})
export class BarometerComponent implements OnChanges {
  @Input() pressureValue: number | undefined;
  fill = "lightgray"
  strokeWidth = 0
  transform = "rotate(0)"
  text = ""
  name = "pressure"
  constructor() {

  }

  ngOnChanges(changes: SimpleChanges): void {
    // Check if the temperatureValue input has changed and is not undefined
    if (changes['pressureValue'] && changes['pressureValue'].currentValue !== undefined) {
      this._updatePressure(changes['pressureValue'].currentValue);
    }
  }

  private _updatePressure(value: number): void {
    // 955 - 1075
    // 0 - 100
    //value + 955 | 1075
    // 360
    // 955 + 120 = 1075
    if (typeof (value) != 'number' || value < 955 || value > 1075) {
      console.error("pressure out of range");
      this.fill = "lightgray"
      this.strokeWidth = 0
      return;
    }
    let trimmedValue = value - 955;
    trimmedValue *= 2.7
    trimmedValue -= 160
    this.fill = "url(#metal)"
    this.strokeWidth = 2
    this.transform = `rotate(${trimmedValue})`
    value = Math.round(value * 10) / 10
    this.text = value + "hPa"
  }
}

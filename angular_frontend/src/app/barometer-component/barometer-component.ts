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
    // The gauge face is scaled for 960 to 1070 hPa.
    // The rotation arc is from -145 degrees to 138.3 degrees (a total of 283.3 degrees).
    // The value range is 110 hPa (1070 - 960).
    // Scaling factor: 283.3 / 110 = 2.575
    if (typeof (value) !== 'number' || value < 960 || value > 1070) {
      console.error("pressure out of range");
      this.fill = "lightgray"
      this.strokeWidth = 0
      return;
    }
    // Map the pressure value to the rotation angle.
    // Formula: (currentValue - minValue) * scalingFactor + startAngle
    const trimmedValue = (value - 960) * 2.575 - 145;
    this.fill = "url(#metal)"
    this.strokeWidth = 2
    this.transform = `rotate(${trimmedValue})`
    value = Math.round(value * 10) / 10
    this.text = value + "hPa"
  }
}

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-anemometer-component',
  imports: [],
  templateUrl: './anemometer.svg',
})
export class AnemometerComponent {
  @Input() windspeedValue: number | undefined;
  fill = "lightgray"
  strokeWidth = 0
  transform = "rotate(0)"
  text = ""
  name = "windspeed"

  ngOnChanges(changes: SimpleChanges): void {
    // Check if the temperatureValue input has changed and is not undefined
    if (changes['windspeedValue'] && changes['windspeedValue'].currentValue !== undefined) {
      this._updateWindspeed(changes['windspeedValue'].currentValue);
    }
  }

  private _updateWindspeed(value: number): void {
    // 0 - 260
    // 260/100
    // 0 - 360
    if (typeof (value) != 'number' || value < 0 || value > 260) {
      console.error("windspeed out of range");
      this.fill = "lightgray"
      this.strokeWidth = 0
      return;
    }
    let trimmedValue = value * 1.09
    trimmedValue -= 145
    this.fill = "url(#metal)"
    this.strokeWidth = 2
    this.transform = `rotate(${trimmedValue})`
    value = Math.round(value * 10) / 10
    this.text = value + "km/h"
  }
}

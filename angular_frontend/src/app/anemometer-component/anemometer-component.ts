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
    // The gauge's rotation arc is 283.4 degrees (from -145 to 138.4).
    // To map the new 0-130 km/h range, we calculate a new scaling factor.
    // New scaling factor: 283.4 / 130 = 2.18
    if (typeof (value) !== 'number' || value < 0 || value > 130) {
      console.error("windspeed out of range");
      this.fill = "lightgray"
      this.strokeWidth = 0
      return;
    }
    const trimmedValue = (value * 2.18) - 145;
    this.fill = "url(#metal)"
    this.strokeWidth = 2
    this.transform = `rotate(${trimmedValue})`
    value = Math.round(value * 10) / 10
    this.text = value + "km/h"
  }
}

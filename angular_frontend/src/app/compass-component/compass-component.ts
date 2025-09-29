import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-compass-component',
  imports: [],
  templateUrl: './compass-component.svg',
})
export class CompassComponent {
  @Input() winddirValue: string | undefined;
  fill = "lightgray"
  fill_part = "darkgray"
  strokeWidth = 0
  transform = "rotate(0)"
  text = ""
  name = "winddir"

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['winddirValue'] && changes['winddirValue'].currentValue !== undefined) {
      this._updateWinddir(changes['winddirValue'].currentValue);
    }
  }

  private windDirToDegree(value : string) {
        //console.log("winddirvalue: " + value)
        //console.log("winddir length: " + value.length)
        //if(value.length == 2) value = value[0]
        //if(value.length == 3) value = value[0]+value[1]
        if(value == 'N') return 0
        if(value == 'O') return 90
        if(value == 'S') return 180
        if(value == 'W') return 270

        if(value == "NO") return 45
        if(value == "SO") return 135
        if(value == "SW") return 125
        if(value == "NW") return 315
        console.error("invalid wind dir")
        return -1
    }

  private _updateWinddir(value: string): void {
    console.log("update winddir: " + value)
        let value_num = this.windDirToDegree(value)
        //console.log("winddir value: " + value_num)
        //console.log(typeof value_num)
        if(typeof(value_num) != 'number' || value_num < 0 || value_num > 360) { 
            console.error("windspeed out of range"); 
            this.fill = "lightgray"
            this.strokeWidth = 0
            return;
        }
        if(Number.isInteger(value_num)) {
            this.fill = "lightblue"
            this.fill_part = "blue"
            this.strokeWidth = 2
            this.transform = `rotate(${value_num})`
            this.text = value
        }
  }
}

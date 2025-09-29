import { Component, Input } from '@angular/core';
import { WeatherData } from '../weather-data';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-table-component',
  imports: [NgFor],
  templateUrl: './table-component.html',
  styleUrl: './table-component.css'
})
export class TableComponent {
  @Input() datasets: WeatherData[] = [];
}

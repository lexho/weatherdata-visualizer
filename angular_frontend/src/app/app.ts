import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
// import { SvgComponent } from './svg-component/svg-component'; // SvgComponent is not used in this component's template or logic
import { ThermometerComponent } from './thermometer-component/thermometer-component';
import { BarometerComponent } from './barometer-component/barometer-component';
import { AnemometerComponent } from './anemometer-component/anemometer-component';
import { CompassComponent } from './compass-component/compass-component';
import { TableComponent } from "./table-component/table-component";
import { WeatherService} from './weather-service';
import { WeatherData } from './weather-data';
import { Subscription, interval } from 'rxjs';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThermometerComponent, BarometerComponent, AnemometerComponent, CompassComponent, TableComponent], // SvgComponent was not part of imports either
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Wetterstation');
  data: WeatherData[] = [];
  weatherService: WeatherService = inject(WeatherService);
  private dataSubscription: Subscription | undefined;

  currentTemperature: number | undefined; // Property to hold temperature data for child component
  currentPressure: number | undefined; // Property to hold pressure data
  currentWindspeed: number | undefined; // Property to hold pressure data
  currentWinddir: string | undefined; // Property to hold pressure data

  constructor(private titleService: Title) {

  }

  ngOnInit(): void {
    this.titleService.setTitle('Wetterstation');
    // The HTTP call is asynchronous. We subscribe to get the data.
    interval(200).pipe(
      
    ).subscribe(() => {
      this.dataSubscription = this.weatherService.getAllData().subscribe({
      next: (weatherData) => {
        this.data = weatherData;
        if (this.data.length > 0) {
          // Pass the temperature and pressure of the first data entry
          this.currentTemperature = parseFloat(this.data[this.data.length-1].weather.temp.value);
          this.currentPressure = parseFloat(this.data[this.data.length-1].weather.pressure.value);
          this.currentWindspeed = parseFloat(this.data[this.data.length-1].weather.windspeed.value);
          this.currentWinddir = this.data[this.data.length-1].weather.winddir.value;
        }
      },
      error: (err) => {
        console.error('Failed to get weather data', err);
        // You could use the mock data as a fallback here if desired
      }
    });
    })
    
  }

  ngOnDestroy(): void {
    // It's a best practice to unsubscribe to prevent memory leaks.
    this.dataSubscription?.unsubscribe();
  }
}

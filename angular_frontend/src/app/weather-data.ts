export interface WeatherData {
  id: number,
  timestamp: number,
  date: string,
  time: string,
  weather: {
    temp: { value: string },
    pressure: { value: string },
    tendency: { value: string },
    windspeed: { value: string },
    winddir: { value: string },
  }
}
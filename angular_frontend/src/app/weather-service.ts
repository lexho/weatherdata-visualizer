import { Injectable } from '@angular/core';
import { WeatherData } from './weather-data';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { Observable, of, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class WeatherService {
  empty = [{
    "id": 1,
    "timestamp": 1758788490780,
    "date": "25.09.2025",
    "time": "10:21:30",
    "weather": {
      "temp": {
        "value": "0"
      },
      "pressure": {
        "value": "960"
      },
      "tendency": {
        "value": "steady"
      },
      "windspeed": {
        "value": "0"
      },
      "winddir": {
        "value": "N"
      }
    }
  }]
  data = [
  {
    "id": 2,
    "timestamp": 1758788487771,
    "date": "25.09.2025",
    "time": "10:21:27",
    "weather": {
      "temp": {
        "value": "71.5"
      },
      "pressure": {
        "value": "1017.6"
      },
      "tendency": {
        "value": "rising"
      },
      "windspeed": {
        "value": "134.9"
      },
      "winddir": {
        "value": "SW"
      }
    }
  },
  {
    "id": 3,
    "timestamp": 1758788488775,
    "date": "25.09.2025",
    "time": "10:21:28",
    "weather": {
      "temp": {
        "value": "77.6"
      },
      "pressure": {
        "value": "1145.1"
      },
      "tendency": {
        "value": "falling"
      },
      "windspeed": {
        "value": "264.2"
      },
      "winddir": {
        "value": "NW"
      }
    }
  },
  {
    "id": 4,
    "timestamp": 1758788489777,
    "date": "25.09.2025",
    "time": "10:21:29",
    "weather": {
      "temp": {
        "value": "55.3"
      },
      "pressure": {
        "value": "1343.8"
      },
      "tendency": {
        "value": "steady"
      },
      "windspeed": {
        "value": "130.8"
      },
      "winddir": {
        "value": "N"
      }
    }
  },
  {
    "id": 5,
    "timestamp": 1758788490780,
    "date": "25.09.2025",
    "time": "10:21:30",
    "weather": {
      "temp": {
        "value": "47.7"
      },
      "pressure": {
        "value": "1308.1"
      },
      "tendency": {
        "value": "steady"
      },
      "windspeed": {
        "value": "279.8"
      },
      "winddir": {
        "value": "Y"
      }
    }
  },
  {
    "id": 6,
    "timestamp": 1758788491786,
    "date": "25.09.2025",
    "time": "10:21:31",
    "weather": {
      "temp": {
        "value": "49.1"
      },
      "pressure": {
        "value": "1022.7"
      },
      "tendency": {
        "value": "rising"
      },
      "windspeed": {
        "value": "163"
      },
      "winddir": {
        "value": "SW"
      }
    }
  }
];
  baseUrl = `/api`;

  constructor(private http: HttpClient) {}

  getAllData(): Observable<WeatherData[]> {
    let url = this.baseUrl;
    const params = new HttpParams()
    const headers = new HttpHeaders().set('Accept', 'application/json');
    return this.http.get<WeatherData[]>(url, { params, headers }).pipe(
      catchError(error => {
        console.warn('Could not fetch from backend, returning mock data. Error:', error);
        //return of(this.data); // 'of' creates an Observable from the mock data array
        return of(this.empty)
      })
    );
  }
}

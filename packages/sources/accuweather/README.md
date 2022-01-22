# Chainlink External Adapter for AccuWeather

[AccuWeather](https://www.accuweather.com/)

[AccuWeather API Docs](http://apidev.accuweather.com/developers/)

[AccuWeather Weather Icons](https://developer.accuweather.com/weather-icons)

### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                                                               Options                                                                                | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|    ✅     | endpoint | The endpoint to use | [location](#get-location-endpoint), [current-conditions](#get-current-conditions-endpoint), [location-current-conditions](#get-location-current-conditions-endpoint) |             |

---

## Get Location Endpoint

Returns location information by geoposition

### Input Params

| Required? |      Name      |                                     Description                                     |      Options       | Defaults to |
| :-------: | :------------: | :---------------------------------------------------------------------------------: | :----------------: | :---------: |
|    ✅     |     `lat`      |                            The latitude (WGS84 standard)                            |   `-90` to `90`    |             |
|    ✅     |     `lon`      |                           The longitude (WGS84 standard)                            |  `-180` to `180`   |             |
|           | `encodeResult` | When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON | `true` and `false` |   `true`    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "location",
    "lat": 40.78136100040876,
    "lon": -77.89687509335249
  }
}
```

### Sample Output

Param `encodeResult` is `false` (`result` contains the location data as `JSON`):

```json
{
  "jobRunID": "1",
  "result": {
    "locationFound": true,
    "locationKey": 2097720,
    "name": "Park Forest Village",
    "countryCode": "0x5553"
  },
  "statusCode": 200,
  "data": {
    "data": [
      {
        "Version": 1,
        "Key": "2097720",
        "Type": "City",
        "Rank": 65,
        "LocalizedName": "Park Forest Village",
        "EnglishName": "Park Forest Village",
        "PrimaryPostalCode": "16803",
        "Region": { "ID": "NAM", "LocalizedName": "North America", "EnglishName": "North America" },
        "Country": { "ID": "US", "LocalizedName": "United States", "EnglishName": "United States" },
        "AdministrativeArea": {
          "ID": "PA",
          "LocalizedName": "Pennsylvania",
          "EnglishName": "Pennsylvania",
          "Level": 1,
          "LocalizedType": "State",
          "EnglishType": "State",
          "CountryID": "US"
        },
        "TimeZone": {
          "Code": "EDT",
          "Name": "America/New_York",
          "GmtOffset": -4,
          "IsDaylightSaving": true,
          "NextOffsetChange": "2021-11-07T06:00:00Z"
        },
        "GeoPosition": {
          "Latitude": 40.807,
          "Longitude": -77.917,
          "Elevation": {
            "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
            "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          { "Level": 2, "LocalizedName": "Centre", "EnglishName": "Centre" }
        ],
        "DataSets": [
          "AirQualityCurrentConditions",
          "AirQualityForecasts",
          "Alerts",
          "DailyAirQualityForecast",
          "DailyPollenForecast",
          "ForecastConfidence",
          "FutureRadar",
          "MinuteCast",
          "Radar"
        ]
      }
    ],
    "result": {
      "locationFound": true,
      "locationKey": 2097720,
      "name": "Park Forest Village",
      "countryCode": "0x5553"
    }
  }
}
```

Param `encodeResult` is `true` (`result` is `[<locationFound>, <location data encoded>]`):

```json
{
  "jobRunID": "1",
  "result": [
    true,
    "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000002002380000000000000000000000000000000000000000000000000000000000000060555300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000135061726b20466f726573742056696c6c61676500000000000000000000000000"
  ],
  "statusCode": 200,
  "data": {
    "data": [
      {
        "Version": 1,
        "Key": "2097720",
        "Type": "City",
        "Rank": 65,
        "LocalizedName": "Park Forest Village",
        "EnglishName": "Park Forest Village",
        "PrimaryPostalCode": "16803",
        "Region": { "ID": "NAM", "LocalizedName": "North America", "EnglishName": "North America" },
        "Country": { "ID": "US", "LocalizedName": "United States", "EnglishName": "United States" },
        "AdministrativeArea": {
          "ID": "PA",
          "LocalizedName": "Pennsylvania",
          "EnglishName": "Pennsylvania",
          "Level": 1,
          "LocalizedType": "State",
          "EnglishType": "State",
          "CountryID": "US"
        },
        "TimeZone": {
          "Code": "EDT",
          "Name": "America/New_York",
          "GmtOffset": -4,
          "IsDaylightSaving": true,
          "NextOffsetChange": "2021-11-07T06:00:00Z"
        },
        "GeoPosition": {
          "Latitude": 40.807,
          "Longitude": -77.917,
          "Elevation": {
            "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
            "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          { "Level": 2, "LocalizedName": "Centre", "EnglishName": "Centre" }
        ],
        "DataSets": [
          "AirQualityCurrentConditions",
          "AirQualityForecasts",
          "Alerts",
          "DailyAirQualityForecast",
          "DailyPollenForecast",
          "ForecastConfidence",
          "FutureRadar",
          "MinuteCast",
          "Radar"
        ]
      }
    ],
    "result": [
      true,
      "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000002002380000000000000000000000000000000000000000000000000000000000000060555300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000135061726b20466f726573742056696c6c61676500000000000000000000000000"
    ]
  }
}
```

### Data Conversions - Location Endpoint

**countryCode**

ISO 3166 alpha-2 codes encoded as `bytes2`. See [list of ISO-3166 country codes](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes)

### Solidity Types - Location Endpoint

See [Solidity Types](#solidity-types)

---

## Get Current Conditions Endpoint

Returns the current weather conditions in a location by its identifier

### Input Params

| Required? |      Name      |                                       Description                                       |         Options         | Defaults to |
| :-------: | :------------: | :-------------------------------------------------------------------------------------: | :---------------------: | :---------: |
|    ✅     | `locationKey`  | The location unique ID (to be optained via [location](#get-location-endpoint) endpoint) |                         |             |
|    ✅     |    `units`     |                    The measurement system for the output conditions                     | `imperial` and `metric` |             |
|           | `encodeResult` |   When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON   |   `true` and `false`    |   `true`    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "current-conditions",
    "locationKey": 2097720,
    "units": "metric"
  }
}
```

### Sample Output

Param `encodeResult` is `false` (`result` contains the current conditions as `JSON`):

```json
{
  "jobRunID": "1",
  "result": {
    "precipitationPast12Hours": 1550,
    "precipitationPast24Hours": 1550,
    "precipitationPastHour": 330,
    "precipitationType": 1,
    "pressure": 100540,
    "relativeHumidity": 91,
    "temperature": 87,
    "timestamp": 1635526080,
    "uvIndex": 1,
    "weatherIcon": 18,
    "windDirectionDegrees": 68,
    "windSpeed": 130
  },
  "statusCode": 200,
  "data": {
    "data": [
      {
        "LocalObservationDateTime": "2021-10-29T12:48:00-04:00",
        "EpochTime": 1635526080,
        "WeatherText": "Rain",
        "WeatherIcon": 18,
        "HasPrecipitation": true,
        "PrecipitationType": "Rain",
        "IsDayTime": true,
        "Temperature": {
          "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperature": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperatureShade": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RelativeHumidity": 91,
        "IndoorRelativeHumidity": 44,
        "DewPoint": {
          "Metric": { "Value": 7.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 45, "Unit": "F", "UnitType": 18 }
        },
        "Wind": {
          "Direction": { "Degrees": 68, "Localized": "ENE", "English": "ENE" },
          "Speed": {
            "Metric": { "Value": 13, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 8.1, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": { "Value": 22.2, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 13.8, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "UVIndex": 1,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": { "Value": 4.8, "Unit": "km", "UnitType": 6 },
          "Imperial": { "Value": 3, "Unit": "mi", "UnitType": 2 }
        },
        "ObstructionsToVisibility": "R",
        "CloudCover": 100,
        "Ceiling": {
          "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
          "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
        },
        "Pressure": {
          "Metric": { "Value": 1005.4, "Unit": "mb", "UnitType": 14 },
          "Imperial": { "Value": 29.69, "Unit": "inHg", "UnitType": 12 }
        },
        "PressureTendency": { "LocalizedText": "Falling", "Code": "F" },
        "Past24HourTemperatureDeparture": {
          "Metric": { "Value": -3.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": -6, "Unit": "F", "UnitType": 18 }
        },
        "ApparentTemperature": {
          "Metric": { "Value": 10.6, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 51, "Unit": "F", "UnitType": 18 }
        },
        "WindChillTemperature": {
          "Metric": { "Value": 6.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 44, "Unit": "F", "UnitType": 18 }
        },
        "WetBulbTemperature": {
          "Metric": { "Value": 8, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 46, "Unit": "F", "UnitType": 18 }
        },
        "Precip1hr": {
          "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
          "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "PastHour": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "Past3Hours": {
            "Metric": { "Value": 7.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.31, "Unit": "in", "UnitType": 1 }
          },
          "Past6Hours": {
            "Metric": { "Value": 12.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.5, "Unit": "in", "UnitType": 1 }
          },
          "Past9Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past12Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past18Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past24Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 11.1, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 52, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 13.3, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 56, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 15, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 59, "Unit": "F", "UnitType": 18 }
            }
          }
        },
        "MobileLink": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us",
        "Link": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us"
      }
    ],
    "result": {
      "precipitationPast12Hours": 1550,
      "precipitationPast24Hours": 1550,
      "precipitationPastHour": 330,
      "precipitationType": 1,
      "pressure": 100540,
      "relativeHumidity": 91,
      "temperature": 87,
      "timestamp": 1635526080,
      "uvIndex": 1,
      "weatherIcon": 18,
      "windDirectionDegrees": 68,
      "windSpeed": 130
    }
  }
}
```

Param `encodeResult` is `true` (`result` is `<current conditions encoded>`):

```json
{
  "jobRunID": "1",
  "result": "0x00000000000000000000000000000000000000000000000000000000617c25c0000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000014a00000000000000000000000000000000000000000000000000000000000188bc0000000000000000000000000000000000000000000000000000000000000057000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000820000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000012",
  "statusCode": 200,
  "data": {
    "data": [
      {
        "LocalObservationDateTime": "2021-10-29T12:48:00-04:00",
        "EpochTime": 1635526080,
        "WeatherText": "Rain",
        "WeatherIcon": 18,
        "HasPrecipitation": true,
        "PrecipitationType": "Rain",
        "IsDayTime": true,
        "Temperature": {
          "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperature": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperatureShade": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RelativeHumidity": 91,
        "IndoorRelativeHumidity": 44,
        "DewPoint": {
          "Metric": { "Value": 7.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 45, "Unit": "F", "UnitType": 18 }
        },
        "Wind": {
          "Direction": { "Degrees": 68, "Localized": "ENE", "English": "ENE" },
          "Speed": {
            "Metric": { "Value": 13, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 8.1, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": { "Value": 22.2, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 13.8, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "UVIndex": 1,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": { "Value": 4.8, "Unit": "km", "UnitType": 6 },
          "Imperial": { "Value": 3, "Unit": "mi", "UnitType": 2 }
        },
        "ObstructionsToVisibility": "R",
        "CloudCover": 100,
        "Ceiling": {
          "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
          "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
        },
        "Pressure": {
          "Metric": { "Value": 1005.4, "Unit": "mb", "UnitType": 14 },
          "Imperial": { "Value": 29.69, "Unit": "inHg", "UnitType": 12 }
        },
        "PressureTendency": { "LocalizedText": "Falling", "Code": "F" },
        "Past24HourTemperatureDeparture": {
          "Metric": { "Value": -3.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": -6, "Unit": "F", "UnitType": 18 }
        },
        "ApparentTemperature": {
          "Metric": { "Value": 10.6, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 51, "Unit": "F", "UnitType": 18 }
        },
        "WindChillTemperature": {
          "Metric": { "Value": 6.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 44, "Unit": "F", "UnitType": 18 }
        },
        "WetBulbTemperature": {
          "Metric": { "Value": 8, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 46, "Unit": "F", "UnitType": 18 }
        },
        "Precip1hr": {
          "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
          "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "PastHour": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "Past3Hours": {
            "Metric": { "Value": 7.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.31, "Unit": "in", "UnitType": 1 }
          },
          "Past6Hours": {
            "Metric": { "Value": 12.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.5, "Unit": "in", "UnitType": 1 }
          },
          "Past9Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past12Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past18Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past24Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 11.1, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 52, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 13.3, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 56, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 15, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 59, "Unit": "F", "UnitType": 18 }
            }
          }
        },
        "MobileLink": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us",
        "Link": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us"
      }
    ],
    "result": "0x00000000000000000000000000000000000000000000000000000000617c25c0000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000014a00000000000000000000000000000000000000000000000000000000000188bc0000000000000000000000000000000000000000000000000000000000000057000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000820000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000012"
  }
}
```

### Data Conversions - Current Conditions Endpoint

**precipitationType**

Encoded as `uint8`

| Value |       Type       |
| :---: | :--------------: |
|  `0`  | No precipitation |
|  `1`  |       Rain       |
|  `2`  |       Snow       |
|  `3`  |       Ice        |
|  `4`  |      Mixed       |

**weatherIcon**

Encoded as `uint8`. Each icon number is related with an image and a text. See [Weather Icons](https://developer.accuweather.com/weather-icons)

**Decimals to integers**

Applies to both `metric` and `imperial` units.

|         Condition          |     Conversion      |
| :------------------------: | :-----------------: |
| `precipitationPast12Hours` | multiplied by `100` |
| `precipitationPast24Hours` | multiplied by `100` |
|  `precipitationPastHour`   | multiplied by `100` |
|         `pressure`         | multiplied by `100` |
|       `temperature`        | multiplied by `10`  |
|        `windSpeed`         | multiplied by `10`  |

### Measurement Units By System - Current Conditions Endpoint

|         Condition          | Imperial | Metric |
| :------------------------: | :------: | :----: |
| `precipitationPast12Hours` |    mm    |   in   |
| `precipitationPast24Hours` |    mm    |   in   |
|  `precipitationPastHour`   |    mm    |   in   |
|         `pressure`         |    mb    |  inHg  |
|       `temperature`        |    C     |   F    |
|        `windSpeed`         |   km/h   |  mi/h  |

### Solidity Types - Current Conditions Endpoint

See [Solidity Types](#solidity-types)

---

## Get Location Current Conditions Endpoint

Returns the current weather conditions in a location by its geoposition

### Input Params

| Required? |      Name      |                                     Description                                     |         Options         | Defaults to |
| :-------: | :------------: | :---------------------------------------------------------------------------------: | :---------------------: | :---------: |
|    ✅     |     `lat`      |                            The latitude (WGS84 standard)                            |      `-90` to `90`      |             |
|    ✅     |     `lon`      |                           The longitude (WGS84 standard)                            |     `-180` to `180`     |             |
|    ✅     |    `units`     |                  The measurement system for the output conditions                   | `imperial` and `metric` |             |
|           | `encodeResult` | When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON |   `true` and `false`    |   `true`    |

### Sample Input

```json
{
  "id": 0,
  "data": {
    "endpoint": "location-current-conditions",
    "lat": 40.78136100040876,
    "lon": -77.89687509335249,
    "units": "metric"
  }
}
```

### Sample Output

Param `encodeResult` is `false` (`result` contains both the location data and the current conditions as `JSON`):

```json
{
  "jobRunID": "1",
  "result": {
    "locationFound": true,
    "locationKey": 2097720,
    "name": "Park Forest Village",
    "countryCode": "0x5553",
    "precipitationPast12Hours": 1550,
    "precipitationPast24Hours": 1550,
    "precipitationPastHour": 330,
    "precipitationType": 1,
    "pressure": 100540,
    "relativeHumidity": 91,
    "temperature": 87,
    "timestamp": 1635526080,
    "uvIndex": 1,
    "weatherIcon": 18,
    "windDirectionDegrees": 68,
    "windSpeed": 130
  },
  "statusCode": 200,
  "data": {
    "dataLocation": [
      {
        "Version": 1,
        "Key": "2097720",
        "Type": "City",
        "Rank": 65,
        "LocalizedName": "Park Forest Village",
        "EnglishName": "Park Forest Village",
        "PrimaryPostalCode": "16803",
        "Region": { "ID": "NAM", "LocalizedName": "North America", "EnglishName": "North America" },
        "Country": { "ID": "US", "LocalizedName": "United States", "EnglishName": "United States" },
        "AdministrativeArea": {
          "ID": "PA",
          "LocalizedName": "Pennsylvania",
          "EnglishName": "Pennsylvania",
          "Level": 1,
          "LocalizedType": "State",
          "EnglishType": "State",
          "CountryID": "US"
        },
        "TimeZone": {
          "Code": "EDT",
          "Name": "America/New_York",
          "GmtOffset": -4,
          "IsDaylightSaving": true,
          "NextOffsetChange": "2021-11-07T06:00:00Z"
        },
        "GeoPosition": {
          "Latitude": 40.807,
          "Longitude": -77.917,
          "Elevation": {
            "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
            "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          { "Level": 2, "LocalizedName": "Centre", "EnglishName": "Centre" }
        ],
        "DataSets": [
          "AirQualityCurrentConditions",
          "AirQualityForecasts",
          "Alerts",
          "DailyAirQualityForecast",
          "DailyPollenForecast",
          "ForecastConfidence",
          "FutureRadar",
          "MinuteCast",
          "Radar"
        ]
      }
    ],
    "dataCurrentConditions": [
      {
        "LocalObservationDateTime": "2021-10-29T12:48:00-04:00",
        "EpochTime": 1635526080,
        "WeatherText": "Rain",
        "WeatherIcon": 18,
        "HasPrecipitation": true,
        "PrecipitationType": "Rain",
        "IsDayTime": true,
        "Temperature": {
          "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperature": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperatureShade": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RelativeHumidity": 91,
        "IndoorRelativeHumidity": 44,
        "DewPoint": {
          "Metric": { "Value": 7.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 45, "Unit": "F", "UnitType": 18 }
        },
        "Wind": {
          "Direction": { "Degrees": 68, "Localized": "ENE", "English": "ENE" },
          "Speed": {
            "Metric": { "Value": 13, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 8.1, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": { "Value": 22.2, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 13.8, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "UVIndex": 1,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": { "Value": 4.8, "Unit": "km", "UnitType": 6 },
          "Imperial": { "Value": 3, "Unit": "mi", "UnitType": 2 }
        },
        "ObstructionsToVisibility": "R",
        "CloudCover": 100,
        "Ceiling": {
          "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
          "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
        },
        "Pressure": {
          "Metric": { "Value": 1005.4, "Unit": "mb", "UnitType": 14 },
          "Imperial": { "Value": 29.69, "Unit": "inHg", "UnitType": 12 }
        },
        "PressureTendency": { "LocalizedText": "Falling", "Code": "F" },
        "Past24HourTemperatureDeparture": {
          "Metric": { "Value": -3.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": -6, "Unit": "F", "UnitType": 18 }
        },
        "ApparentTemperature": {
          "Metric": { "Value": 10.6, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 51, "Unit": "F", "UnitType": 18 }
        },
        "WindChillTemperature": {
          "Metric": { "Value": 6.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 44, "Unit": "F", "UnitType": 18 }
        },
        "WetBulbTemperature": {
          "Metric": { "Value": 8, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 46, "Unit": "F", "UnitType": 18 }
        },
        "Precip1hr": {
          "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
          "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "PastHour": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "Past3Hours": {
            "Metric": { "Value": 7.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.31, "Unit": "in", "UnitType": 1 }
          },
          "Past6Hours": {
            "Metric": { "Value": 12.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.5, "Unit": "in", "UnitType": 1 }
          },
          "Past9Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past12Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past18Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past24Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 11.1, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 52, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 13.3, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 56, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 15, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 59, "Unit": "F", "UnitType": 18 }
            }
          }
        },
        "MobileLink": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us",
        "Link": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us"
      }
    ],
    "result": {
      "locationFound": true,
      "locationKey": 2097720,
      "name": "Park Forest Village",
      "countryCode": "0x5553",
      "precipitationPast12Hours": 1550,
      "precipitationPast24Hours": 1550,
      "precipitationPastHour": 330,
      "precipitationType": 1,
      "pressure": 100540,
      "relativeHumidity": 91,
      "temperature": 87,
      "timestamp": 1635526080,
      "uvIndex": 1,
      "weatherIcon": 18,
      "windDirectionDegrees": 68,
      "windSpeed": 130
    }
  }
}
```

Param `encodeResult` is `true` (`result` is `[<locationFound>, <location data encoded>, <current conditions encoded>]`):

```json
{
  "jobRunID": "1",
  "result": [
    true,
    "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000002002380000000000000000000000000000000000000000000000000000000000000060555300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000135061726b20466f726573742056696c6c61676500000000000000000000000000",
    "0x00000000000000000000000000000000000000000000000000000000617c25c0000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000014a00000000000000000000000000000000000000000000000000000000000188bc0000000000000000000000000000000000000000000000000000000000000057000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000820000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000012"
  ],
  "statusCode": 200,
  "data": {
    "dataLocation": [
      {
        "Version": 1,
        "Key": "2097720",
        "Type": "City",
        "Rank": 65,
        "LocalizedName": "Park Forest Village",
        "EnglishName": "Park Forest Village",
        "PrimaryPostalCode": "16803",
        "Region": { "ID": "NAM", "LocalizedName": "North America", "EnglishName": "North America" },
        "Country": { "ID": "US", "LocalizedName": "United States", "EnglishName": "United States" },
        "AdministrativeArea": {
          "ID": "PA",
          "LocalizedName": "Pennsylvania",
          "EnglishName": "Pennsylvania",
          "Level": 1,
          "LocalizedType": "State",
          "EnglishType": "State",
          "CountryID": "US"
        },
        "TimeZone": {
          "Code": "EDT",
          "Name": "America/New_York",
          "GmtOffset": -4,
          "IsDaylightSaving": true,
          "NextOffsetChange": "2021-11-07T06:00:00Z"
        },
        "GeoPosition": {
          "Latitude": 40.807,
          "Longitude": -77.917,
          "Elevation": {
            "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
            "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          { "Level": 2, "LocalizedName": "Centre", "EnglishName": "Centre" }
        ],
        "DataSets": [
          "AirQualityCurrentConditions",
          "AirQualityForecasts",
          "Alerts",
          "DailyAirQualityForecast",
          "DailyPollenForecast",
          "ForecastConfidence",
          "FutureRadar",
          "MinuteCast",
          "Radar"
        ]
      }
    ],
    "dataCurrentConditions": [
      {
        "LocalObservationDateTime": "2021-10-29T12:48:00-04:00",
        "EpochTime": 1635526080,
        "WeatherText": "Rain",
        "WeatherIcon": 18,
        "HasPrecipitation": true,
        "PrecipitationType": "Rain",
        "IsDayTime": true,
        "Temperature": {
          "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperature": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RealFeelTemperatureShade": {
          "Metric": { "Value": 4.4, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 40, "Unit": "F", "UnitType": 18 }
        },
        "RelativeHumidity": 91,
        "IndoorRelativeHumidity": 44,
        "DewPoint": {
          "Metric": { "Value": 7.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 45, "Unit": "F", "UnitType": 18 }
        },
        "Wind": {
          "Direction": { "Degrees": 68, "Localized": "ENE", "English": "ENE" },
          "Speed": {
            "Metric": { "Value": 13, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 8.1, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": { "Value": 22.2, "Unit": "km/h", "UnitType": 7 },
            "Imperial": { "Value": 13.8, "Unit": "mi/h", "UnitType": 9 }
          }
        },
        "UVIndex": 1,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": { "Value": 4.8, "Unit": "km", "UnitType": 6 },
          "Imperial": { "Value": 3, "Unit": "mi", "UnitType": 2 }
        },
        "ObstructionsToVisibility": "R",
        "CloudCover": 100,
        "Ceiling": {
          "Metric": { "Value": 427, "Unit": "m", "UnitType": 5 },
          "Imperial": { "Value": 1400, "Unit": "ft", "UnitType": 0 }
        },
        "Pressure": {
          "Metric": { "Value": 1005.4, "Unit": "mb", "UnitType": 14 },
          "Imperial": { "Value": 29.69, "Unit": "inHg", "UnitType": 12 }
        },
        "PressureTendency": { "LocalizedText": "Falling", "Code": "F" },
        "Past24HourTemperatureDeparture": {
          "Metric": { "Value": -3.3, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": -6, "Unit": "F", "UnitType": 18 }
        },
        "ApparentTemperature": {
          "Metric": { "Value": 10.6, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 51, "Unit": "F", "UnitType": 18 }
        },
        "WindChillTemperature": {
          "Metric": { "Value": 6.7, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 44, "Unit": "F", "UnitType": 18 }
        },
        "WetBulbTemperature": {
          "Metric": { "Value": 8, "Unit": "C", "UnitType": 17 },
          "Imperial": { "Value": 46, "Unit": "F", "UnitType": 18 }
        },
        "Precip1hr": {
          "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
          "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "PastHour": {
            "Metric": { "Value": 3.3, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.13, "Unit": "in", "UnitType": 1 }
          },
          "Past3Hours": {
            "Metric": { "Value": 7.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.31, "Unit": "in", "UnitType": 1 }
          },
          "Past6Hours": {
            "Metric": { "Value": 12.8, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.5, "Unit": "in", "UnitType": 1 }
          },
          "Past9Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past12Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past18Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          },
          "Past24Hours": {
            "Metric": { "Value": 15.5, "Unit": "mm", "UnitType": 3 },
            "Imperial": { "Value": 0.61, "Unit": "in", "UnitType": 1 }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 11.1, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 52, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 13.3, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 56, "Unit": "F", "UnitType": 18 }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": { "Value": 8.7, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 48, "Unit": "F", "UnitType": 18 }
            },
            "Maximum": {
              "Metric": { "Value": 15, "Unit": "C", "UnitType": 17 },
              "Imperial": { "Value": 59, "Unit": "F", "UnitType": 18 }
            }
          }
        },
        "MobileLink": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us",
        "Link": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us"
      }
    ],
    "result": [
      true,
      "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000002002380000000000000000000000000000000000000000000000000000000000000060555300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000135061726b20466f726573742056696c6c61676500000000000000000000000000",
      "0x00000000000000000000000000000000000000000000000000000000617c25c0000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000060e000000000000000000000000000000000000000000000000000000000000014a00000000000000000000000000000000000000000000000000000000000188bc0000000000000000000000000000000000000000000000000000000000000057000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000820000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000012"
    ]
  }
}
```

### Data Conversions - Location Current Conditions Endpoint

See [Location Endpoint Data Conversions](#data-conversions---location-endpoint) and [Current Conditions Endpoint Data Conversions](#data-conversions---current-conditions-endpoint)

### Endpoint Measurement Units By System - Location Current Conditions Endpoint

See [Current Conditions Endpoint Measurement Units By System](#measurement-units-by-system---current-conditions-endpoint)

### Solidity types - Location Current Conditions Endpoint

See [Solidity Types](#solidity-types)

---

## Solidity Types

Solidity types used in the encoded results:

|            Data            | Solidity Type |
| :------------------------: | :-----------: |
|       `countryCode`        |   `bytes2`    |
|       `locationKey`        |   `uint256`   |
|           `name`           |   `string`    |
| `precipitationPast12Hours` |   `uint24`    |
| `precipitationPast24Hours` |   `uint24`    |
|  `precipitationPastHour`   |   `uint24`    |
|    `precipitationType`     |    `uint8`    |
|         `pressure`         |   `uint24`    |
|     `relativeHumidity`     |    `uint8`    |
|       `temperature`        |    `int16`    |
|        `timestamp`         |   `uint256`   |
|         `uvIndex`          |    `uint8`    |
|       `weatherIcon`        |    `uint8`    |
|   `windDirectionDegrees`   |   `uint16`    |
|        `windSpeed`         |   `uint16`    |

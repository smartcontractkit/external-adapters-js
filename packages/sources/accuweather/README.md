# Chainlink External Adapter for AccuWeather

![1.1.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/accuweather/package.json)

[AccuWeather](https://www.accuweather.com/)

[AccuWeather API Docs](http://apidev.accuweather.com/developers/)

[AccuWeather Weather Icons](https://developer.accuweather.com/weather-icons)

### Solidity Types

Solidity types used in the encoded results:
| Data | Solidity Type |
| :------------------------: | :-----------: |
| `countryCode` | `bytes2` |
| `locationKey` | `uint256` |
| `name` | `string` |
| `precipitationPast12Hours` | `uint24` |
| `precipitationPast24Hours` | `uint24` |
| `precipitationPastHour` | `uint24` |
| `precipitationType` | `uint8` |
| `pressure` | `uint24` |
| `relativeHumidity` | `uint8` |
| `temperature` | `int16` |
| `timestamp` | `uint256` |
| `uvIndex` | `uint8` |
| `weatherIcon` | `uint8` |
| `windDirectionDegrees` | `uint16` |
| `windSpeed` | `uint16` |

Base URL http://api.accuweather.com/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                            Description                             |  Type  | Options |            Default            |
| :-------: | :----------: | :----------------------------------------------------------------: | :----: | :-----: | :---------------------------: |
|           | API_ENDPOINT |                                                                    | string |         | `http://api.accuweather.com/` |
|    ✅     |   API_KEY    | An API key that can be obtained from the data provider's dashboard | string |         |                               |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                        Options                                                                        | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [current-conditions](#currentconditions-endpoint), [location-current-conditions](#locationcurrentconditions-endpoint), [location](#location-endpoint) |         |

## CurrentConditions Endpoint

Returns the current weather conditions in a location by its identifier

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

### Solidity types - Location Current Conditions Endpoint

See [Solidity Types](#solidity-types)

`current-conditions` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |                                       Description                                       |  Type   |       Options        | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :-------------------------------------------------------------------------------------: | :-----: | :------------------: | :-----: | :--------: | :------------: |
|    ✅     | locationKey  |         | The location unique ID (to be optained via [location](#get-location-endpoint) endpoint) | number  |                      |         |            |                |
|    ✅     |    units     |         |                          The measurement system for the output                          | string  | `imperial`, `metric` |         |            |                |
|           | encodeResult |         |   When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON   | boolean |   `false`, `true`    | `true`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "current-conditions",
    "locationKey": 2097720,
    "units": "metric",
    "encodeResult": true
  },
  "debug": {
    "cacheKey": "z4rGh+66lDS2V1UIzsfX6ZBcYSM="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [
      {
        "LocalObservationDateTime": "2021-10-22T08:28:00-04:00",
        "EpochTime": 1634905680,
        "WeatherText": "Cloudy",
        "WeatherIcon": 7,
        "HasPrecipitation": false,
        "PrecipitationType": null,
        "IsDayTime": true,
        "Temperature": {
          "Metric": {
            "Value": 10.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperature": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperatureShade": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RelativeHumidity": 84,
        "IndoorRelativeHumidity": 47,
        "DewPoint": {
          "Metric": {
            "Value": 8.4,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 47,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Wind": {
          "Direction": {
            "Degrees": 270,
            "Localized": "W",
            "English": "W"
          },
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "UVIndex": 0,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": {
            "Value": 16.1,
            "Unit": "km",
            "UnitType": 6
          },
          "Imperial": {
            "Value": 10,
            "Unit": "mi",
            "UnitType": 2
          }
        },
        "ObstructionsToVisibility": "",
        "CloudCover": 95,
        "Ceiling": {
          "Metric": {
            "Value": 457,
            "Unit": "m",
            "UnitType": 5
          },
          "Imperial": {
            "Value": 1500,
            "Unit": "ft",
            "UnitType": 0
          }
        },
        "Pressure": {
          "Metric": {
            "Value": 1013.2,
            "Unit": "mb",
            "UnitType": 14
          },
          "Imperial": {
            "Value": 29.92,
            "Unit": "inHg",
            "UnitType": 12
          }
        },
        "PressureTendency": {
          "LocalizedText": "Steady",
          "Code": "S"
        },
        "Past24HourTemperatureDeparture": {
          "Metric": {
            "Value": 1.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 2,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "ApparentTemperature": {
          "Metric": {
            "Value": 13.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 57,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WindChillTemperature": {
          "Metric": {
            "Value": 11.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WetBulbTemperature": {
          "Metric": {
            "Value": 9.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 49,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Precip1hr": {
          "Metric": {
            "Value": 0,
            "Unit": "mm",
            "UnitType": 3
          },
          "Imperial": {
            "Value": 0,
            "Unit": "in",
            "UnitType": 1
          }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "PastHour": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past3Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past6Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past9Hours": {
            "Metric": {
              "Value": 3,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.12,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past12Hours": {
            "Metric": {
              "Value": 7.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.28,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past18Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past24Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 12.2,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 54,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 16.1,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 61,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 22.8,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 73,
                "Unit": "F",
                "UnitType": 18
              }
            }
          }
        },
        "MobileLink": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us",
        "Link": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us"
      }
    ],
    "result": "0x000000000000000000000000000000000000000000000000000000006172ae5000000000000000000000000000000000000000000000000000000000000002d0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018bc8000000000000000000000000000000000000000000000000000000000000006d000000000000000000000000000000000000000000000000000000000000010e00000000000000000000000000000000000000000000000000000000000000b90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007"
  },
  "result": "0x000000000000000000000000000000000000000000000000000000006172ae5000000000000000000000000000000000000000000000000000000000000002d0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018bc8000000000000000000000000000000000000000000000000000000000000006d000000000000000000000000000000000000000000000000000000000000010e00000000000000000000000000000000000000000000000000000000000000b90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "current-conditions",
    "locationKey": 2097720,
    "units": "metric",
    "encodeResult": false
  },
  "debug": {
    "cacheKey": "TUDuSR92POdVDacfK5z+RimwJzU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [
      {
        "LocalObservationDateTime": "2021-10-22T08:28:00-04:00",
        "EpochTime": 1634905680,
        "WeatherText": "Cloudy",
        "WeatherIcon": 7,
        "HasPrecipitation": false,
        "PrecipitationType": null,
        "IsDayTime": true,
        "Temperature": {
          "Metric": {
            "Value": 10.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperature": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperatureShade": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RelativeHumidity": 84,
        "IndoorRelativeHumidity": 47,
        "DewPoint": {
          "Metric": {
            "Value": 8.4,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 47,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Wind": {
          "Direction": {
            "Degrees": 270,
            "Localized": "W",
            "English": "W"
          },
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "UVIndex": 0,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": {
            "Value": 16.1,
            "Unit": "km",
            "UnitType": 6
          },
          "Imperial": {
            "Value": 10,
            "Unit": "mi",
            "UnitType": 2
          }
        },
        "ObstructionsToVisibility": "",
        "CloudCover": 95,
        "Ceiling": {
          "Metric": {
            "Value": 457,
            "Unit": "m",
            "UnitType": 5
          },
          "Imperial": {
            "Value": 1500,
            "Unit": "ft",
            "UnitType": 0
          }
        },
        "Pressure": {
          "Metric": {
            "Value": 1013.2,
            "Unit": "mb",
            "UnitType": 14
          },
          "Imperial": {
            "Value": 29.92,
            "Unit": "inHg",
            "UnitType": 12
          }
        },
        "PressureTendency": {
          "LocalizedText": "Steady",
          "Code": "S"
        },
        "Past24HourTemperatureDeparture": {
          "Metric": {
            "Value": 1.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 2,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "ApparentTemperature": {
          "Metric": {
            "Value": 13.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 57,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WindChillTemperature": {
          "Metric": {
            "Value": 11.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WetBulbTemperature": {
          "Metric": {
            "Value": 9.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 49,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Precip1hr": {
          "Metric": {
            "Value": 0,
            "Unit": "mm",
            "UnitType": 3
          },
          "Imperial": {
            "Value": 0,
            "Unit": "in",
            "UnitType": 1
          }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "PastHour": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past3Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past6Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past9Hours": {
            "Metric": {
              "Value": 3,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.12,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past12Hours": {
            "Metric": {
              "Value": 7.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.28,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past18Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past24Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 12.2,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 54,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 16.1,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 61,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 22.8,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 73,
                "Unit": "F",
                "UnitType": 18
              }
            }
          }
        },
        "MobileLink": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us",
        "Link": "http://www.accuweather.com/en/us/park-forest-village-pa/16803/current-weather/2097720?lang=en-us"
      }
    ],
    "result": {
      "precipitationPast12Hours": 720,
      "precipitationPast24Hours": 1120,
      "precipitationPastHour": 0,
      "precipitationType": 0,
      "pressure": 101320,
      "relativeHumidity": 84,
      "temperature": 109,
      "timestamp": 1634905680,
      "uvIndex": 0,
      "weatherIcon": 7,
      "windDirectionDegrees": 270,
      "windSpeed": 185
    }
  },
  "result": {
    "precipitationPast12Hours": 720,
    "precipitationPast24Hours": 1120,
    "precipitationPastHour": 0,
    "precipitationType": 0,
    "pressure": 101320,
    "relativeHumidity": 84,
    "temperature": 109,
    "timestamp": 1634905680,
    "uvIndex": 0,
    "weatherIcon": 7,
    "windDirectionDegrees": 270,
    "windSpeed": 185
  },
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## LocationCurrentConditions Endpoint

Returns the current weather conditions in a location by its geoposition

### Data Conversions - Location Current Conditions Endpoint

See [Location Endpoint Data Conversions](#data-conversions---location-endpoint) and [Current Conditions Endpoint Data Conversions](#data-conversions---current-conditions-endpoint)

### Endpoint Measurement Units By System - Location Current Conditions Endpoint

See [Current Conditions Endpoint Measurement Units By System](#measurement-units-by-system---current-conditions-endpoint)

### Solidity types - Location Current Conditions Endpoint

See [Solidity Types](#solidity-types)

`location-current-conditions` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |       Aliases       |                                     Description                                      |  Type   |       Options        | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----------------: | :----------------------------------------------------------------------------------: | :-----: | :------------------: | :-----: | :--------: | :------------: |
|    ✅     |     lat      |     `latitude`      |                The latitude (WGS84 standard). Must be `-90` to `90`.                 |         |                      |         |            |                |
|    ✅     |     lon      | `long`, `longitude` |               The longitude (WGS84 standard). Must be `-180` to `180`.               |         |                      |         |            |                |
|    ✅     |    units     |                     |                        The measurement system for the output                         | string  | `imperial`, `metric` |         |            |                |
|           | encodeResult |                     | When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON. | boolean |   `false`, `true`    | `true`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location-current-conditions",
    "lat": 0,
    "lon": 0,
    "units": "metric",
    "encodeResult": true
  },
  "debug": {
    "cacheKey": "xcuAvzNDNq0PfrcBp0ptfZMLgzQ="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "dataLocation": [],
    "result": [false, "0x", "0x"]
  },
  "result": [false, "0x", "0x"],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location-current-conditions",
    "lat": 0,
    "lon": 0,
    "units": "metric",
    "encodeResult": false
  },
  "debug": {
    "cacheKey": "ADPJ3u+jGPKuvSfsLlSSTITQZeE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "dataLocation": [],
    "result": {
      "locationFound": false,
      "locationKey": 0,
      "name": "",
      "countryCode": "0x",
      "precipitationPast12Hours": 0,
      "precipitationPast24Hours": 0,
      "precipitationPastHour": 0,
      "precipitationType": 0,
      "pressure": 0,
      "relativeHumidity": 0,
      "temperature": 0,
      "timestamp": 0,
      "uvIndex": 0,
      "weatherIcon": 0,
      "windDirectionDegrees": 0,
      "windSpeed": 0
    }
  },
  "result": {
    "locationFound": false,
    "locationKey": 0,
    "name": "",
    "countryCode": "0x",
    "precipitationPast12Hours": 0,
    "precipitationPast24Hours": 0,
    "precipitationPastHour": 0,
    "precipitationType": 0,
    "pressure": 0,
    "relativeHumidity": 0,
    "temperature": 0,
    "timestamp": 0,
    "uvIndex": 0,
    "weatherIcon": 0,
    "windDirectionDegrees": 0,
    "windSpeed": 0
  },
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location-current-conditions",
    "lat": "40.78136100040876",
    "lon": "-77.89687509335249",
    "units": "metric",
    "encodeResult": true
  },
  "debug": {
    "cacheKey": "7uQOcGZqTrD+NvijbQHDYFdWGk8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
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
        "Region": {
          "ID": "NAM",
          "LocalizedName": "North America",
          "EnglishName": "North America"
        },
        "Country": {
          "ID": "US",
          "LocalizedName": "United States",
          "EnglishName": "United States"
        },
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
            "Metric": {
              "Value": 427,
              "Unit": "m",
              "UnitType": 5
            },
            "Imperial": {
              "Value": 1400,
              "Unit": "ft",
              "UnitType": 0
            }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          {
            "Level": 2,
            "LocalizedName": "Centre",
            "EnglishName": "Centre"
          }
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
        "LocalObservationDateTime": "2021-10-22T08:28:00-04:00",
        "EpochTime": 1634905680,
        "WeatherText": "Cloudy",
        "WeatherIcon": 7,
        "HasPrecipitation": false,
        "PrecipitationType": null,
        "IsDayTime": true,
        "Temperature": {
          "Metric": {
            "Value": 10.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperature": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperatureShade": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RelativeHumidity": 84,
        "IndoorRelativeHumidity": 47,
        "DewPoint": {
          "Metric": {
            "Value": 8.4,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 47,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Wind": {
          "Direction": {
            "Degrees": 270,
            "Localized": "W",
            "English": "W"
          },
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "UVIndex": 0,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": {
            "Value": 16.1,
            "Unit": "km",
            "UnitType": 6
          },
          "Imperial": {
            "Value": 10,
            "Unit": "mi",
            "UnitType": 2
          }
        },
        "ObstructionsToVisibility": "",
        "CloudCover": 95,
        "Ceiling": {
          "Metric": {
            "Value": 457,
            "Unit": "m",
            "UnitType": 5
          },
          "Imperial": {
            "Value": 1500,
            "Unit": "ft",
            "UnitType": 0
          }
        },
        "Pressure": {
          "Metric": {
            "Value": 1013.2,
            "Unit": "mb",
            "UnitType": 14
          },
          "Imperial": {
            "Value": 29.92,
            "Unit": "inHg",
            "UnitType": 12
          }
        },
        "PressureTendency": {
          "LocalizedText": "Steady",
          "Code": "S"
        },
        "Past24HourTemperatureDeparture": {
          "Metric": {
            "Value": 1.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 2,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "ApparentTemperature": {
          "Metric": {
            "Value": 13.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 57,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WindChillTemperature": {
          "Metric": {
            "Value": 11.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WetBulbTemperature": {
          "Metric": {
            "Value": 9.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 49,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Precip1hr": {
          "Metric": {
            "Value": 0,
            "Unit": "mm",
            "UnitType": 3
          },
          "Imperial": {
            "Value": 0,
            "Unit": "in",
            "UnitType": 1
          }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "PastHour": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past3Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past6Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past9Hours": {
            "Metric": {
              "Value": 3,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.12,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past12Hours": {
            "Metric": {
              "Value": 7.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.28,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past18Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past24Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 12.2,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 54,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 16.1,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 61,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 22.8,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 73,
                "Unit": "F",
                "UnitType": 18
              }
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
      "0x000000000000000000000000000000000000000000000000000000006172ae5000000000000000000000000000000000000000000000000000000000000002d0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018bc8000000000000000000000000000000000000000000000000000000000000006d000000000000000000000000000000000000000000000000000000000000010e00000000000000000000000000000000000000000000000000000000000000b90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007"
    ]
  },
  "result": [
    true,
    "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000002002380000000000000000000000000000000000000000000000000000000000000060555300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000135061726b20466f726573742056696c6c61676500000000000000000000000000",
    "0x000000000000000000000000000000000000000000000000000000006172ae5000000000000000000000000000000000000000000000000000000000000002d0000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018bc8000000000000000000000000000000000000000000000000000000000000006d000000000000000000000000000000000000000000000000000000000000010e00000000000000000000000000000000000000000000000000000000000000b90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007"
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location-current-conditions",
    "lat": "40.78136100040876",
    "lon": "-77.89687509335249",
    "units": "metric",
    "encodeResult": false
  },
  "debug": {
    "cacheKey": "xOXFR/BQRASOBKiu/URXHLhSvHc="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
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
        "Region": {
          "ID": "NAM",
          "LocalizedName": "North America",
          "EnglishName": "North America"
        },
        "Country": {
          "ID": "US",
          "LocalizedName": "United States",
          "EnglishName": "United States"
        },
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
            "Metric": {
              "Value": 427,
              "Unit": "m",
              "UnitType": 5
            },
            "Imperial": {
              "Value": 1400,
              "Unit": "ft",
              "UnitType": 0
            }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          {
            "Level": 2,
            "LocalizedName": "Centre",
            "EnglishName": "Centre"
          }
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
        "LocalObservationDateTime": "2021-10-22T08:28:00-04:00",
        "EpochTime": 1634905680,
        "WeatherText": "Cloudy",
        "WeatherIcon": 7,
        "HasPrecipitation": false,
        "PrecipitationType": null,
        "IsDayTime": true,
        "Temperature": {
          "Metric": {
            "Value": 10.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperature": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RealFeelTemperatureShade": {
          "Metric": {
            "Value": 7.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 46,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "RelativeHumidity": 84,
        "IndoorRelativeHumidity": 47,
        "DewPoint": {
          "Metric": {
            "Value": 8.4,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 47,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Wind": {
          "Direction": {
            "Degrees": 270,
            "Localized": "W",
            "English": "W"
          },
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "WindGust": {
          "Speed": {
            "Metric": {
              "Value": 18.5,
              "Unit": "km/h",
              "UnitType": 7
            },
            "Imperial": {
              "Value": 11.5,
              "Unit": "mi/h",
              "UnitType": 9
            }
          }
        },
        "UVIndex": 0,
        "UVIndexText": "Low",
        "Visibility": {
          "Metric": {
            "Value": 16.1,
            "Unit": "km",
            "UnitType": 6
          },
          "Imperial": {
            "Value": 10,
            "Unit": "mi",
            "UnitType": 2
          }
        },
        "ObstructionsToVisibility": "",
        "CloudCover": 95,
        "Ceiling": {
          "Metric": {
            "Value": 457,
            "Unit": "m",
            "UnitType": 5
          },
          "Imperial": {
            "Value": 1500,
            "Unit": "ft",
            "UnitType": 0
          }
        },
        "Pressure": {
          "Metric": {
            "Value": 1013.2,
            "Unit": "mb",
            "UnitType": 14
          },
          "Imperial": {
            "Value": 29.92,
            "Unit": "inHg",
            "UnitType": 12
          }
        },
        "PressureTendency": {
          "LocalizedText": "Steady",
          "Code": "S"
        },
        "Past24HourTemperatureDeparture": {
          "Metric": {
            "Value": 1.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 2,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "ApparentTemperature": {
          "Metric": {
            "Value": 13.9,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 57,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WindChillTemperature": {
          "Metric": {
            "Value": 11.1,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 52,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "WetBulbTemperature": {
          "Metric": {
            "Value": 9.7,
            "Unit": "C",
            "UnitType": 17
          },
          "Imperial": {
            "Value": 49,
            "Unit": "F",
            "UnitType": 18
          }
        },
        "Precip1hr": {
          "Metric": {
            "Value": 0,
            "Unit": "mm",
            "UnitType": 3
          },
          "Imperial": {
            "Value": 0,
            "Unit": "in",
            "UnitType": 1
          }
        },
        "PrecipitationSummary": {
          "Precipitation": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "PastHour": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past3Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past6Hours": {
            "Metric": {
              "Value": 0,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past9Hours": {
            "Metric": {
              "Value": 3,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.12,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past12Hours": {
            "Metric": {
              "Value": 7.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.28,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past18Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          },
          "Past24Hours": {
            "Metric": {
              "Value": 11.2,
              "Unit": "mm",
              "UnitType": 3
            },
            "Imperial": {
              "Value": 0.44,
              "Unit": "in",
              "UnitType": 1
            }
          }
        },
        "TemperatureSummary": {
          "Past6HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 12.2,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 54,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past12HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 16.1,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 61,
                "Unit": "F",
                "UnitType": 18
              }
            }
          },
          "Past24HourRange": {
            "Minimum": {
              "Metric": {
                "Value": 10,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 50,
                "Unit": "F",
                "UnitType": 18
              }
            },
            "Maximum": {
              "Metric": {
                "Value": 22.8,
                "Unit": "C",
                "UnitType": 17
              },
              "Imperial": {
                "Value": 73,
                "Unit": "F",
                "UnitType": 18
              }
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
      "precipitationPast12Hours": 720,
      "precipitationPast24Hours": 1120,
      "precipitationPastHour": 0,
      "precipitationType": 0,
      "pressure": 101320,
      "relativeHumidity": 84,
      "temperature": 109,
      "timestamp": 1634905680,
      "uvIndex": 0,
      "weatherIcon": 7,
      "windDirectionDegrees": 270,
      "windSpeed": 185
    }
  },
  "result": {
    "locationFound": true,
    "locationKey": 2097720,
    "name": "Park Forest Village",
    "countryCode": "0x5553",
    "precipitationPast12Hours": 720,
    "precipitationPast24Hours": 1120,
    "precipitationPastHour": 0,
    "precipitationType": 0,
    "pressure": 101320,
    "relativeHumidity": 84,
    "temperature": 109,
    "timestamp": 1634905680,
    "uvIndex": 0,
    "weatherIcon": 7,
    "windDirectionDegrees": 270,
    "windSpeed": 185
  },
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## Location Endpoint

Returns location information by geoposition

### Data Conversions - Location Endpoint

**countryCode**

ISO 3166 alpha-2 codes encoded as `bytes2`. See [list of ISO-3166 country codes](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes)

### Solidity types - Location Current Conditions Endpoint

See [Solidity Types](#solidity-types)

`location` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     |       Aliases       |                                     Description                                      |  Type   |     Options     | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----------------: | :----------------------------------------------------------------------------------: | :-----: | :-------------: | :-----: | :--------: | :------------: |
|    ✅     |     lat      |     `latitude`      |                The latitude (WGS84 standard). Must be `-90` to `90`.                 |         |                 |         |            |                |
|    ✅     |     lon      | `long`, `longitude` |               The longitude (WGS84 standard). Must be `-180` to `180`.               |         |                 |         |            |                |
|           | encodeResult |                     | When `true` the result is ABI encoded (as tuple). When `false` the result is a JSON. | boolean | `false`, `true` | `true`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location",
    "lat": 0,
    "lon": 0,
    "encodeResult": true
  },
  "debug": {
    "cacheKey": "KmJFuZYlDK9vqVkoSudfdqtt400="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [],
    "result": [false, "0x"]
  },
  "result": [false, "0x"],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location",
    "lat": 0,
    "lon": 0,
    "encodeResult": false
  },
  "debug": {
    "cacheKey": "jUl9AlhnwseNE32QT6vc4SP/X9M="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": [],
    "result": {
      "locationFound": false,
      "locationKey": 0,
      "name": "",
      "countryCode": "0x"
    }
  },
  "result": {
    "locationFound": false,
    "locationKey": 0,
    "name": "",
    "countryCode": "0x"
  },
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location",
    "lat": "40.78136100040876",
    "lon": "-77.89687509335249",
    "encodeResult": true
  },
  "debug": {
    "cacheKey": "Sek20ZkkZSn2/PM3bMPBtQi7K20="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
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
        "Region": {
          "ID": "NAM",
          "LocalizedName": "North America",
          "EnglishName": "North America"
        },
        "Country": {
          "ID": "US",
          "LocalizedName": "United States",
          "EnglishName": "United States"
        },
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
            "Metric": {
              "Value": 427,
              "Unit": "m",
              "UnitType": 5
            },
            "Imperial": {
              "Value": 1400,
              "Unit": "ft",
              "UnitType": 0
            }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          {
            "Level": 2,
            "LocalizedName": "Centre",
            "EnglishName": "Centre"
          }
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
  },
  "result": [
    true,
    "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000002002380000000000000000000000000000000000000000000000000000000000000060555300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000135061726b20466f726573742056696c6c61676500000000000000000000000000"
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "location",
    "lat": "40.78136100040876",
    "lon": "-77.89687509335249",
    "encodeResult": false
  },
  "debug": {
    "cacheKey": "k5UOHiu6zrngyq7s/5ovZPfJXsg="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
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
        "Region": {
          "ID": "NAM",
          "LocalizedName": "North America",
          "EnglishName": "North America"
        },
        "Country": {
          "ID": "US",
          "LocalizedName": "United States",
          "EnglishName": "United States"
        },
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
            "Metric": {
              "Value": 427,
              "Unit": "m",
              "UnitType": 5
            },
            "Imperial": {
              "Value": 1400,
              "Unit": "ft",
              "UnitType": 0
            }
          }
        },
        "IsAlias": false,
        "SupplementalAdminAreas": [
          {
            "Level": 2,
            "LocalizedName": "Centre",
            "EnglishName": "Centre"
          }
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
  },
  "result": {
    "locationFound": true,
    "locationKey": 2097720,
    "name": "Park Forest Village",
    "countryCode": "0x5553"
  },
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License

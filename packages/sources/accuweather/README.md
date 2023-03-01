# Chainlink External Adapter for AccuWeather

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/accuweather/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

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

There are no examples for this endpoint.

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

There are no examples for this endpoint.

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

There are no examples for this endpoint.

---

MIT License

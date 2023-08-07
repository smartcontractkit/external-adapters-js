# Chainlink Google weather Composite Adapter

An adapter used to query weather data from Google BigQuery. The adapter allows you to fetch the `AVG`, `SUM`, `MIN` or
`MAX` of selected column in the `noaa_gsod` weather database in Google BigQuery within a given date range.

## Configuration

This adapter takes the configuration variables from the [Google BigQuery adapter](../../sources/google-bigquery/README.md).

In addition, it takes the following environment variables:

| Required? |   Name    |           Description           | Options |           Defaults to            |
| :-------: | :-------: | :-----------------------------: | :-----: | :------------------------------: |
|           | `DATASET` | Which BigQuery dataset to query |         | `bigquery-public-data.noaa_gsod` |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Example run

To run the adapter locally, assuming you have set up default credentials with the `gcloud` CLI tool:

```bash
cd packages/composites/google-weather
yarn && yarn build
env PROJECT_ID=gcp-pdp-weather-dev yarn start
```

### Input Params

| Required? |    Name    |                                Description                                 |              Options              | Defaults to |
| :-------: | :--------: | :------------------------------------------------------------------------: | :-------------------------------: | :---------: |
|    ✅     | `geoJson`  |            A GeoJSON object containing the geographies to query            |                                   |             |
|    ✅     | `dateFrom` |         The date to query data from (inclusive) in ISO 8601 format         |                                   |             |
|    ✅     |  `dateTo`  |          The date to query data to (inclusive) in ISO 8601 format          |                                   |             |
|    ✅     |  `method`  |                  Which method to use to aggregate data in                  |    `AVG`, `SUM`, `MIN`, `MAX`     |             |
|    ✅     |  `column`  |                      Which column to fetch data from                       | [Data available](#data-available) |             |
|           |  `units`   | What unit system to return the result in ([conversions](#unit-conversion)) |       `imperial`, `metric`        | `imperial`  |

### GeoJSON data

This adapter uses GeoJSON to determine the station location in the query. An entire, valid, GeoJSON object must be
included in the request, however the adapter will only support feature types Polygon and Point. A request must include
at least one feature, but can support multiple features, even of different types. Generating a GeoJSON object can
easily be done without prior knowledge using https://geojson.io/.

#### Polygon

Providing a Polygon will include observations from all stations located within the Polygon coordinates. If there are no
stations with data within the coordinates, no data will be returned.

The query will fetch all stations within the Polygon, regardless if the stations are active or not. This means it could
fetch observations from stations which are not active for the entire duration of the time range.

#### Point

Providing a Point will include observations from the station located geographically closest to the Point coordinates
that was active during the entire duration of the time range.

## Data available

### Mean

Mean columns report the mean of that type on the specified day.

- temp - Mean temperature for the day in degrees Fahrenheit to tenths
- dewp - Mean dew point for the day in degrees Fahrenheit to tenths
- slp - Mean sea level pressure for the day in millibars to tenths
- stp - Mean station pressure for the day in millibars to tenths
- visib - Mean visibility for the day in miles to tenths
- wdsp - Mean wind speed for the day in knots to tenths

#### Count

- count_temp - Number of observations used in calculating mean temperature
- count_dewp - Number of observations used in calculating mean dew point
- count_slp - Number of observations used in calculating mean sea level pressure
- count_stp - Number of observations used in calculating mean station pressure
- count_visib - Number of observations used in calculating mean visibility
- count_wdsp - Number of observations used in calculating mean wind speed

### Extremes

- max - Maximum temperature reported during the day in Fahrenheit to tenths--time of max temp report varies by country
  and region, so this will sometimes not be the max for the calendar day.
- min - Minimum temperature reported during the day in Fahrenheit to tenths--time of min temp report varies by country
  and region, so this will sometimes not be the min for the calendar day.

### Binary

Binary columns report if there was an occurrence of that type on the specified day.

- fog
- rain_drizzle
- snow_ice_pellets
- hail
- thunder
- tornado_funnel_cloud

### Total

- prcp - Total precipitation (rain and/or melted snow) reported during the day in inches and hundredths; will usually not end with the midnight observation--i.e., may include latter part of previous day.
- sndp - Snow depth in inches to tenths--last report for the day if reported more than once.

## Unit conversion

The adapter supports converting units from imperial to metric.

| Imperial | Metric |
| -------- | ------ |
| F        | C      |
| bar      | hPa    |
| inches   | mm     |
| miles    | m      |
| knots    | m/s    |

## Examples

### Average of daily average temperature in Bergen, Norway

To get the average daily mean temperature per day, we can get use all stations within a geographical area. For this
reason we provide a Polygon in the GeoJSON object.

#### Input

```json
{
  "id": "1",
  "data": {
    "geoJson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [5.2796173095703125, 60.40673218057448],
                [5.164947509765625, 60.383665698324926],
                [5.17730712890625, 60.211509994185604],
                [5.401153564453124, 60.27694067255946],
                [5.6188201904296875, 60.436558668419984],
                [5.526123046875, 60.42842688461354],
                [5.3002166748046875, 60.5387098888639],
                [5.238418579101562, 60.4951151199491],
                [5.2796173095703125, 60.40673218057448]
              ]
            ]
          }
        }
      ]
    },
    "dateFrom": "2021-04-01",
    "dateTo": "2021-05-01",
    "method": "AVG",
    "column": "temp"
  }
}
```

#### Output

```json
{
  "jobRunID": "1",
  "result": 41.52741935483871,
  "statusCode": 200,
  "data": {
    "result": 41.52741935483871
  }
}
```

This means that the average of daily mean temperature in our area and time range was 41.5 degrees fahrenheit.

### Total rainfall in Bergen, Norway

To get the total rainfall, we must use a single station in order to not get duplicate data. For this reason we use a
Point in the GeoJSON object.

#### Input

```json
{
  "id": "1",
  "data": {
    "geoJson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": { "type": "Point", "coordinates": [5.325622558593749, 60.3887552979679] }
        }
      ]
    },
    "dateFrom": "2021-04-01",
    "dateTo": "2021-05-01",
    "method": "SUM",
    "column": "prcp"
  }
}
```

#### Output

```json
{
  "jobRunID": "1",
  "result": 3.4300000000000006,
  "statusCode": 200,
  "data": {
    "result": 3.4300000000000006
  }
}
```

This means there was 3.43 inches of rain- or snowfall in the time range we had defined.

### Occurrence of hail in Bergen, Norway

We are looking to know if there was hail in Bergen within a date range. We don't care about the exact number of days
with hail, but we'd rather know if there was hail or not. What we're looking for is if the result is 0 or not 0.
Because of this we can sum up the number of hail occurrences per day for a Polygon.

#### Input

```json
{
  "id": "1",
  "data": {
    "geoJson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [5.2796173095703125, 60.40673218057448],
                [5.164947509765625, 60.383665698324926],
                [5.17730712890625, 60.211509994185604],
                [5.401153564453124, 60.27694067255946],
                [5.6188201904296875, 60.436558668419984],
                [5.526123046875, 60.42842688461354],
                [5.3002166748046875, 60.5387098888639],
                [5.238418579101562, 60.4951151199491],
                [5.2796173095703125, 60.40673218057448]
              ]
            ]
          }
        }
      ]
    },
    "dateFrom": "2021-04-01",
    "dateTo": "2021-05-01",
    "method": "SUM",
    "column": "hail"
  }
}
```

#### Output

```json
{
  "jobRunID": "1",
  "result": 2,
  "statusCode": 200,
  "data": {
    "result": 2
  }
}
```

Since the result is >0, it means there was at least one day with hail in our area.

# Chainlink Google weather Composite Adapter

A demo adapter to query weather data from Google BigQuery. The adapter allows you to fetch the SUM or AVG of any column
in the `NOAA_GFS0P25` weather database in Google BigQuery within a given date range. The query will fetch data for the
point that is closest to the coordinates given in the request.

## Configuration

This adapter takes the configuration variables from the [Google BigQuery adapter](../../sources/google-bigquery/README.md).

In addition, it takes the following environment variables:

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|           | `TABLE` | Which BigQuery table to query |         | `gcp-pdp-weather-dev.geo_weather.NOAA_GFS0P25` |

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

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `lat`  |   The latitude of the position to fetch data for    |  | |
|    ✅     | `long`  |   The longitude of the position to fetch data for    |  | |
|    ✅     | `dateFrom`  |   The date to query data from (inclusive)    |  | |
|    ✅     | `dateTo`  |   The date to query data to (exclusive)    |  | |
|    ✅     | `method`  | Which method to use to aggregate data in | `AVG`, `SUM` | |
|    ✅     | `field`  | Which column to fetch data from | `temperature_2m_above_ground`, `specific_humidity_2m_above_ground`, `relative_humidity_2m_above_ground`, `u_component_of_wind_10m_above_ground`, `v_component_of_wind_10m_above_ground`, `total_precipitation_surface`, `precipitable_water_entire_atmosphere`, `total_cloud_cover_entire_atmosphere`, `downward_shortwave_radiation_flux` | |

## Examples

### Average temperature

Input:

```json
{
  "id": "1",
  "data": {
    "lat": 19,
    "long": 80.75,
    "dateFrom": "2021-04-01",
    "dateTo": "2021-05-01",
    "method": "AVG",
    "column": "temperature_2m_above_ground"
  }
}
```

Output:

```json
{
  "jobRunID": "1",
  "result": -3.9128700000000003,
  "statusCode": 200,
  "data": {
    "result": -3.9128700000000003
  }
}
```

### Total rainfall

Input:

```json
{
  "id": "1",
  "data": {
    "lat": 19,
    "long": 80.75,
    "dateFrom": "2021-04-01",
    "dateTo": "2021-05-01",
    "method": "SUM",
    "column": "total_precipitation_surface"
  }
}
```

Output:

```json
{
  "jobRunID": "1",
  "result": 3.875,
  "statusCode": 200,
  "data": {
    "result": 3.875
  }
}
```

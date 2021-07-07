import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import * as BigQuery from '@chainlink/google-bigquery-adapter'
import { Config, makeConfig } from './config'
import * as gjv from 'geojson-validation'

export interface Polygon {
  type: "Polygon"
  coordinates: [number, number][][]
}

export type Point = {
  type: "Point"
  coordinates: [number, number]
}

export interface Feature {
  type: string
  geometry: Polygon | Point
}

export interface GeoJSON {
  type: string
  features: Feature[]
}

const customParams = {
  geoJson: true,
  pointInPolygon: false,
  dateFrom: true,
  dateTo: true,
  method: true,
  column: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  let geoJson = validator.validated.data.geoJson
  if (typeof geoJson === 'string') {
    geoJson = JSON.parse(geoJson)
  }

  const dateFrom = validator.validated.data.dateFrom
  const dateTo = validator.validated.data.dateTo
  const method = validator.validated.data.method
  const column = validator.validated.data.column

  if (!gjv.valid(geoJson)) {
    throw new Error('Provided GeoJSON data is not valid')
  }

  const queryBuilder = new QueryBuilder(geoJson, dateFrom, dateTo, method, column, config.dataset)

  const bigQuery = BigQuery.makeExecute(BigQuery.makeConfig())
  const response = await bigQuery({ id: jobRunID, data: queryBuilder.toQuery() })
  const result = Requester.validateResultNumber(response.result, [0, "result"])
  return Requester.success(jobRunID, { data: { result } })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

type Method = 'SUM' | 'AVG' | 'MIN' | 'MAX'

class QueryBuilder {
  private readonly geoJson: GeoJSON
  private readonly dateFrom: Date
  private readonly dateTo: Date
  private readonly method: Method
  private readonly column: string
  private readonly dataset: string

  constructor(geoJson: GeoJSON, dateFrom: string, dateTo: string, method: Method, column: string, dataset: string) {
    this.geoJson = geoJson
    this.dateFrom = new Date(dateFrom)
    this.dateTo = new Date(dateTo)
    this.method = method
    this.column = column
    this.dataset = dataset
  }

  private modifiedColumn() {
    switch (this.column) {
      case 'fog':
      case 'rain_drizzle':
      case 'snow_ice_pellets':
      case 'hail':
      case 'tornado_funnel_cloud':
      case 'thunder': {
        return `cast(${this.column} as int64)`
      }
    }

    return this.column
  }

  private select() {
    switch (this.method) {
      case 'AVG':
        return `AVG(${this.modifiedColumn()})`
      case 'SUM':
        return `SUM(${this.modifiedColumn()})`
      case 'MIN':
        return `MIN(${this.modifiedColumn()})`
      case 'MAX':
        return `MAX(${this.modifiedColumn()})`
      default:
        throw new Error(`Unrecognized method: "${this.method}"`)
    }
  }

  private from() {
    const diff = this.dateTo.getFullYear() - this.dateFrom.getFullYear()
    if (diff === 0) {
      console.log('diff==0')
      return `SELECT \`stn\`, \`${this.column}\`, \`date\` FROM \`${this.dataset}.gsod${this.dateTo.getFullYear()}\``
    }

    console.log('diff', diff)

    const years = new Array(diff + 1).fill(0)
      .map((_, i) => `SELECT \`stn\`, \`${this.column}\`, \`date\` FROM \`${this.dataset}.gsod${this.dateTo.getFullYear()-i}\``)

    return years.join('\nUNION ALL\n')
  }

  // SELECT
  //     *
  //   FROM
  //     `bigquery-public-data.noaa_gsod.stations`
  //   WHERE
  //     (ST_CONTAINS( ST_GEOGFROMGEOJSON('{ "type": "Polygon", "coordinates": [ [ [ 5.2947235107421875, 60.53398151134199 ], [ 5.2342987060546875, 60.49207143471124 ], [ 5.276870727539062, 60.40571488624096 ], [ 5.2397918701171875, 60.40503667234999 ], [ 5.167694091796875, 60.38027218998218 ], [ 5.167694091796875, 60.340541868001196 ], [ 5.2095794677734375, 60.32286840124156 ], [ 5.3249359130859375, 60.32150850738404 ], [ 5.427932739257812, 60.34801622338117 ], [ 5.4636383056640625, 60.366355109034046 ], [ 5.46295166015625, 60.42436022980665 ], [ 5.4437255859375, 60.471772897267975 ], [ 5.367507934570312, 60.51776468674299 ], [ 5.2947235107421875, 60.53398151134199 ] ] ] }'),
  //       ST_GEOGPOINT(lon,
  //         lat) )
  //     AND PARSE_DATE("%Y%m%d",
  //       `begin`) <= DATE(2020, 12, 01)
  //     AND PARSE_DATE("%Y%m%d",
  //       `end`) >= DATE(2021, 01, 30)
  //     ) OR (
  //         ST_EQUALS(
  //             ST_GEOGPOINT(lon, lat),
  //             (
  //                 SELECT ST_GEOGPOINT(lon, lat)
  //                 FROM `bigquery-public-data.noaa_gsod.stations`
  //                 WHERE PARSE_DATE("%Y%m%d", `begin`) <= DATE(2020, 12, 01)
  //                 AND PARSE_DATE("%Y%m%d", `end`) >= DATE(2021, 01, 30)
  //                 ORDER BY ST_DISTANCE(
  //                     ST_GEOGFROMGEOJSON('{ "type": "Point", "coordinates": [ 5.325965881347656, 60.3945225493865 ] }'),
  //                     ST_GEOGPOINT(lon, lat)
  //                 )
  //                 LIMIT 1
  //             )
  //         )
  //     )
  // LIMIT 10;

  private geoJsonQuery(): string[] {
    // Note: this is only efficient for when you have one or more Polygons with an optional Point.
    // When only using a single Point, this will cause an extra, unnecessary, lookup query.
    // This is done in order to make it easier to also query stations within Polygon(s).
    return this.geoJson.features.map((ft, i) => {
      // console.log(ft.type)
      switch (ft.geometry.type) {
        case "Polygon": {
          return `ST_CONTAINS(ST_GEOGFROMGEOJSON(@geoJson${i}), stations.geog)`
        }
        case "Point": {
          return [
              'usaf = ',
              '(SELECT usaf FROM stations AS sts',
              'WHERE PARSE_DATE("%Y%m%d", sts.`begin`) <= DATE(@dateFrom)',
              'AND PARSE_DATE("%Y%m%d", sts.`end`) >= DATE(@dateTo)',
              `ORDER BY ST_DISTANCE(ST_GEOGFROMGEOJSON(@geoJson${i}), sts.geog) LIMIT 1)`
            ].join('\n')
        }
        default: {
          return undefined
        }
      }
    }).filter(line => !!line) as string[]
  }

  private geoJsonParams(): { [key: string]: string } {
    const map: { [key: string]: string } = {}

    this.geoJson.features.forEach((ft, i) => {
      map[`geoJson${i}`] = JSON.stringify(ft.geometry)
    })

    return map
  }

  private static formatDate(date: Date): string {
    const d = new Date(date)
    const year = d.getFullYear()
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()

    if (month.length < 2)
      month = '0' + month
    if (day.length < 2)
      day = '0' + day

    return [year, month, day].join('-')
  }

  private columnFiltering(): string[] {
    switch (this.column) {
      case 'prcp': {
        // TODO: Causes issues if method is AVG, as
        // this could have been 0 instead.
        return ['AND prcp != 99.99']
      }
      case 'visib':
      case 'wdsp': {
        return [`AND ${this.column} != 999.9`]
      }
      case 'dewp':
      case 'slp':
      case 'stp':
      case 'max':
      case 'min':
      case 'temp': {
        return [`AND ${this.column} != 9999.9`]
      }
      case 'fog':
      case 'rain_drizzle':
      case 'snow_ice_pellets':
      case 'hail':
      case 'tornado_funnel_cloud':
      case 'thunder': {
        return [`AND (${this.column} = "0" OR ${this.column} = "1")`]
      }
    }

    return []
  }

  public toQuery(): { query: string, params: { [key: string]: string | number }} {
    return {
      query: [
        // Stations
        'WITH',
        'stations AS (',
        `  SELECT usaf, ST_GEOGPOINT(lon, lat) AS geog, \`begin\`, \`end\` FROM \`${this.dataset}.stations\` AS stations`,
        ')',

        // Main query
        `SELECT ${this.select()} AS result`,
        `FROM (${this.from()})`,
        'WHERE stn IN (SELECT usaf FROM stations',
        `WHERE (${this.geoJsonQuery().join(`)\nOR\n(`)}))`,
        'AND date BETWEEN @dateFrom AND @dateTo',
        ...this.columnFiltering()
      ].join('\n') + ';',
      params: {
        ...this.geoJsonParams(),
        dateFrom: QueryBuilder.formatDate(this.dateFrom),
        dateTo: QueryBuilder.formatDate(this.dateTo)
      }
    }
  }
}

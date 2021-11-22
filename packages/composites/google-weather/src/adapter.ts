import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import * as BigQuery from '@chainlink/google-bigquery-adapter'
import { Config, makeConfig } from './config'
import * as gjv from 'geojson-validation'
import convert from 'convert-units'

export interface Polygon {
  type: 'Polygon'
  coordinates: [number, number][][]
}

export type Point = {
  type: 'Point'
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
  units: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
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
  const column = validator.validated.data.column.toLowerCase()
  const units = validator.validated.data.units || 'imperial'

  if (!gjv.valid(geoJson)) {
    throw new Error('Provided GeoJSON data is not valid')
  }

  const queryBuilder = new QueryBuilder(geoJson, dateFrom, dateTo, method, column, config.dataset)

  const bigQuery = BigQuery.makeExecute(BigQuery.makeConfig())
  const response = await bigQuery({ id: jobRunID, data: queryBuilder.toQuery() }, context)
  const imperialValue = Requester.validateResultNumber(response.result, [0, 'result'])
  const result = convertUnits(column, imperialValue, units)
  return Requester.success(jobRunID, { data: { result } })
}

const convertUnits = (column: string, value: number, units: string): number => {
  if (units !== 'metric') return value

  const conv = convert(value)
  switch (column) {
    case 'temp':
    case 'dewp':
    case 'max':
    case 'min':
      return conv.from('F').to('C')
    case 'slp':
    case 'stp':
      return conv.from('bar').to('hPa')
    case 'visib':
      return conv.from('mi').to('m')
    case 'wdsp':
    case 'gust':
    case 'mxpsd':
      return conv.from('knot').to('m/s')
    case 'prcp':
    case 'sndp':
      return conv.from('in').to('mm')
    default:
      return value
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}

type Method = 'SUM' | 'AVG' | 'MIN' | 'MAX'

class QueryBuilder {
  private readonly geoJson: GeoJSON
  private readonly dateFrom: Date
  private readonly dateTo: Date
  private readonly method: Method
  private readonly column: string
  private readonly dataset: string

  constructor(
    geoJson: GeoJSON,
    dateFrom: string,
    dateTo: string,
    method: Method,
    column: string,
    dataset: string,
  ) {
    this.geoJson = geoJson
    this.dateFrom = new Date(dateFrom)
    this.dateTo = new Date(dateTo)
    this.method = method
    this.column = column.replace(/\W/g, '')
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
    const diff = this.dateTo.getUTCFullYear() - this.dateFrom.getUTCFullYear()
    if (diff === 0) {
      return `SELECT \`stn\`, \`${this.column}\`, \`date\` FROM \`${
        this.dataset
      }.gsod${this.dateTo.getUTCFullYear()}\``
    }

    const years = new Array(diff + 1)
      .fill(0)
      .map(
        (_, i) =>
          `SELECT \`stn\`, \`${this.column}\`, \`date\` FROM \`${this.dataset}.gsod${
            this.dateTo.getUTCFullYear() - i
          }\``,
      )

    return years.join('\nUNION ALL\n')
  }

  private geoJsonQuery(): string[] {
    return this.geoJson.features
      .map((ft, i) => {
        switch (ft.geometry.type) {
          case 'Polygon': {
            return `ST_CONTAINS(ST_GEOGFROMGEOJSON(@geoJson${i}), stations.geog)`
          }
          case 'Point': {
            return [
              'usaf = ',
              '(SELECT usaf FROM stations AS sts',
              'WHERE PARSE_DATE("%Y%m%d", sts.`begin`) <= DATE(@dateFrom)',
              'AND PARSE_DATE("%Y%m%d", sts.`end`) >= DATE(@dateTo)',
              `ORDER BY ST_DISTANCE(ST_GEOGFROMGEOJSON(@geoJson${i}), sts.geog) LIMIT 1)`,
            ].join('\n')
          }
          default: {
            return undefined
          }
        }
      })
      .filter((line) => !!line) as string[]
  }

  private geoJsonParams(): { [key: string]: string } {
    const map: { [key: string]: string } = {}

    this.geoJson.features.forEach((ft, i) => {
      map[`geoJson${i}`] = JSON.stringify(ft.geometry)
    })

    return map
  }

  private static formatDate(date: Date): string {
    const year = date.getUTCFullYear()
    let month = '' + (date.getUTCMonth() + 1)
    let day = '' + date.getUTCDate()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

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

  public toQuery(): { query: string; params: { [key: string]: string | number } } {
    return {
      query:
        [
          // Stations
          'WITH',
          'stations AS (',
          `  SELECT usaf, ST_GEOGPOINT(lon, lat) AS geog, \`begin\`, \`end\` FROM \`${this.dataset}.stations\``,
          ')',

          // Main query
          `SELECT ${this.select()} AS result`,
          `FROM (${this.from()})`,
          'WHERE stn IN (SELECT usaf FROM stations',
          `WHERE (${this.geoJsonQuery().join(`)\nOR\n(`)}))`,
          'AND date BETWEEN @dateFrom AND @dateTo',
          ...this.columnFiltering(),
        ].join('\n') + ';',
      params: {
        ...this.geoJsonParams(),
        dateFrom: QueryBuilder.formatDate(this.dateFrom),
        dateTo: QueryBuilder.formatDate(this.dateTo),
      },
    }
  }
}

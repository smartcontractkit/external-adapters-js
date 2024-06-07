import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { BaseEndpointTypes, inputParameters } from '../endpoint/csv'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { sleep, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { parse } from 'csv-parse/sync'

const logger = makeLogger('S3PollerTransport')

export type TransportTypes = BaseEndpointTypes
type RequestParams = typeof inputParameters.validated

export class S3PollerTransport extends SubscriptionTransport<TransportTypes> {
  settings!: TransportTypes['Settings']
  requester!: Requester
  endpointName!: string
  s3Client!: S3Client

  async initialize(
    dependencies: TransportDependencies<TransportTypes>,
    adapterSettings: TransportTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.settings = adapterSettings
    this.requester = dependencies.requester
    this.endpointName = endpointName
    this.s3Client = new S3Client({})
  }

  async backgroundHandler(context: EndpointContext<TransportTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }
    }
    await this.responseCache.write(this.name, [{ params: param, response }])
  }

  async _handleRequest(param: RequestParams): Promise<AdapterResponse<TransportTypes['Response']>> {
    const { bucket, key, row, column } = param
    const providerDataRequestedUnixMs = Date.now()

    const csvFileAsStr = await this.getFileFromS3(bucket, key)
    const answer = this.parseCSV(csvFileAsStr, row, column)

    return {
      result: answer,
      data: {
        result: answer,
      },
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  async getFileFromS3(bucket: string, key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const response = await this.s3Client.send(command)
    if (!response.Body) {
      throw new Error('S3 response is missing a body')
    }
    const csvContentsStr = await response.Body.transformToString()
    return csvContentsStr
  }

  // A to Z, AA to AZ, BA to BZ, AAA to AAZ, etc.
  columnToIndex(column: string): number {
    const length = column.length
    let index = 0
    for (let i = 0; i < length; i++) {
      index += column.charCodeAt(i) - 'A'.charCodeAt(0) + (length - i - 1) * 26
    }
    console.log(`column = ${column}, index = ${index}`)
    return index
  }

  parseCSV(csvFileAsStr: string, row: string, column: string): number {
    //  0-indexed whereas csv rows are 1 indexed
    const rowIndex = Number(row) - 1
    const columnIndex = this.columnToIndex(column.toUpperCase())

    const parser = parse(csvFileAsStr, { columns: false })
    console.log(parser)
    if (parser.length < rowIndex) {
      throw new Error(`CSV file contains less than ${row} rows`)
    }
    if (parser[rowIndex].length < columnIndex) {
      throw new Error(`CSV row ${row} contains less than ${column} columns`)
    }

    const value = parser[rowIndex][columnIndex]
    return value
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new S3PollerTransport()

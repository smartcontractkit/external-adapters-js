import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { BaseEndpointTypes, inputParameters } from '../endpoint/csv'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { sleep, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { S3Client } from '@aws-sdk/client-s3'
import { getFileFromS3 } from './utils'
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
    const { bucket, key, headerRow, resultField, matcherField, matcherValue } = param
    const providerDataRequestedUnixMs = Date.now()
    const csvFileAsStr = await getFileFromS3(this.s3Client, bucket, key)
    const answer = this.parseCSV(csvFileAsStr, headerRow, matcherField, matcherValue, resultField)

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

  // csvFileAsStr: CSV file as string as received from S3
  // headerRow: 1-indexed row of the CSV file to use as the header row
  // matcherField: field to match with `matcherValue` to find the answer row
  // matcherValue: value of field `matcherField` used to find the answer row
  // resultField: header field containing the answer in matcher row
  parseCSV(
    csvFileAsStr: string,
    headerRow: number,
    matcherField: string,
    matcherValue: string,
    resultField: string,
  ): number {
    // from_line is 1-indexed
    // columns: true sets first line as object fields rather than 2d arrays
    const parser = parse(csvFileAsStr, { columns: true, from_line: headerRow })
    if (!(resultField in parser[0])) {
      throw new Error(`CSV file does not contain column header ${resultField}`)
    }
    if (!(matcherField in parser[0])) {
      throw new Error(`CSV file does not contain column header ${matcherField}`)
    }

    const row = parser.find((row: { [x: string]: string }) => row[matcherField] == matcherValue)
    if (!row) {
      throw new Error(`CSV file does not contain row where ${matcherField} == ${matcherValue}`)
    }
    return row[resultField]
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new S3PollerTransport()

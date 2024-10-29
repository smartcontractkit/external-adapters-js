import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { BaseEndpointTypes, inputParameters } from '../endpoint/csv'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { sleep, AdapterResponse } from '@chainlink/external-adapter-framework/util'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { S3Client } from '@aws-sdk/client-s3'
import { bucketExistsS3, fileExistsS3, getFileFromS3 } from './s3utils'
import { parse } from 'csv-parse/sync'
import { getFormattedDateStrings } from './dateutils'

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
    const { bucket, keyPrefix, headerRow, resultColumn, matcherColumn, matcherValue, delimiter } =
      param
    const providerDataRequestedUnixMs = Date.now()

    if (!(await bucketExistsS3(this.s3Client, bucket))) {
      throw new Error(`The specified bucket ${bucket} does not exist`)
    }

    const datedKeys = getFormattedDateStrings(this.settings.LOOKBACK_DAYS).map(
      (key) => `${keyPrefix}-${key}.csv`,
    )
    const keyValidityArr = await Promise.all(
      datedKeys.map((key) => fileExistsS3(this.s3Client, bucket, key)),
    )
    const latestKeyIndex = keyValidityArr.findIndex((val) => val === true)
    if (latestKeyIndex == -1) {
      throw new Error(`no valid key found for last ${this.settings.LOOKBACK_DAYS} days`)
    }

    const mostRecentKey = datedKeys[latestKeyIndex]
    const { content, lastModified } = await getFileFromS3(this.s3Client, bucket, mostRecentKey)
    const answer = this.findValueInCSV(
      content,
      headerRow,
      matcherColumn,
      matcherValue,
      resultColumn,
      delimiter,
    )

    return {
      result: answer,
      data: {
        result: answer,
      },
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: lastModified?.getTime(),
      },
    }
  }

  // csvFileAsStr: CSV file as string as received from S3
  // headerRow: 1-indexed row of the CSV file to use as the header row
  // matcherColumn: field to match with `matcherValue` to find the answer row
  // matcherValue: value of field `matcherColumn` used to find the answer row
  // resultColumn: header field containing the answer in matcher row
  findValueInCSV(
    csvFileAsStr: string,
    headerRow: number,
    matcherColumn: string,
    matcherValue: string,
    resultColumn: string,
    delimiter: string,
  ): number {
    let parsed: Record<string, string>[]
    try {
      // from_line is 1-indexed
      // columns: true sets first line as object fields rather than 2d arrays
      parsed = parse(csvFileAsStr, {
        columns: true,
        from_line: headerRow,
        trim: true,
        delimiter,
      })
    } catch (error) {
      throw new Error(`Error parsing CSV file: ${error}`)
    }

    if (parsed.length === 0) {
      throw new Error('CSV file is empty')
    }

    const parsedHeaderRow = parsed[0]
    // validate CSV contains headers matcherColumn and resultColumn
    if (!(matcherColumn in parsedHeaderRow)) {
      throw new Error(`CSV file does not contain matcherColumn header ${matcherColumn}`)
    }
    if (!(resultColumn in parsedHeaderRow)) {
      throw new Error(`CSV file does not contain resultColumn header ${resultColumn}`)
    }

    // find correct row using matcher
    const matchingRows = parsed.filter((row) => row[matcherColumn] == matcherValue)
    if (matchingRows.length === 0) {
      throw new Error(`CSV file does not contain row where ${matcherColumn} == ${matcherValue}`)
    }
    if (matchingRows.length > 1) {
      throw new Error(`CSV file contains multiple rows where ${matcherColumn} == ${matcherValue}`)
    }

    const matchingValue = parseFloat(matchingRows[0][resultColumn])
    if (Number.isNaN(matchingValue)) {
      throw new Error(`Value found in CSV is not a number: ${matchingRows[0][resultColumn]}`)
    }

    return matchingValue
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const transport = new S3PollerTransport()

import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/canton-data'
import {
  CantonClient,
  Contract,
  ExerciseResult,
  QueryContractByTemplateRequest,
} from '../shared/canton-client'

const logger = makeLogger('CantonDataTransport')

type RequestParams = typeof inputParameters.validated

/**
 * Result handler function type that can be used to transform the exercise result
 * into a custom response format
 */
export type ResultHandler = (exerciseResult: ExerciseResult, params: RequestParams) => any

export class CantonDataTransport extends SubscriptionTransport<BaseEndpointTypes> {
  cantonClient!: CantonClient
  private resultHandler?: ResultHandler

  constructor(resultHandler?: ResultHandler) {
    super()
    this.resultHandler = resultHandler
  }

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.cantonClient = CantonClient.getInstance(dependencies.requester, {
      AUTH_TOKEN: adapterSettings.AUTH_TOKEN,
      URL: adapterSettings.URL,
    })
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(
      entries.map(async (param) => this.handleRequest(param, context.adapterSettings)),
    )
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams, adapterSettings: BaseEndpointTypes['Settings']) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param, adapterSettings)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
      logger.error(e, errorMessage)
      response = {
        statusCode: (e as AdapterInputError)?.statusCode || 502,
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

  async _handleRequest(
    params: RequestParams,
    adapterSettings: BaseEndpointTypes['Settings'],
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const templateId = adapterSettings.TEMPLATE_ID
    const choice = adapterSettings.CHOICE
    const argument = adapterSettings.ARGUMENT
    const contractFilter = adapterSettings.CONTRACT_FILTER

    let contractId: string

    if (params.contractId) {
      contractId = params.contractId
    } else {
      const payload: QueryContractByTemplateRequest = { templateIds: [templateId] }

      if (contractFilter) {
        payload.filter = contractFilter
      }
      const contracts = await this.cantonClient.queryContractsByTemplate(payload)

      if (!contracts || contracts.length === 0) {
        throw new AdapterInputError({
          message: `No contracts found for template ID '${templateId}' with the provided filter`,
          statusCode: 404,
        })
      }

      contractId = this.findLatestContract(contracts).contractId
    }

    // Exercise a non-consuming choice on the contract
    const exerciseResult = await this.cantonClient.exerciseChoice({
      contractId,
      templateId,
      choice,
      argument: argument ? JSON.parse(argument) : {},
    })

    const result = this.resultHandler
      ? this.resultHandler(exerciseResult, params)
      : exerciseResult.exerciseResult

    return {
      data: exerciseResult.exerciseResult,
      statusCode: 200,
      result: result,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  /**
   * Find the latest contract by createdAt date
   */
  private findLatestContract(contracts: Contract[]): Contract {
    if (contracts.length === 1) {
      return contracts[0]
    }

    // Sort by createdAt in descending order (latest first)
    return contracts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })[0]
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const cantonDataTransport = new CantonDataTransport()

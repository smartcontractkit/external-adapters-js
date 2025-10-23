import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/canton-data'
import { CantonClient, QueryContractByTemplateRequest } from '../shared/canton-client'

const logger = makeLogger('CantonDataTransport')

type RequestParams = typeof inputParameters.validated

export class CantonDataTransport extends SubscriptionTransport<BaseEndpointTypes> {
  cantonClient!: CantonClient

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.cantonClient = CantonClient.getInstance(dependencies.requester, {
      AUTH_TOKEN: adapterSettings.AUTH_TOKEN,
    })
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param)
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
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const providerDataRequestedUnixMs = Date.now()
    const url = params.url
    const templateId = params.templateId
    const choice = params.choice

    let contractId: string

    if (params.contractId) {
      contractId = params.contractId
    } else {
      const payload: QueryContractByTemplateRequest = { templateIds: [templateId] }

      if (params.contractFilter) {
        payload.filter = params.contractFilter
      }
      const contracts = await this.cantonClient.queryContractsByTemplate(url, payload)

      if (!contracts || contracts.length === 0) {
        throw new AdapterInputError({
          message: `No contracts found for template ID '${templateId}' with the provided filter`,
          statusCode: 404,
        })
      }

      contractId = this.findLatestContract(contracts).contractId
    }

    // Exercise a non-consuming choice on the contract
    const exerciseResult = await this.cantonClient.exerciseChoice(url, {
      contractId,
      templateId,
      choice,
      argument: params.argument ? JSON.parse(params.argument) : {},
    })

    const result = JSON.stringify(exerciseResult)

    return {
      data: {
        result,
        exerciseResult,
      },
      statusCode: 200,
      result,
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
  private findLatestContract(contracts: any[]): any {
    console.log('contracts', contracts)
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

import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters } from '../endpoint/canton-data'
import { CantonClient } from '../shared/canton-client'

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
    let contract: any

    // If contractId is provided, use it directly
    if (params.contractId) {
      contractId = params.contractId
    } else {
      // Query contracts using contractFilter
      if (!params.contractFilter) {
        throw new AdapterInputError({
          message: 'Either contractId or contractFilter must be provided',
          statusCode: 400,
        })
      }

      const contracts = await this.cantonClient.queryContractsByTemplate(url, {
        templateIds: [templateId],
        filter: String(params.contractFilter),
      })

      if (!contracts || contracts.length === 0) {
        throw new AdapterInputError({
          message: `No contracts found for template ID '${templateId}' with the provided filter`,
          statusCode: 404,
        })
      }

      // Find the latest contract by createdAt
      contract = this.findLatestContract(contracts)
      contractId = contract.contractId
    }

    // Exercise the choice on the contract
    const exerciseResult = await this.cantonClient.exerciseChoice(url, {
      contractId,
      templateId,
      choice,
      argument: params.argument ? String(params.argument) : undefined,
    })

    const result = JSON.stringify(exerciseResult)

    return {
      data: {
        result,
        exerciseResult,
        contract,
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

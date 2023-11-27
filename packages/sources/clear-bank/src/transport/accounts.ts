import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { BaseEndpointTypes, inputParameters } from '../endpoint/accounts'
import { SubscriptionTransport } from '@chainlink/external-adapter-framework/transports/abstract/subscription'
import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { AdapterResponse, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { AxiosRequestConfig } from 'axios'
import { Account, AccountsRequestSchema, ResponseSchema } from './utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

type RequestParams = typeof inputParameters.validated

export type AccountsTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

const logger = makeLogger('ClearBankAccountTransport')

const BadRequestErrorCode = 400

export class AccountsTransport extends SubscriptionTransport<BaseEndpointTypes> {
  requester!: Requester
  endpointName!: string

  async initialize(
    dependencies: TransportDependencies<BaseEndpointTypes>,
    adapterSettings: BaseEndpointTypes['Settings'],
    endpointName: string,
    transportName: string,
  ): Promise<void> {
    await super.initialize(dependencies, adapterSettings, endpointName, transportName)
    this.requester = dependencies.requester
    this.endpointName = endpointName
  }

  async backgroundHandler(context: EndpointContext<BaseEndpointTypes>, entries: RequestParams[]) {
    await Promise.all(entries.map(async (param) => this.handleRequest(param, context)))
    await sleep(context.adapterSettings.BACKGROUND_EXECUTE_MS)
  }

  async handleRequest(param: RequestParams, context: EndpointContext<BaseEndpointTypes>) {
    let response: AdapterResponse<BaseEndpointTypes['Response']>
    try {
      response = await this._handleRequest(param, context)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred'
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

  async _handleRequest(
    param: RequestParams,
    context: EndpointContext<BaseEndpointTypes>,
  ): Promise<AdapterResponse<BaseEndpointTypes['Response']>> {
    const { accountIDs, currency } = param

    // The response is paginated so multiple calls to the endpoint may be required
    // Request the endpoint for the next page if a full page was returned and balances for all account IDs have not been found yet
    let pageNumber = 1
    let balance = 0
    const ibanIDs = [...accountIDs]
    logger.debug("Fetching accounts from Clear Bank's API...")
    const providerDataRequestedUnixMs = Date.now()
    while (ibanIDs.length > 0) {
      const [key, axiosRequest] = this.prepareRequest(pageNumber, context)
      const response = await this.makeRequest(key, axiosRequest)

      logger.debug(`Evaluating accounts on page ${pageNumber}`)

      response.accounts.forEach((account) => {
        const index = ibanIDs.findIndex(
          (ibanID) => ibanID.toUpperCase() === account.iban.toUpperCase(),
        )
        // Found account for ID in response
        // If not found, continue since it may be on another page of responses
        if (index > -1) {
          balance += this.findAccountBalance(account, currency)
          // If account found in response, remove its ID from the list to signifiy it has been processed
          // even if the account failed balance validations
          ibanIDs.splice(index, 1)
        }
      })

      if (ibanIDs.length === 0) {
        logger.debug('Found balances for all accounts, breaking out of account query loop')
        break
      }

      if (response.accounts.length < context.adapterSettings.PAGE_SIZE) {
        logger.debug('Reached the final page, breaking out of account query loop')
        break
      }
      pageNumber++
    }

    if (ibanIDs.length > 0) {
      logger.error(
        `Did not find balances for all accounts. Missing accounts: ${JSON.stringify(ibanIDs)}`,
      )
      throw new AdapterError({
        statusCode: 404,
        message: `Did not find balances for all accounts. Missing accounts: ${JSON.stringify(
          ibanIDs,
        )}`,
      })
    }

    return {
      data: {
        result: balance,
      },
      statusCode: 200,
      result: balance,
      timestamps: {
        providerDataRequestedUnixMs,
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    }
  }

  private prepareRequest(
    PageNumber: number,
    context: EndpointContext<BaseEndpointTypes>,
  ): [string, AxiosRequestConfig<AccountsRequestSchema>] {
    const request = {
      method: 'GET',
      baseURL: context.adapterSettings.API_ENDPOINT,
      url: '/v3/Accounts',
      params: {
        PageNumber,
        PageSize: context.adapterSettings.PAGE_SIZE,
      },
      headers: {
        Authorization: `Bearer ${context.adapterSettings.API_KEY}`,
      },
    }
    const key = calculateHttpRequestKey<BaseEndpointTypes>({
      context,
      data: request.params,
      transportName: this.name,
    })
    return [key, request]
  }

  /**
   * Request with retry logic for Clear Banks's API. In addition to standard retry logic, this function
   * will throw error on Bad Request (400) and retry for any other error codes
   **/
  private async makeRequest(key: string, axiosRequest: AxiosRequestConfig<AccountsRequestSchema>) {
    // Using the requester provides us with rate limiting and retry logic
    const response = await this.requester.request<ResponseSchema>(key, axiosRequest)
    if (response.response.status !== 200) {
      logger.warn(
        'Encountered error when fetching accounts from Clear Bank:',
        response.response.status,
        response.response.statusText,
      )

      // If the error was a Bad Request, Clear Bank provides an error object to determine the specific issue
      if (response.response.status === BadRequestErrorCode) {
        throw new AdapterError({
          statusCode: response.response.status,
          message: JSON.stringify(response.response.data),
        })
      } else {
        throw new AdapterError({
          statusCode: response.response.status,
          message: response.response.statusText,
        })
      }
    }

    return response.response.data
  }

  private findAccountBalance(account: Account, currency: string): number {
    if (account.status !== 'Enabled') {
      logger.debug(
        `Account (${account.iban}) status: "${account.status}". Reason: "${account.statusReason}". Will not be included in balance total.`,
      )
      return 0
    }
    const balance = account.balances.find(
      (balance) =>
        balance.status.toUpperCase() === 'VALU' &&
        balance.currency.toUpperCase() === currency.toUpperCase(),
    )
    if (!balance) {
      logger.debug(`Could not find VALU balance in GBP for account: ${account.iban}`)
      return 0
    }
    return balance.amount
  }

  getSubscriptionTtlFromConfig(adapterSettings: BaseEndpointTypes['Settings']): number {
    return adapterSettings.WARMUP_SUBSCRIPTION_TTL
  }
}

export const accountsTransport = new AccountsTransport()

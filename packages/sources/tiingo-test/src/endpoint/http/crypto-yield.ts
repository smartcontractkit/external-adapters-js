import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../../config'
import overrides from '../../config/overrides.json'

interface ProviderResponseBody {
  date: string
  yieldPoolID: number
  yieldPoolName: string
  epoch: number
  startSlot: number
  endSlot: number
  validatorReward: number
  transactionReward: number
  validatorSubtractions: number
  deposits: number
  totalReward: number
  divisor: number
  apr30Day: number
  apr90Day: number
}

interface CryptoYieldResponse {
  Result: null
  Data: ProviderResponseBody
}

const inputParameters = {
  poolCode: {
    default: 'ethnetwork_eth',
    required: false,
    type: 'string',
    description: 'Tiingo staking pool code to return yield data for',
  },
} satisfies InputParameters

type CryptoYieldRequestParams = { poolCode: string }

type CryptoYieldEndpointTypes = {
  Request: {
    Params: CryptoYieldRequestParams
  }
  Response: CryptoYieldResponse
  Settings: typeof config.settings
  Provider: {
    RequestBody: never
    ResponseBody: ProviderResponseBody[]
  }
}

const httpTransport = new HttpTransport<CryptoYieldEndpointTypes>({
  prepareRequests: (params, config) => {
    return params.map((param) => {
      return {
        params: [param],
        request: {
          baseURL: config.API_ENDPOINT,
          url: 'tiingo/crypto-yield/ticks',
          method: 'GET',
          params: {
            poolCodes: param.poolCode,
            token: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      return {
        params: param,
        response: {
          result: null,
          data: res.data[0] ?? null,
        },
      }
    })
  },
})

export const endpoint = new AdapterEndpoint<CryptoYieldEndpointTypes>({
  name: 'cryptoyield',
  aliases: ['yield'],
  transport: httpTransport,
  inputParameters,
  overrides: overrides.tiingo,
})

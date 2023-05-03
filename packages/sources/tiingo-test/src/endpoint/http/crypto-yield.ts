import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
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
  Result: number | null
  Data: ProviderResponseBody
}

const inputParameters = new InputParameters({
  aprTerm: {
    type: 'string',
    required: true,
    description: 'Yield apr term',
    options: ['30day', '90day'],
  },
})

type CryptoYieldEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: CryptoYieldResponse
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
            poolCodes: 'ethnetwork_eth',
            token: config.API_KEY,
          },
        },
      }
    })
  },
  parseResponse: (params, res) => {
    return params.map((param) => {
      let resultVal: number | null = null
      if (param.aprTerm == '30day' && 'apr30Day' in res.data[0]) {
        resultVal = res.data[0].apr30Day
      } else if (param.aprTerm == '90day' && 'apr90Day' in res.data[0]) {
        resultVal = res.data[0].apr90Day
      }
      return {
        params: param,
        response: {
          result: resultVal,
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

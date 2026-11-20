import { HttpTransportConfig } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, validateResultNumber } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes, inputParameters } from '../endpoint/ssa'

type RequestParams = typeof inputParameters.validated

// One record of the scores list, as the S&P API returns it.
export interface SsaScoreRecord {
  last_modified_date_time: string
  security_id: string
  ssa: string
}

export type HttpTransportTypes = BaseEndpointTypes & {
  Provider: {
    RequestBody: never
    ResponseBody: SsaScoreRecord[]
  }
}

const providerError = (
  params: RequestParams,
  errorMessage: string,
): ProviderResult<HttpTransportTypes> => ({
  params,
  response: {
    statusCode: 502,
    errorMessage,
  },
})

// The scores GET is one JSON array for every security_id; each input entry gets
// the record whose security_id matches, or a 502 ProviderResult. A reply that
// cannot be read is an error response for each entry, never a result.
export const parseResponse: HttpTransportConfig<HttpTransportTypes>['parseResponse'] = (
  params,
  response,
) => {
  const records = response.data

  if (!Array.isArray(records)) {
    return params.map((param) => providerError(param, 'The SSA reply is not a JSON array'))
  }

  // The provider's reply is one array of record objects, so a null, a number or
  // a string element makes the whole reply malformed and no entry can be
  // selected from it.
  if (records.some((item) => item === null || typeof item !== 'object')) {
    return params.map((param) =>
      providerError(param, 'The SSA reply contains an element that is not a record'),
    )
  }

  return params.map((param) => {
    const { security_id: securityId } = param

    const record = records.find((item) => item.security_id === securityId)
    if (!record) {
      return providerError(param, `The SSA reply has no record for security_id ${securityId}`)
    }

    const validated = validateResultNumber(
      record.ssa,
      `The SSA score for security_id ${securityId} is not a number`,
    )
    if ('errorMessage' in validated) {
      return providerError(param, validated.errorMessage)
    }
    const result = validated.result

    if (!Number.isInteger(result) || result < 1 || result > 5) {
      return providerError(
        param,
        `The SSA score ${result} for security_id ${securityId} is outside the integer range 1-5`,
      )
    }

    if (typeof record.last_modified_date_time !== 'string') {
      return providerError(
        param,
        `The last_modified_date_time ${record.last_modified_date_time} for security_id ${securityId} is not a timestamp`,
      )
    }
    const providerIndicatedTimeUnixMs = new Date(record.last_modified_date_time).getTime()
    if (!Number.isFinite(providerIndicatedTimeUnixMs)) {
      return providerError(
        param,
        `The last_modified_date_time ${record.last_modified_date_time} for security_id ${securityId} is not a timestamp`,
      )
    }
    const recordTimeUnixS = Math.floor(providerIndicatedTimeUnixMs / 1000)

    return {
      params: param,
      response: {
        statusCode: 200,
        result,
        data: {
          result,
          exchangeRate: result,
          validFromTimestamp: recordTimeUnixS,
          observationsTimestamp: recordTimeUnixS,
        },
        timestamps: {
          providerIndicatedTimeUnixMs,
        },
      },
    }
  })
}

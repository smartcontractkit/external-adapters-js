import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getProviderUrl } from '../utils/validation'
import { ReservesTransportTypes } from './reserves'

export const fetchFromProvider = async (
  transportName: string,
  requester: Requester,
  context: EndpointContext<ReservesTransportTypes>,
  provider: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const url = getProviderUrl(provider)
  const requestConfig = {
    url,
    method: 'POST',
    data: { data: params },
  }
  try {
    const requestKey = calculateHttpRequestKey({
      context,
      data: params,
      transportName,
    })
    const result = await requester.request(requestKey, requestConfig)
    return result.response.data as Record<string, unknown>
  } catch (error: unknown) {
    // Try to forward the error message from another adapter.
    let providerErrorMessage = (error as { errorResponse: { error: { message: string } } })
      .errorResponse?.error?.message
    if (!providerErrorMessage) {
      if (error instanceof Error) {
        providerErrorMessage = error.message
      } else {
        providerErrorMessage = String(error)
      }
    }
    throw new AdapterError({
      statusCode: 502,
      message: `Error fetching data from provider '${provider}' at '${url}': ${providerErrorMessage}`,
    })
  }
}

export const shortJsonForError = (maxLen: number, obj: unknown): string => {
  let longString: string
  try {
    longString = JSON.stringify(obj)
  } catch {
    longString = String(obj)
  }
  return longString.length > maxLen ? `${longString.slice(0, maxLen)}...` : longString
}

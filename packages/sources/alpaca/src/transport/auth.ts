import CensorList from '@chainlink/external-adapter-framework/util/censor/censor-list'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import {
  AdapterDataProviderError,
  AdapterError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

const formEncode = (value: string): string => new URLSearchParams({ v: value }).toString().slice(2)

// The framework censor list holds only the raw setting values, but the token request body carries
// their form-encoded forms. Adds each encoded form that differs from the raw value, once.
const censorEncodedCredentials = (settings: typeof config.settings): void => {
  const censorList = CensorList.getAll()
  const encodedEntries = (['CLIENT_ID', 'CLIENT_SECRET'] as const)
    .map((name) => ({ key: `${name}_FORM_ENCODED`, raw: settings[name] }))
    .filter(({ key, raw }) => formEncode(raw) !== raw && !censorList.some((e) => e.key === key))
    .map(({ key, raw }) => ({
      key,
      value: new RegExp(formEncode(raw).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi'),
    }))
  if (encodedEntries.length) {
    CensorList.set([...censorList, ...encodedEntries])
  }
}

// OAuth client-credentials exchange (spec data_source_authentication). Called once per WS connect
// (refresh_policy per_connect). Neither the token nor the client secret is logged or put in an
// error.
export const getAccessToken = async (
  settings: typeof config.settings,
  requester: Requester,
): Promise<string> => {
  censorEncodedCredentials(settings)
  const { response } = await requester
    .request<{ access_token?: unknown }>('alpaca-oauth-token', {
      url: settings.AUTH_ENDPOINT,
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: settings.CLIENT_ID,
        client_secret: settings.CLIENT_SECRET,
      }).toString(),
    })
    .catch((error) => {
      // The Requester error keeps the HTTP client error as cause, whose config.data holds
      // client_secret. Only the provider status is kept; the original error is neither logged nor
      // attached.
      const status =
        error instanceof AdapterDataProviderError
          ? `with status ${error.providerStatusCode}`
          : 'without a response'
      throw new AdapterError({
        statusCode: 502,
        message: `Alpaca OAuth token request failed ${status}`,
      })
    })
  const accessToken = response.data?.access_token
  if (typeof accessToken !== 'string' || !accessToken) {
    throw new AdapterError({
      statusCode: 502,
      message: 'Alpaca OAuth token response did not contain access_token',
    })
  }
  return accessToken
}

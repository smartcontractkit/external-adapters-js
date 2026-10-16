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

// The access token is a JWT whose iss claim names the host that issued it. A token issued by a
// DIFFERENT host than the configured AUTH_ENDPOINT is a deployment misconfiguration (e.g. sandbox
// credentials riding a production endpoint config): fail fast and name both hosts — endpoint URLs
// are public API surface, not secrets. Tokens without a parsable iss pass: this is a safety net
// for the sandbox-in-production incident class, not a protocol contract.
const tokenIssuerMatchesEndpoint = (token: string, authEndpoint: string): boolean => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString())
    return (
      typeof payload.iss !== 'string' || new URL(payload.iss).host === new URL(authEndpoint).host
    )
  } catch {
    return true
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
  if (!tokenIssuerMatchesEndpoint(accessToken, settings.AUTH_ENDPOINT)) {
    throw new AdapterError({
      statusCode: 502,
      message:
        `Alpaca OAuth token was issued by a different host than AUTH_ENDPOINT ` +
        `(${settings.AUTH_ENDPOINT}) — check sandbox vs production credentials`,
    })
  }
  return accessToken
}

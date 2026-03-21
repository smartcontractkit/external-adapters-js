import type { AdapterResponse } from '@chainlink/ea-bootstrap'

/**
 * Extended response shape that carries ripcord signal fields alongside the
 * standard AdapterResponse structure.  These extra top-level fields mirror
 * the convention used by new-framework POR source adapters (e.g. trueusd,
 * the-network-firm) so that downstream monitoring systems can detect the
 * ripcord signal uniformly regardless of which POR EA emitted it.
 *
 * The fields are also duplicated inside `data` so that both old-style
 * (data.*) and new-style (top-level) consumers can read them.
 *
 * Defined as a plain object type (rather than extending AdapterResponse)
 * to avoid TypeScript inference issues with the generic `data` field.
 */
export type RipcordResponse = {
  jobRunID: string
  statusCode: number
  result: null
  ripcord: true
  ripcordAsInt: 1
  ripcordDetails: string
  data: {
    result: null
    statusCode: number
    ripcord: true
    ripcordAsInt: 1
    ripcordDetails: string
  }
}

/**
 * Build a ripcord response for the given job.  The returned object is
 * compatible with AdapterResponse (cast required because the core types do
 * not include ripcord fields) and will be serialised directly into the HTTP
 * response body with statusCode 503, allowing monitoring to:
 *   1. See a non-2xx HTTP status (job is considered failed / paused).
 *   2. Detect `ripcord: true` in the JSON body and silence the alert.
 *
 * This utility is intentionally standalone so that other POR composite or
 * source adapters that implement their own update-window logic can import
 * and reuse it without duplicating the response shape.
 */
export const makeRipcordResponse = (jobRunID: string, ripcordDetails: string): AdapterResponse => {
  const response: RipcordResponse = {
    jobRunID,
    statusCode: 503,
    result: null,
    ripcord: true,
    ripcordAsInt: 1,
    ripcordDetails,
    data: {
      result: null,
      statusCode: 503,
      ripcord: true,
      ripcordAsInt: 1,
      ripcordDetails,
    },
  }
  return response as unknown as AdapterResponse
}

/**
 * Returns true when the given AdapterResponse was produced by
 * makeRipcordResponse (i.e. it carries a ripcord signal).
 */
export const isRipcordResponse = (response: AdapterResponse): boolean =>
  (response as unknown as RipcordResponse).ripcord === true

/**
 * Extracts the human-readable ripcord detail string from a ripcord response,
 * or returns undefined if the response is not a ripcord response.
 */
export const getRipcordDetails = (response: AdapterResponse): string | undefined =>
  (response as unknown as RipcordResponse).ripcordDetails

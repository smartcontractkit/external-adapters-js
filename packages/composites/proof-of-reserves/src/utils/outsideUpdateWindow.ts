import type { AdapterResponse } from '@chainlink/ea-bootstrap'

/**
 * Response shape emitted when the EA receives a request outside its configured
 * update window (startUTC / endUTC).  This is an intentional, planned pause —
 * distinct from a ripcord signal, which indicates an unplanned data-provider
 * outage.
 *
 * Fields are present at both the top level and inside `data` so that different
 * monitoring consumers can find them regardless of where they look.
 */
export type OutsideUpdateWindowResponse = {
  jobRunID: string
  statusCode: number
  result: null
  outsideUpdateWindow: true
  outsideUpdateWindowDetails: string
  data: {
    result: null
    statusCode: number
    outsideUpdateWindow: true
    outsideUpdateWindowDetails: string
  }
}

/**
 * Build an outside-update-window response for the given job.  Returns HTTP 503
 * so the Chainlink node job is considered failed (no stale value written
 * on-chain), while the JSON body carries `outsideUpdateWindow: true` for
 * monitoring to detect and silence the alert.
 *
 * This utility is intentionally standalone so that other POR composite or
 * source adapters that implement their own update-window logic can import and
 * reuse it without duplicating the response shape.
 */
export const makeOutsideUpdateWindowResponse = (
  jobRunID: string,
  outsideUpdateWindowDetails: string,
): AdapterResponse => {
  const response: OutsideUpdateWindowResponse = {
    jobRunID,
    statusCode: 503,
    result: null,
    outsideUpdateWindow: true,
    outsideUpdateWindowDetails,
    data: {
      result: null,
      statusCode: 503,
      outsideUpdateWindow: true,
      outsideUpdateWindowDetails,
    },
  }
  return response as unknown as AdapterResponse
}

/**
 * Returns true when the given AdapterResponse was produced by
 * makeOutsideUpdateWindowResponse.
 */
export const isOutsideUpdateWindowResponse = (response: AdapterResponse): boolean =>
  (response as unknown as OutsideUpdateWindowResponse).outsideUpdateWindow === true

/**
 * Extracts the detail string from an outside-update-window response,
 * or returns undefined if the response is not one.
 */
export const getOutsideUpdateWindowDetails = (response: AdapterResponse): string | undefined =>
  (response as unknown as OutsideUpdateWindowResponse).outsideUpdateWindowDetails

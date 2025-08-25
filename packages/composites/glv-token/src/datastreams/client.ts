import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import crypto from 'crypto'

export type DataStreamsClientConfig = {
  baseUrl: string // e.g. https://data-engine.internal
  userId: string // UUID string for Authorization
  userSecret: string // HMAC secret
  timeoutMs?: number
  requester: Requester
}

export type FeedItem = { feedID?: string; feedid?: string }
export type FeedsResponse = { feeds: FeedItem[] }
export type LatestReportResponse = {
  report: {
    feedID?: string
    feedid?: string
    fullReport?: string
    fullreport?: string
    observationsTimestamp: number
    validFromTimestamp: number
  }
}

export class DataStreamsHttpClient {
  constructor(private cfg: DataStreamsClientConfig) {}

  private sign(method: 'GET' | 'POST', pathAndQuery: string, body?: unknown) {
    const payload = body ? JSON.stringify(body) : ''
    const bodyHash = crypto.createHash('sha256').update(payload).digest('hex')
    const ts = Date.now().toString() // milliseconds
    const msg = [method, pathAndQuery, bodyHash, this.cfg.userId, ts].join(' ')
    const sig = crypto.createHmac('sha256', this.cfg.userSecret).update(msg).digest('hex')
    return { ts, sig }
  }

  private async request<T>(
    method: 'GET' | 'POST',
    pathAndQuery: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.cfg.baseUrl}${pathAndQuery}`
    const { ts, sig } = this.sign(method, pathAndQuery, body)
    const req = {
      url,
      method,
      timeout: this.cfg.timeoutMs,
      data: body,
      headers: {
        Authorization: this.cfg.userId,
        'X-Authorization-Timestamp': ts,
        'X-Authorization-Signature-SHA256': sig,
        'Content-Type': 'application/json',
      },
    }
    const res = await this.cfg.requester.request<T>(JSON.stringify(req), req as any)
    return res.response.data as T
  }

  async listFeeds(params?: {
    base_asset?: string
    quote_asset?: string
    feed_type?: string
  }): Promise<FeedsResponse> {
    const qs = new URLSearchParams()
    if (params?.base_asset) qs.set('base_asset', params.base_asset)
    if (params?.quote_asset) qs.set('quote_asset', params.quote_asset)
    if (params?.feed_type) qs.set('feed_type', params.feed_type)
    const path = `/api/v1/feeds${qs.toString() ? `?${qs.toString()}` : ''}`
    return this.request<FeedsResponse>('GET', path)
  }

  async resolveFeedId(base: string, quote: string, feedType?: string): Promise<string> {
    const r = await this.listFeeds({ base_asset: base, quote_asset: quote, feed_type: feedType })
    const ids = (r.feeds ?? [])
      .map((f) => (f.feedID ?? f.feedid ?? '').toLowerCase())
      .filter(Boolean)
    if (ids.length === 0) throw new Error(`No feed found for ${base}/${quote}`)
    if (ids.length > 1) throw new Error(`Ambiguous feeds for ${base}/${quote}: ${ids.join(',')}`)
    return ids[0]
  }

  async getLatestReport(
    feedId: string,
  ): Promise<{ fullReportHex: string; observationsTimestamp: number; validFromTimestamp: number }> {
    const path = `/api/v1/reports/latest?feedID=${encodeURIComponent(feedId)}`
    const r = await this.request<LatestReportResponse>('GET', path)
    const rr = r.report
    const full = rr.fullReport ?? rr.fullreport
    if (!full) throw new Error(`Missing fullReport for ${feedId}`)
    return {
      fullReportHex: full,
      observationsTimestamp: rr.observationsTimestamp,
      validFromTimestamp: rr.validFromTimestamp,
    }
  }
}

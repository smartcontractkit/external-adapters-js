import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { AdapterSettings } from '@chainlink/external-adapter-framework/config'
import { dataProviderMetricsLabel, metrics } from '@chainlink/external-adapter-framework/metrics'
import { RateLimiter } from '@chainlink/external-adapter-framework/rate-limiting'
import {
  AdapterConnectionError,
  AdapterDataProviderError,
  AdapterRateLimitError,
} from '@chainlink/external-adapter-framework/validation/error'
import { censorLogs, makeLogger, sleep } from '@chainlink/external-adapter-framework/util'

/*
IMPORTANT: This file was copied from @chainlink/external-adapter-framework/util/requester.ts

The only change is the addition of the overrideAxiosRequest method used to proxy the
request to the underlying adapters.
*/

const logger = makeLogger('MarketStatusRequester')

interface ListNode<T> {
  value: T
  next: ListNode<T> | undefined
}

class UniqueLinkedList<T> {
  first: ListNode<T> | undefined
  last: ListNode<T> | undefined
  length = 0

  constructor(private maxLength: number) {}

  add(value: T): T | undefined {
    let overflow
    if (this.length === this.maxLength) {
      // If this new item would put us over max length, remove the first one (i.e. oldest one)
      overflow = this.remove()
    }

    const node: ListNode<T> = {
      value,
      next: undefined,
    }

    if (!this.first) {
      this.first = node
    }
    if (this.last) {
      this.last.next = node
    }

    this.last = node
    this.length++
    metrics.get('requesterQueueSize').inc()
    return overflow
  }

  remove() {
    const node = this.first

    if (!node) {
      return
    }

    this.first = node.next
    this.length--
    metrics.get('requesterQueueSize').dec()
    return node.value
  }
}

interface QueuedRequest<T = unknown> {
  key: string
  config: AxiosRequestConfig
  retries: number
  cost?: number
  promise: Promise<RequesterResult<T>>
  reject: (err: unknown) => void
  resolve: (req: RequesterResult<T>) => void
}

interface RequesterResult<T> {
  response: AxiosResponse<T>
  timestamps: {
    providerDataRequestedUnixMs: number
    providerDataReceivedUnixMs: number
  }
}

/**
 * Centralized management of outbound http requests.
 * Enforces rate limiting on a single instance (complying with the N Readers - 1 Writer arch for EA scaling)
 * by adding requests into a queue, processing them sequentially and sleeping when it reaches its limit.
 * The queue will throw an error if the Requester attempts to add more items than the max configured.
 * It additionally serves to coalesce requests by utilizing a more complex queue structure:
 *   - ignores duplicate items via a provided key
 *   - doesn't use the request itself because it's common for those to have things like timestamps/nonces
 * This implementation does not:
 *   - Prioritize any request over another
 *   - Contemplate architectures with multiple writer EA instances
 */
export class Requester {
  private processing = false
  private queue: UniqueLinkedList<QueuedRequest>
  private map = {} as Record<string, QueuedRequest>
  private maxRetries: number
  private timeout: number
  private sleepBeforeRequeueingMs: number

  constructor(private rateLimiter: RateLimiter, adapterSettings: AdapterSettings) {
    this.maxRetries = adapterSettings.RETRY
    this.timeout = adapterSettings.API_TIMEOUT
    this.sleepBeforeRequeueingMs = adapterSettings.REQUESTER_SLEEP_BEFORE_REQUEUEING_MS
    this.queue = new UniqueLinkedList<QueuedRequest>(adapterSettings.MAX_HTTP_REQUEST_QUEUE_LENGTH)
  }

  private queueRequest<T>(queuedRequest: QueuedRequest<T>): void {
    // By the time we're here, we know that queuedRequest has both the unresolved promise, and the resolve and reject handlers within
    // It's really, REALLY important for thread safety that from this point until this function returns, there are no async breaks.
    // Node will stay within a "thread" until it gets a chance to switch context, like an "await" statement. This section of code depends
    // on it executing from start to finish without any other actions to avoid race conditions, so if we had an "await" here we could run into problems.
    // For example, two separate queue processing "threads" could be spawned by mistake, or the queue could overflow.
    const overflowedRequest = this.queue.add(queuedRequest as QueuedRequest<unknown>)
    if (overflowedRequest) {
      // If we have overflow, it means the oldest request needs to be rejected because the queue is at its limits
      censorLogs(() =>
        logger.debug(
          `Request (Key: ${overflowedRequest.key}, Retry #: ${overflowedRequest.retries}) was removed from the queue to make room for a newer one (Size: ${this.queue.length})`,
        ),
      )
      metrics.get('requesterQueueOverflow').inc()
      overflowedRequest.reject(
        new AdapterRateLimitError({
          message:
            'The EA was unable to execute the request to fetch the requested data from the DP because the request queue overflowed. This likely indicates that a higher API tier is needed.',
          statusCode: 429,
          msUntilNextExecution: this.rateLimiter.msUntilNextExecution(),
        }),
      )

      // Remove the overflown request from our map
      delete this.map[overflowedRequest.key]
    }

    // The item was successfully added to the queue, so we can also add it to our map
    // If the request is being re-added because it will be retried, this will have no practical effect
    censorLogs(() =>
      logger.trace(
        `Added request (Key: ${queuedRequest.key}, Retry #: ${queuedRequest.retries}) to the queue (Size: ${this.queue.length})`,
      ),
    )
    this.map[queuedRequest.key] = queuedRequest as QueuedRequest

    // Finally, we start the queue processing
    if (!this.processing) {
      this.processing = true
      logger.debug(`Starting requester queue processing`)
      // We don't want to wait for the queue to finish processing here; this will just spawn a "thread"
      // and the promise we'll return from this method is the one for the request when it resolves
      this.processNext()
    }
  }

  /**
   * Queues the provided request, and returns a promise that will resolve whenever it's executed.
   *
   * @param key - a key to uniquely identify this request, and coalesce new ones that match
   * @param req - a request to send to a data provider
   * @param cost - Data Provider API credit cost of the request
   * @returns a promise that will resolve whenever the request is popped from the queue, sent, and a response is received
   */
  async request<T>(
    key: string,
    req: AxiosRequestConfig,
    cost?: number,
  ): Promise<RequesterResult<T>> {
    // If there's already a queued request, reuse it's existing promise
    const existingQueuedRequest = this.map[key]
    if (existingQueuedRequest) {
      censorLogs(() =>
        logger.trace(`Request already exists, returning queued promise (Key: ${key})`),
      )
      return existingQueuedRequest.promise as Promise<RequesterResult<T>>
    }

    const queuedRequest = {
      key,
      config: req,
      retries: 0,
      cost,
    } as QueuedRequest<T>

    // This dual promise layer is built so the queuedRequest can hold both the resolve and reject handlers,
    // and the promise itself so we can return it for request coalescing without creating new ones
    await new Promise((unblock) => {
      queuedRequest.promise = new Promise<RequesterResult<T>>((success, failure) => {
        queuedRequest.resolve = success
        queuedRequest.reject = failure
        unblock(0)
      })
    })

    // Add the request to our queue
    this.queueRequest(queuedRequest)

    return queuedRequest.promise
  }

  // Will grab from queue sequentially, and sleep just before hitting rate limits
  private async processNext(): Promise<void> {
    // This will remove from the list, but not the map; that way coalescing is still functional for in-flight reqs
    const next = this.queue.remove()

    if (!next) {
      logger.debug(
        `No more requests present in the queue, stopping processing until new one comes in`,
      )
      this.processing = false
      return
    }

    censorLogs(() =>
      logger.trace(
        `Popped next request (Key: ${next.key}, Retry #: ${next.retries}) from the queue (Size: ${this.queue.length})`,
      ),
    )

    // Wait until the rate limiter allows the request to be executed
    await this.rateLimiter.waitForRateLimit(next.cost)

    // Fire off to complete in the background. We don't wait here to be able to fire off multiple requests concurrently
    this.executeRequest.bind(this)(next)

    return this.processNext()
  }

  // Handler for the requests that will be fired off, eventually resolving the promise associated with the queued request
  private async executeRequest(req: QueuedRequest) {
    const { key, config, resolve, reject, retries } = req
    const providerDataRequested = Date.now()
    const responseTimer = metrics.get('dataProviderRequestDurationSeconds').startTimer()

    // Set configured timeout for all requests unless manually specified
    config.timeout = config.timeout || this.timeout

    try {
      censorLogs(() => logger.trace(`Sending request (Key: ${key}) to data provider`))
      const response = await this.overrideAxiosRequest(config)
      censorLogs(() => logger.trace(`Request (Key: ${key}) was successful `))
      resolve({
        response,
        timestamps: {
          providerDataRequestedUnixMs: providerDataRequested,
          providerDataReceivedUnixMs: Date.now(),
        },
      })

      // Remove the request from our map
      delete this.map[key]

      // Record count of successful data provider requests
      metrics
        .get('dataProviderRequests')
        .labels(dataProviderMetricsLabel(response.status, config.method))
        .inc()
    } catch (e) {
      const err = e as AxiosError
      censorLogs(() =>
        logger.info({
          msg: `Request failed: ${e}`,
          response: {
            statusCode: err.response?.status,
            data: err.response?.data,
            text: err.response?.statusText,
          },
        }),
      )

      // Record count of failed data provider request
      metrics
        .get('dataProviderRequests')
        .labels(dataProviderMetricsLabel(err.response?.status || 0, config.method))
        .inc()

      if (retries >= this.maxRetries) {
        logger.trace('No more retries remaining, rejecting promise...')
        const ErrorClass = err.response?.status ? AdapterDataProviderError : AdapterConnectionError

        reject(
          new ErrorClass(
            {
              statusCode: 502,
              name: 'Data Provider error',
              providerStatusCode: err?.response?.status ?? 502,
              message: err?.message,
              cause: e,
              errorResponse: err?.response?.data,
              url: config.url,
            },
            {
              providerDataRequestedUnixMs: providerDataRequested,
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          ),
        )

        // Remove the request from our map
        delete this.map[key]
      } else {
        const timeToSleep = this.sleepBeforeRequeueingMs || (2 ** retries + Math.random()) * 1000
        logger.info(
          `${this.maxRetries - retries} retries remaining, sleeping for ${timeToSleep}ms...`,
        )
        await sleep(timeToSleep)

        req.retries++

        // Re add the request to our queue
        this.queueRequest(req)
      }
    } finally {
      // Record time taken for data provider request for success or failure
      responseTimer()
    }
  }

  async overrideAxiosRequest(config: AxiosRequestConfig) {
    const { overrideAxiosRequest, ...cfg } = config as any
    return await overrideAxiosRequest(cfg)
  }
}

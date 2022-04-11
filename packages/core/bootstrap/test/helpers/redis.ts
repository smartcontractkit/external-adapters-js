export const mockCreateRedisClient = (): RedisMock => new RedisMock()

enum Event {
  error = 'error',
  end = 'end',
  connect = 'connect',
  ready = 'ready',
  reconnecting = 'reconnecting',
}

export class RedisMock {
  cache: {
    [key: string]: {
      value: string
      ttl: number
    }
  } = {}
  eventHandlers: { [event in Event]?: () => void } = {}

  on(event: Event, handler: () => void): void {
    this.eventHandlers[event] = handler
  }

  async connect(): Promise<void> {
    this.eventHandlers['connect']()
    this.eventHandlers['ready']()
  }

  async set(
    key: string,
    value: string,
    options: {
      PX: number
    },
  ): Promise<void> {
    this.cache[key] = {
      value: value,
      ttl: Date.now() + options.PX,
    }
  }

  async get(key: string): Promise<string> {
    const entry = this.cache[key]
    if (Date.now() > entry?.ttl) {
      delete this.cache[key]
      return '{}'
    } else {
      return entry?.value || '{}'
    }
  }

  async del(key: string): Promise<void> {
    delete this.cache[key]
  }

  async quit(): Promise<void> {
    this.eventHandlers['end']
  }

  async pTTL(key: string): Promise<number> {
    return this.cache[key].ttl
  }

  async removeAllListeners(): Promise<void> {
    return
  }
}

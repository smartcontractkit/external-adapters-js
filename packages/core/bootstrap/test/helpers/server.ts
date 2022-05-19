import Fastify, { FastifyInstance } from 'fastify'

export const SUCCESS_RESPONSE = {
  result: 'success',
  value: 1,
}
export const SUCCESS_ARRAY_RESPONSE = ['1']

export class Server {
  app: FastifyInstance
  port: number
  errorCount: number

  constructor() {
    this.port = 18080
    this.errorCount = 0
  }

  start(): void {
    const app = Fastify({
      logger: false,
    })
    app.get('/', (_, res) => {
      res.status(200).send(SUCCESS_RESPONSE)
    })

    app.get('/successArray', (_, res) => {
      res.status(200).send(SUCCESS_ARRAY_RESPONSE)
    })

    app.get('/error', (_, res) => {
      this.errorCount++
      res.status(500).send('There was an error')
    })

    app.get('/errorsTwice', (_, res) => {
      if (this.errorCount >= 2) {
        res.status(200).send({
          result: 'success',
          value: 1,
        })
      } else {
        this.errorCount++
        res.status(500).send('There was an error')
      }
    })

    app.get('/customError', (_, res) => {
      this.errorCount++
      res.status(200).send({
        result: 'error',
        value: 1,
      })
    })

    app.listen(this.port, '::')
    this.app = app
  }

  stop(callback?: (err?: Error | undefined) => void): void {
    if (this.app) this.app.close(callback)
  }

  reset(): void {
    this.errorCount = 0
  }
}

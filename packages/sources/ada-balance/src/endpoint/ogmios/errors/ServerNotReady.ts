/** File copied from Ogmios Typescript Client library */

import { CustomError } from 'ts-custom-error'
import { ServerHealth } from '../ServerHealth'

/** @category Connection */
export class ServerNotReady extends CustomError {
  public message: string
  public constructor(health: ServerHealth) {
    super()
    this.message = `Server is not ready. Network synchronization at ${health.networkSynchronization}%`
  }
}

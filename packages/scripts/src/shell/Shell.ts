import * as shelljs from 'shelljs'
import chalk from 'chalk'

const { red, blue } = chalk
const { log } = console

export type ShellOut = shelljs.ShellString
export class Shell {
  /**
   * Wrapping exec because jest has lots of issues trying to mock it and we would like
   * to be able to unit test stuff.
   * @param {string} command The command to execute
   * @returns {ShellString} The ShellString from the command
   */
  public exec(command: string): ShellOut {
    log(blue.bold(command))
    return shelljs.exec(command)
  }
}

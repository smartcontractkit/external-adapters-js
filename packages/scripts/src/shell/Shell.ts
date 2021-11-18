import * as shelljs from 'shelljs'
export type ShellOut = shelljs.ShellString
export class Shell {
  /**
   * Wrapping exec because jest has lots of issues trying to mock it and we would like
   * to be able to unit test stuff.
   * @param {string} command The command to execute
   * @returns {ShellString} The ShellString from the command
   */
  public exec(command: string): ShellOut {
    return shelljs.exec(command)
  }
}

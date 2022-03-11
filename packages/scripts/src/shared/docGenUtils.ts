import { cat, ShellString } from 'shelljs'
import { FileData, JsonObject } from './docGenTypes'

export const localPathToRoot = '../../../../'

export const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

export const codeList = (a: (string | number)[] = []): string =>
  a
    .sort()
    .map((d) => wrapCode(d))
    .join(', ')

export const getJsonFile = (path: string): JsonObject => JSON.parse(cat(path).toString())

export const saveText = (fileData: FileData | FileData[]): void => {
  if (!Array.isArray(fileData)) fileData = [fileData]

  for (const file of fileData) {
    const shellString = new ShellString(file.text)
    shellString.to(file.path)

    console.log(`${file.path} has been saved`)
  }
}

export const sortText = (a: string, b: string): 1 | 0 | -1 => {
  const capitalA = a.toLowerCase()
  const capitalB = b.toLowerCase()
  return capitalA > capitalB ? 1 : capitalA < capitalB ? -1 : 0
}

export const wrapCode = (s: string | number = ''): string => `\`${s.toString()}\``

export const wrapJson = (o: string): string => `\`\`\`json\n${o}\n\`\`\``

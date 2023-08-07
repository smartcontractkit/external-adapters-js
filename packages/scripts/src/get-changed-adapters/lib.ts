import chalk from 'chalk'
import fs from 'fs'
import { SoakTestBlacklist } from './soakTestBlacklist'

const { red } = chalk

const usageString = `Requires 1 argument of the changed files file path.`

/**
 * Checks the args for required input.
 * @returns {string} The inputs from the args.
 */
export const checkArgs = (): string => {
  if (process.argv.length < 3) {
    process.exitCode = 1
    throw red.bold(usageString)
  }
  const file: string = process.argv[2]
  if (!file) {
    process.exitCode = 1
    throw red.bold(usageString)
  }

  return file
}

export interface ChangedAdapters {
  sources: string[]
  composites: string[]
  targets: string[]
  'non-deployable': string[]
  coreWasChanged: boolean
}

/**
 * Load the changed files from a file holding the list
 * @param {string} file The path to the file containing the list of changes
 * @returns {string[]} The list of changed files as an array
 */
export const loadChangedFileList = (file: string): string[] => {
  const fileText = fs.readFileSync(file)
  const changedFiles = fileText.toString().split('\n')
  return changedFiles
}

/**
 * Filter all the changed files by their adapter type
 * @param {string[]} changedFiles The list of changed files
 * @returns {ChangedAdapters} The changed adapters object with all changes for each adapter type
 */
export const generateFilteredAdaptersListByType = (changedFiles: string[]): ChangedAdapters => ({
  // Build lists of unique adapters changed for each type in each file
  sources: filterFilesToAdapters(changedFiles, 'sources') as string[],
  composites: filterFilesToAdapters(changedFiles, 'composites') as string[],
  targets: filterFilesToAdapters(changedFiles, 'targets') as string[],
  'non-deployable': filterFilesToAdapters(changedFiles, 'non-deployable') as string[],
  coreWasChanged: filterFilesToAdapters(changedFiles, 'core', true) as boolean,
})

/**
 * Filter changed files into a specific adapter type removing any changes that
 * are not part of a src directory.
 * @param {string[]} changedFiles The list of changed files
 * @param {string} filterForAdapterType The type of adapter to filter for
 * @param {boolean} absolute If true, return T/F for whether source/package files have changed
 * @returns {string[]|boolean} The filtered list of adapters that have changed, or T/F whether adapters have changed
 */
const filterFilesToAdapters = (
  changedFiles: string[],
  filterForAdapterType: string,
  absolute?: boolean,
): string[] | boolean => {
  const changedFilesForType = changedFiles.filter((str) =>
    str.match(`packages/${filterForAdapterType}/.*(src|package.json|test-payload.json)`),
  )

  if (absolute) return changedFilesForType.length > 0

  const uniqueAdapters: { [key: string]: boolean } = {}
  for (const line of changedFilesForType) {
    const dirNames = line.split('/')
    uniqueAdapters[dirNames[2]] = true
  }

  return Object.keys(uniqueAdapters)
}

/**
 * Creates the output for a ci pipeline to understand what adapters have changed and what adapters
 * to spin up for testing.
 * @param {ChangedAdapters} adapters The changed adapters object with all changed adapters for each type of adapter
 * @returns {string} The bash array formatted string of adapters with changes.
 */
export const createOutput = (adapters: ChangedAdapters): string => {
  // Exclude non-deployable here, because they are not deployable
  const combinedAdapters = [...adapters.sources, ...adapters.composites, ...adapters.targets]

  if (adapters.coreWasChanged)
    combinedAdapters.push('coingecko', 'coinmarketcap', 'coinpaprika', 'tiingo')

  const allowedAdapters = combinedAdapters.filter((a) => !SoakTestBlacklist.includes(a))

  return allowedAdapters.join(' ')
}

export async function main(): Promise<void> {
  const file = checkArgs()
  const changedFiles = loadChangedFileList(file)
  const changedAdapters = generateFilteredAdaptersListByType(changedFiles)
  console.log(createOutput(changedAdapters))
}

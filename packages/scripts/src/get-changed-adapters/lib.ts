import chalk from 'chalk'
import fs from 'fs'
const { red } = chalk

const usageString = `
Requires 1 argument of the changed files file path.`

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
export const generateFilteredAdaptersListByType = (changedFiles: string[]): ChangedAdapters => {
  // Build lists of unique adapters changed for each type in each file
  const coreChanges = filterFilesToAdapters(changedFiles, 'core')
  const changedAdapters: ChangedAdapters = {
    sources: filterFilesToAdapters(changedFiles, 'sources'),
    composites: filterFilesToAdapters(changedFiles, 'composites'),
    targets: filterFilesToAdapters(changedFiles, 'targets'),
    coreWasChanged: coreChanges.length > 0 ? true : false,
  }
  return changedAdapters
}

/**
 * Filter changed files into a specific adapter type removing any changes that
 * are not part of a src directory.
 * @param {string[]} changedFiles The list of changed files
 * @param {string} filterForAdapterType The type of adapter to filter for
 * @returns {string[]} The filtered list of adapters that have changed
 */
const filterFilesToAdapters = (changedFiles: string[], filterForAdapterType: string): string[] => {
  // filter files for specific adapter type
  const changedFilesForType = changedFiles.filter(function (str) {
    return str.includes(`packages/${filterForAdapterType}/`)
  })

  const uniqueAdapters: { [key: string]: boolean } = {}
  for (let i = 0; i < changedFilesForType.length; i++) {
    const line = changedFilesForType[i]
    // remove any files not in a src folder
    if (!line.includes('/src/')) {
      continue
    }

    // load adapters into dictionary, means we don't have to worry about duplicates
    const dirNames = line.split('/')
    uniqueAdapters[dirNames[2]] = true
  }
  // return array of dictionary keys which is all the adapters that have changed
  return Object.keys(uniqueAdapters)
}

/**
 * Creates the output for a ci pipeline to understand what adapters have changed and what adapters
 * to spin up for testing.
 * @param {ChangedAdapters} adapters The changed adapters object with all changed adapters for each type of adapter
 * @returns {string} The bash array formatted string of adapters with changes.
 */
export const createOutput = (adapters: ChangedAdapters): string => {
  // TODO if needed do specific things for specific adapters, for example composites
  // if needed do specific things for core changes
  if (adapters.coreWasChanged) {
    // TODO add an adapter of each type to the outgoing array to be tested
  }

  // combine adapters lists to create bash usable array of adapters to test
  return [...adapters.sources, ...adapters.composites, ...adapters.targets].join(' ')
}

export async function main(): Promise<void> {
  const file = checkArgs()
  const changedFiles = loadChangedFileList(file)
  const changedAdapters = generateFilteredAdaptersListByType(changedFiles)
  console.log(createOutput(changedAdapters))
}

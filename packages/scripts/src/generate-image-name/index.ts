import { setOutput } from '@actions/core'
import { generateImageName } from './lib'

async function main() {
  setOutput('image_name', await generateImageName())
}
main()

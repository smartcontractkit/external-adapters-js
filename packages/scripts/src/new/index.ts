import { execSync } from 'child_process'
import { generate, writeJson } from './lib'

if (process.argv[2] == 'tsconfig') {
  // Update tsconfig files
  generate().then(writeJson)
} else {
  const ADAPTER_TYPES = ['composite', 'source', 'target']

  const type = process.argv[2] || 'source'

  if (!ADAPTER_TYPES.includes(type)) {
    throw new Error(`Type must be one of: ${ADAPTER_TYPES.join(', ')}`)
  }
  let path = `packages/sources`
  switch (type) {
    case 'composite': {
      path = 'packages/composites'
      break
    }
    case 'target': {
      path = 'packages/targets'
      break
    }
  }

  execSync(`rm -rf ./.yarn/cache/node_modules`)

  const result = execSync(`find . -name "@chainlink-external-adapter-framework*"`, {
    encoding: 'utf-8',
  })

  execSync(`unzip ${result.trimEnd()} -d ./.yarn/cache`, { maxBuffer: 1024 * 1024 * 500 })

  execSync(`npm install -g yo@4.3.1 > /dev/null 2>&1`)

  console.log('Run the following command:')
  console.log(
    `  yo ./.yarn/cache/node_modules/@chainlink/external-adapter-framework/generator-adapter ${path} --ignore-version-check && yarn new tsconfig`,
  )
}

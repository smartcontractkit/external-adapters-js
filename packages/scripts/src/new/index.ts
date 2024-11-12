import { execSync } from 'child_process'
import { generate, writeJson } from './lib'

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

// Create v3 adapter
execSync(`create-external-adapter ${path}`, { stdio: 'inherit' })

// Update tsconfig files
generate().then(writeJson)

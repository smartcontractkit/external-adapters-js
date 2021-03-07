import { rootReducer } from './reducer'
import { rootEpic } from './side-effects'
import { configureStore } from './store'

export * as actions from './actions'

const { epicMiddleware, store } = configureStore(rootReducer)
epicMiddleware.run(rootEpic)

export { store }

import { rootReducer } from './reducer'
import { rootEpic } from './sideeffects'
import { configureStore } from './store'
const { epicMiddleware, store } = configureStore(rootReducer)
epicMiddleware.run(rootEpic)

export * as actions from './actions'
export { store }

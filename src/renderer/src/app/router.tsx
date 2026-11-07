import { createHashRouter } from 'react-router-dom'
import { TodoPage } from '@renderer/pages/TodoPage'

// Hash router: production loads index.html over file://
export const router = createHashRouter([{ path: '/', element: <TodoPage /> }])

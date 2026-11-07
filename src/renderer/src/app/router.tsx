import { createHashRouter } from 'react-router-dom'
import { HomePage } from '@renderer/pages/HomePage'
import { WelcomePage } from '@renderer/pages/WelcomePage'
import { WorkspacePage } from '@renderer/pages/WorkspacePage'

// Hash router: production loads index.html over file://
export const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/welcome', element: <WelcomePage /> },
  { path: '/d/:id', element: <WorkspacePage /> }
])

import { useParams } from 'react-router-dom'

/** Placeholder until the workspace screens are implemented. */
export function WorkspacePage(): React.JSX.Element {
  const { id } = useParams()
  return <p className="p-6 text-body text-fg-secondary">Document {id}</p>
}

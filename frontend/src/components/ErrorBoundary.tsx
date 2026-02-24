import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
          <div className="max-w-md text-center">
            <h1 className="mb-2 text-2xl font-bold text-red-400">Something went wrong</h1>
            <p className="text-gray-400">{this.state.error?.message}</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  isPuterLoaded: boolean
}

export class PuterErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      isPuterLoaded: typeof window !== 'undefined' && (window as any).puter !== undefined,
    }
  }

  componentDidMount() {
    // Check if Puter loads after a delay
    const timer = setTimeout(() => {
      const isPuterLoaded = (window as any).puter !== undefined
      if (!isPuterLoaded) {
        this.setState({ hasError: true })
      }
    }, 3000)

    return () => clearTimeout(timer)
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError || !this.state.isPuterLoaded) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Service Unavailable</h1>
            <p className="text-muted-foreground mb-4">
              Puter.js failed to load. This app requires cloud services to function.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Check your internet connection and try again.
            </p>
            <Button onClick={this.handleRetry} className="w-full">
              Retry
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

'use client'

import * as React from 'react'
import ErrorPage from './error'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-background text-foreground">
        <ErrorPage error={error} reset={reset} />
      </body>
    </html>
  )
}

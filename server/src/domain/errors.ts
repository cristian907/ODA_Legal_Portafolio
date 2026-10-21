export class ValidationError extends Error {
  readonly errors: string[]

  constructor(errors: string[], options?: { cause?: unknown }) {
    super(errors.join(' '), options)
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class ProcessingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ProcessingError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  readonly errors: string[]

  constructor(errors: string[]) {
    super(errors.join(' '))
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

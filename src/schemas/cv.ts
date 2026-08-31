import { z } from 'zod'

/**
 * Step 1 (personal data). Only the fields that carry rules are declared;
 * unknown keys on the personal object are ignored by safeParse.
 */
export const personalSchema = z.object({
  firstName: z.string().trim().min(1, 'El nombre es obligatorio.'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio.'),
  // Email is optional: an empty value passes; anything else must be a valid
  // address. Trim first, then branch, so surrounding spaces never fail it.
  email: z
    .string()
    .trim()
    .pipe(z.union([z.literal(''), z.email('Introduce un correo válido.')])),
})

/**
 * Shared cross-field rule for experience/education items: the end year cannot
 * be earlier than the start year. Non-numeric values are treated as "open"
 * (e.g. "Actual") and never fail, matching the legacy behavior.
 */
export const dateRangeSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine(
    (v) => {
      const s = parseInt(v.startDate, 10)
      const e = parseInt(v.endDate, 10)
      return Number.isNaN(s) || Number.isNaN(e) || e >= s
    },
    { message: 'La fecha de fin no puede ser anterior a la de inicio.' },
  )

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
  // Phone is optional too: empty passes; otherwise it must match one of the 3 formats:
  // 1) +XX-XX-XXXX-XXX (e.g. +34-91-1234-567)
  // 2) +XXXXX-XXXXXXX (e.g. +58412-1234567)
  // 3) +XX-XXX-XXX-XXXX (e.g. +58-412-123-4567)
  phone: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.literal(''),
        z
          .string()
          .regex(
            /^\+(\d{2}-\d{2}-\d{4}-\d{3}|\d{5}-\d{7}|\d{2}-\d{3}-\d{3}-\d{4})$/,
            'Introduce un teléfono válido (ej. +34-91-1234-567, +58412-1234567 o +58-412-123-4567).',
          ),
      ]),
    ),
  // Website is optional: empty passes; otherwise must be a valid website URL.
  website: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.literal(''),
        z
          .string()
          .regex(
            /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i,
            'Introduce una página web válida (ej. www.unsitiogenial.es).',
          ),
      ]),
    ),
})

/**
 * Step 2 (experience items). All fields are required when an experience is present.
 * Years must be 4 numeric digits (or "Actual" for endDate), cannot be greater than the current year,
 * and endDate cannot be earlier than startDate.
 */
export const experienceItemSchema = z
  .object({
    title: z.string().trim().min(1, 'El cargo o empresa es obligatorio.'),
    startDate: z
      .string()
      .trim()
      .min(1, 'El año de inicio es obligatorio.')
      .regex(/^\d{4}$/, 'Introduce un año de inicio válido de 4 dígitos (ej. 2019).'),
    endDate: z
      .string()
      .trim()
      .min(1, 'El año de fin es obligatorio.')
      .regex(
        /^(\d{4}|actual|presente)$/i,
        'Introduce un año de fin válido de 4 dígitos (ej. 2023) o "Actual".',
      ),
    desc: z.string().trim().min(1, 'La descripción es obligatoria.'),
  })
  .refine(
    (v) => {
      const startYear = parseInt(v.startDate, 10)
      return Number.isNaN(startYear) || startYear <= new Date().getFullYear()
    },
    { message: 'El año de inicio no puede ser mayor al año actual.' },
  )
  .refine(
    (v) => {
      const endYear = parseInt(v.endDate, 10)
      return Number.isNaN(endYear) || endYear <= new Date().getFullYear()
    },
    { message: 'El año de fin no puede ser mayor al año actual.' },
  )
  .refine(
    (v) => {
      const s = parseInt(v.startDate, 10)
      const e = parseInt(v.endDate, 10)
      return Number.isNaN(s) || Number.isNaN(e) || e >= s
    },
    { message: 'La fecha de fin no puede ser anterior a la de inicio.' },
  )

/**
 * Step 3 (education items). All fields are required when an education item is present.
 * Years must be 4 numeric digits (or "Actual" for endDate), cannot be greater than the current year,
 * and endDate cannot be earlier than startDate.
 */
export const educationItemSchema = z
  .object({
    institution: z.string().trim().min(1, 'La institución o universidad es obligatoria.'),
    degree: z.string().trim().min(1, 'La carrera o título es obligatorio.'),
    startDate: z
      .string()
      .trim()
      .min(1, 'El año de inicio es obligatorio.')
      .regex(/^\d{4}$/, 'Introduce un año de inicio válido de 4 dígitos (ej. 2018).'),
    endDate: z
      .string()
      .trim()
      .min(1, 'El año de fin es obligatorio.')
      .regex(
        /^(\d{4}|actual|presente)$/i,
        'Introduce un año de fin válido de 4 dígitos (ej. 2023) o "Actual".',
      ),
  })
  .refine(
    (v) => {
      const startYear = parseInt(v.startDate, 10)
      return Number.isNaN(startYear) || startYear <= new Date().getFullYear()
    },
    { message: 'El año de inicio no puede ser mayor al año actual.' },
  )
  .refine(
    (v) => {
      const endYear = parseInt(v.endDate, 10)
      return Number.isNaN(endYear) || endYear <= new Date().getFullYear()
    },
    { message: 'El año de fin no puede ser mayor al año actual.' },
  )
  .refine(
    (v) => {
      const s = parseInt(v.startDate, 10)
      const e = parseInt(v.endDate, 10)
      return Number.isNaN(s) || Number.isNaN(e) || e >= s
    },
    { message: 'La fecha de fin no puede ser anterior a la de inicio.' },
  )

/**
 * Shared cross-field rule for date ranges: the end year cannot
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

/**
 * Step 4 (languages). Only letters and spaces are allowed (no numbers, no special characters).
 */
export const languageItemSchema = z
  .string()
  .trim()
  .min(1, 'Introduce el nombre del idioma.')
  .regex(
    /^[\p{L}\s]+$/u,
    'El idioma solo debe contener letras (sin números ni caracteres especiales).',
  )



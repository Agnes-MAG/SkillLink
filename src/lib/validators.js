import { z } from 'zod'
import { DEPARTMENTS, SKILL_CATEGORIES, YEARS } from './constants'

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signUpSchema = signInSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  department: z.enum(DEPARTMENTS, { message: 'Choose your department' }),
  year: z.enum(YEARS, { message: 'Choose your year' }),
  bio: z.string().trim().max(500, 'Bio must be at most 500 characters').optional().or(z.literal('')),
})

export const skillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Skill name must be at least 2 characters')
    .max(50, 'Skill name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9 +#.-]+$/, 'Use letters, numbers and spaces only'),
  category: z.enum(SKILL_CATEGORIES, { message: 'Pick a category' }),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the skill in at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  type: z.enum(['offer', 'need']),
})

export const requestSchema = z.object({
  notes: z.string().trim().max(500, 'Note must be at most 500 characters').optional().or(z.literal('')),
  scheduled_at: z.string().optional().or(z.literal('')),
})

export const ratingSchema = z.object({
  score: z.coerce.number().int().min(1, 'Pick a star rating').max(5),
  comment: z.string().trim().max(500, 'Comment must be at most 500 characters').optional().or(z.literal('')),
})

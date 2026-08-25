import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button } from '../common/Button'
import { Input, Select, Textarea } from '../common/Field'
import { SKILL_CATEGORIES } from '../../lib/constants'
import { friendlyError } from '../../lib/errors'
import { skillSchema } from '../../lib/validators'

export function SkillForm({ type, initialValues, onSubmit, onCancel, submitLabel = 'Save skill' }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      category: initialValues?.category ?? '',
      description: initialValues?.description ?? '',
      type: initialValues?.type ?? type,
    },
  })

  const submit = async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <input type="hidden" {...register('type')} />
      <Input
        label="Skill name"
        placeholder="e.g. React, Academic Writing, Spanish"
        error={errors.name?.message}
        {...register('name')}
      />
      <Select
        label="Category"
        placeholder="Select a category"
        options={SKILL_CATEGORIES}
        error={errors.category?.message}
        {...register('category')}
      />
      <Textarea
        label="Description"
        placeholder={
          type === 'offer'
            ? 'What exactly can you teach, and at what level?'
            : 'What do you want to learn, and what would success look like?'
        }
        hint="Between 10 and 500 characters."
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

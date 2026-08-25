import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { REQUEST_EXPIRY_HOURS } from '../../lib/constants'
import { friendlyError } from '../../lib/errors'
import { requestSchema } from '../../lib/validators'
import { requestSkill } from '../../services/sessionService'
import { Button } from '../common/Button'
import { Input, Textarea } from '../common/Field'
import { Modal } from '../common/Modal'

export function RequestModal({ match, requesterId, onClose, onCreated }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(requestSchema) })

  const skill = match?.skill

  const submit = async (values) => {
    if (values.scheduled_at && new Date(values.scheduled_at) <= new Date()) {
      toast.error('Pick a time in the future.')
      return
    }
    try {
      const session = await requestSkill({
        requesterId,
        providerId: skill.owner.id,
        skillId: skill.id,
        notes: values.notes,
        scheduledAt: values.scheduled_at ? new Date(values.scheduled_at).toISOString() : null,
      })
      toast.success('Request sent. You will be notified when they respond.')
      onCreated?.(session)
      onClose()
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <Modal
      open={Boolean(match)}
      onClose={onClose}
      title={`Request "${skill?.name}"`}
      description={`${skill?.owner?.full_name} has ${REQUEST_EXPIRY_HOURS} hours to respond before the request expires.`}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Textarea
          label="Message"
          placeholder="Explain what you need help with and your current level."
          hint="Up to 500 characters."
          error={errors.notes?.message}
          {...register('notes')}
        />
        <Input
          label="Proposed time (optional)"
          type="datetime-local"
          error={errors.scheduled_at?.message}
          {...register('scheduled_at')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Send request
          </Button>
        </div>
      </form>
    </Modal>
  )
}

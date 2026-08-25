import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { friendlyError } from '../../lib/errors'
import { ratingSchema } from '../../lib/validators'
import { submitRating } from '../../services/sessionService'
import { Button } from '../common/Button'
import { Textarea } from '../common/Field'
import { Modal } from '../common/Modal'
import { StarRating } from '../common/StarRating'

export function RatingModal({ session, raterId, onClose, onRated }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(ratingSchema), defaultValues: { score: 0, comment: '' } })

  const peer = session ? (session.requester_id === raterId ? session.provider : session.requester) : null

  const submit = async (values) => {
    try {
      await submitRating({
        sessionId: session.id,
        raterId,
        ratedUserId: peer.id,
        score: values.score,
        comment: values.comment,
      })
      toast.success('Thanks for the feedback!')
      onRated?.()
      onClose()
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <Modal
      open={Boolean(session)}
      onClose={onClose}
      title={`Rate ${peer?.full_name ?? 'your partner'}`}
      description="Ratings are weighted by recency, so honest recent feedback matters most."
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
        <div>
          <Controller
            name="score"
            control={control}
            render={({ field }) => (
              <StarRating value={field.value} onChange={field.onChange} size="lg" label="Your rating" />
            )}
          />
          {errors.score?.message && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.score.message}
            </p>
          )}
        </div>
        <Textarea
          label="Comment (optional)"
          placeholder="What went well? What could be better?"
          error={errors.comment?.message}
          {...register('comment')}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Later
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Submit rating
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { Plus } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { MAX_SKILLS_PER_TYPE } from '../../lib/constants'
import { friendlyError } from '../../lib/errors'
import { createSkill, deleteSkill, updateSkill } from '../../services/skillService'
import { Button } from '../common/Button'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { EmptyState } from '../common/EmptyState'
import { Modal } from '../common/Modal'
import { SkillForm } from './SkillForm'
import { SkillPill } from './SkillPill'

export function SkillManager({ userId, type, skills, onChange, emptyIcon, emptyTitle, emptyText }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const typed = skills.filter((skill) => skill.type === type)
  const atLimit = typed.length >= MAX_SKILLS_PER_TYPE

  const handleSubmit = async (values) => {
    if (editing) {
      const updated = await updateSkill(editing.id, values)
      onChange(skills.map((skill) => (skill.id === updated.id ? updated : skill)))
      toast.success('Skill updated')
    } else {
      const created = await createSkill(userId, values)
      onChange([created, ...skills])
      toast.success('Skill added')
    }
    setFormOpen(false)
    setEditing(null)
  }

  const handleDelete = async () => {
    try {
      await deleteSkill(deleting.id)
      onChange(skills.filter((skill) => skill.id !== deleting.id))
      toast.success('Skill removed')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {type === 'offer' ? 'Skills I offer' : 'Skills I need'}
          <span className="ml-2 font-normal normal-case">
            ({typed.length}/{MAX_SKILLS_PER_TYPE})
          </span>
        </h2>
        <Button
          size="sm"
          variant="secondary"
          icon={Plus}
          disabled={atLimit}
          title={atLimit ? `You can list up to ${MAX_SKILLS_PER_TYPE} skills` : undefined}
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          Add
        </Button>
      </div>

      {typed.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyText} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {typed.map((skill) => (
            <SkillPill
              key={skill.id}
              skill={skill}
              onEdit={(value) => {
                setEditing(value)
                setFormOpen(true)
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        title={editing ? 'Edit skill' : type === 'offer' ? 'Add a skill you offer' : 'Add a skill you need'}
        description="Clear descriptions get more matches."
      >
        <SkillForm
          type={type}
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          submitLabel={editing ? 'Save changes' : 'Add skill'}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Remove "${deleting?.name}"?`}
        description="This skill will no longer appear in discovery. Existing sessions are unaffected."
        confirmLabel="Remove skill"
        variant="danger"
      />
    </section>
  )
}

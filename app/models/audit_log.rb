class AuditLog < ApplicationRecord
  acts_as_tenant :tenant

  belongs_to :tenant
  belongs_to :user, optional: true
  belongs_to :auditable, polymorphic: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_record, ->(record) { where(auditable: record) }
  scope :by_action, ->(action) { where(action: action) }
end

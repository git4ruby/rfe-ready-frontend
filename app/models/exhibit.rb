class Exhibit < ApplicationRecord
  acts_as_tenant :tenant

  belongs_to :tenant
  belongs_to :case, class_name: "RfeCase"
  belongs_to :rfe_document, optional: true

  validates :label, presence: true, uniqueness: { scope: :case_id }
  validates :position, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:position) }
end

class RfeSection < ApplicationRecord
  acts_as_tenant :tenant

  belongs_to :tenant
  belongs_to :case, class_name: "RfeCase"
  belongs_to :rfe_document, optional: true

  has_many :evidence_checklists, dependent: :destroy
  has_many :draft_responses, dependent: :destroy

  enum :section_type, {
    general: 0,
    specialty_occupation: 1,
    employer_employee: 2,
    beneficiary_qualifications: 3
  }

  validates :section_type, presence: true
  validates :position, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:position) }
  scope :high_confidence, -> { where("confidence_score >= ?", 0.8) }
end

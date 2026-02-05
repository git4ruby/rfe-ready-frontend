class EvidenceChecklist < ApplicationRecord
  acts_as_tenant :tenant

  belongs_to :tenant
  belongs_to :case, class_name: "RfeCase"
  belongs_to :rfe_section
  belongs_to :linked_document, class_name: "RfeDocument", optional: true

  enum :priority, { required: 0, recommended: 1, optional: 2 }

  validates :document_name, presence: true
  validates :position, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:position) }
  scope :collected, -> { where(is_collected: true) }
  scope :uncollected, -> { where(is_collected: false) }

  def toggle_collected!
    update!(is_collected: !is_collected)
  end
end

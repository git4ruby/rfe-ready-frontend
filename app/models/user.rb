class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :recoverable, :rememberable,
         :validatable, :trackable, :confirmable, :lockable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  acts_as_tenant :tenant

  has_many :created_cases, class_name: "RfeCase", foreign_key: :created_by_id, dependent: :nullify
  has_many :assigned_cases, class_name: "RfeCase", foreign_key: :assigned_attorney_id, dependent: :nullify
  has_many :uploaded_documents, class_name: "RfeDocument", foreign_key: :uploaded_by_id, dependent: :nullify
  has_many :uploaded_knowledge_docs, class_name: "KnowledgeDoc", foreign_key: :uploaded_by_id, dependent: :nullify
  has_many :audit_logs, dependent: :nullify

  enum :role, { admin: 0, attorney: 1, paralegal: 2, viewer: 3 }
  enum :status, { active: 0, inactive: 1, invited: 2 }, prefix: :account

  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :role, presence: true
  validates :bar_number, presence: true, if: :attorney?

  scope :active, -> { where(status: :active) }

  def full_name
    "#{first_name} #{last_name}"
  end

  def jwt_payload
    { "tenant_id" => tenant_id, "role" => role }
  end
end

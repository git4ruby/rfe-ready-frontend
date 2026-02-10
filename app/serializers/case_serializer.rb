class CaseSerializer < Blueprinter::Base
  identifier :id
  fields :case_number, :uscis_receipt_number, :visa_type, :status,
         :petitioner_name, :beneficiary_name, :rfe_received_date,
         :rfe_deadline, :attorney_reviewed, :notes, :created_at, :updated_at

  association :created_by, blueprint: UserSerializer
  association :assigned_attorney, blueprint: UserSerializer

  view :detail do
    include_view :extended
    association :rfe_documents, blueprint: RfeDocumentSerializer
    association :rfe_sections, blueprint: RfeSectionSerializer
  end

  view :extended do
    field :metadata
    field :attorney_reviewed_at
    field :exported_at
    field :submitted_at
  end
end

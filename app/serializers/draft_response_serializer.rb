class DraftResponseSerializer < Blueprinter::Base
  identifier :id
  fields :position, :title, :status, :version, :created_at, :updated_at

  view :extended do
    field :ai_generated_content
    field :edited_content
    field :final_content
    field :exhibit_references
    field :attorney_feedback
  end
end

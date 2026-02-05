class KnowledgeDocSerializer < Blueprinter::Base
  identifier :id
  fields :doc_type, :title, :visa_type, :rfe_category, :is_active, :created_at

  view :extended do
    field :content
    field :metadata
  end
end

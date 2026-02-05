class EvidenceChecklistSerializer < Blueprinter::Base
  identifier :id
  fields :position, :priority, :document_name, :description, :guidance,
         :is_collected, :attorney_notes, :created_at
end

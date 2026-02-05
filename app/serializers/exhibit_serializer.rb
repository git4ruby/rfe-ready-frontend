class ExhibitSerializer < Blueprinter::Base
  identifier :id
  fields :label, :title, :description, :position, :page_range, :created_at
end

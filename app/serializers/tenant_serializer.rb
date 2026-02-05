class TenantSerializer < Blueprinter::Base
  identifier :id
  fields :name, :slug, :plan, :status, :data_retention_days, :created_at

  view :extended do
    field :settings
    field :encryption_key_id
  end
end

class CreateTenants < ActiveRecord::Migration[8.0]
  def change
    create_table :tenants, id: :uuid do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.integer :plan, default: 0, null: false
      t.integer :status, default: 0, null: false
      t.jsonb :settings, default: {}
      t.integer :data_retention_days, default: 30
      t.string :encryption_key_id

      t.timestamps
    end

    add_index :tenants, :slug, unique: true
  end
end

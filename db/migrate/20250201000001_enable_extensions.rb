class EnableExtensions < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def up
    enable_extension "pgcrypto" unless extension_enabled?("pgcrypto")

    # pgvector - install via: brew install pgvector
    begin
      enable_extension "vector" unless extension_enabled?("vector")
    rescue StandardError => e
      puts "WARNING: pgvector extension not available. Install it for embedding features."
      puts "  brew install pgvector"
    end
  end

  def down
    disable_extension "vector" if extension_enabled?("vector")
  end
end

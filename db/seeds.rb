puts "Seeding database..."

# Create demo tenant
tenant = Tenant.find_or_create_by!(slug: "demo-firm") do |t|
  t.name = "Demo Immigration Law Firm"
  t.plan = :professional
  t.status = :active
  t.data_retention_days = 90
end
puts "  Created tenant: #{tenant.name}"

# Set tenant context for acts_as_tenant
ActsAsTenant.current_tenant = tenant

# Create admin user
admin = User.find_or_initialize_by(email: "admin@rfeready.com")
if admin.new_record?
  admin.assign_attributes(
    first_name: "Admin",
    last_name: "User",
    password: "Password123!",
    password_confirmation: "Password123!",
    role: :admin,
    status: :active,
    tenant: tenant,
    jti: SecureRandom.uuid,
    confirmed_at: Time.current
  )
  admin.save!
  puts "  Created admin: #{admin.email} (password: Password123!)"
else
  puts "  Admin already exists: #{admin.email}"
end

# Create attorney user
attorney = User.find_or_initialize_by(email: "attorney@rfeready.com")
if attorney.new_record?
  attorney.assign_attributes(
    first_name: "Jane",
    last_name: "Attorney",
    password: "Password123!",
    password_confirmation: "Password123!",
    role: :attorney,
    bar_number: "CA-123456",
    status: :active,
    tenant: tenant,
    jti: SecureRandom.uuid,
    confirmed_at: Time.current
  )
  attorney.save!
  puts "  Created attorney: #{attorney.email} (password: Password123!)"
else
  puts "  Attorney already exists: #{attorney.email}"
end

# Create paralegal user
paralegal = User.find_or_initialize_by(email: "paralegal@rfeready.com")
if paralegal.new_record?
  paralegal.assign_attributes(
    first_name: "John",
    last_name: "Paralegal",
    password: "Password123!",
    password_confirmation: "Password123!",
    role: :paralegal,
    status: :active,
    tenant: tenant,
    jti: SecureRandom.uuid,
    confirmed_at: Time.current
  )
  paralegal.save!
  puts "  Created paralegal: #{paralegal.email} (password: Password123!)"
else
  puts "  Paralegal already exists: #{paralegal.email}"
end

# Create a sample case
sample_case = RfeCase.find_or_initialize_by(case_number: "RFE-DEMO-001")
if sample_case.new_record?
  sample_case.assign_attributes(
    tenant: tenant,
    created_by: attorney,
    assigned_attorney: attorney,
    visa_type: "H-1B",
    petitioner_name: "Acme Technology Inc.",
    beneficiary_name: "Sample Beneficiary",
    rfe_received_date: 1.week.ago.to_date,
    rfe_deadline: 80.days.from_now.to_date,
    notes: "Demo case for testing purposes."
  )
  sample_case.save!
  puts "  Created sample case: #{sample_case.case_number}"
else
  puts "  Sample case already exists: #{sample_case.case_number}"
end

puts "Seeding complete!"

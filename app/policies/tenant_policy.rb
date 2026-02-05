class TenantPolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    admin?
  end
end

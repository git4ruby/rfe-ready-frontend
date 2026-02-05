class UserPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    true
  end

  def create?
    admin?
  end

  def update?
    admin?
  end

  def destroy?
    admin?
  end

  def resend_invitation?
    admin?
  end
end

class ExhibitPolicy < ApplicationPolicy
  def show?
    true
  end

  def create?
    can_edit?
  end

  def update?
    can_edit?
  end

  def destroy?
    can_edit?
  end
end

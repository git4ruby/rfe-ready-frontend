class KnowledgeDocPolicy < ApplicationPolicy
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
    admin?
  end
end

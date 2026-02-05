class RfeDocumentPolicy < ApplicationPolicy
  def show?
    true
  end

  def create?
    can_edit?
  end

  class Scope < Scope
    def resolve
      scope.all
    end
  end
end

class DraftResponsePolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    can_edit?
  end

  def approve?
    attorney?
  end

  def regenerate?
    can_edit?
  end
end

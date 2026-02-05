class EvidenceChecklistPolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    can_edit?
  end

  def toggle_collected?
    can_edit?
  end
end

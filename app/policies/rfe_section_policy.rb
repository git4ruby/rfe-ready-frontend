class RfeSectionPolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    can_edit?
  end

  def reclassify?
    can_edit?
  end
end

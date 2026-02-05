class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    true
  end

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

  private

  def admin?
    user.admin?
  end

  def attorney?
    user.admin? || user.attorney?
  end

  def can_edit?
    user.admin? || user.attorney? || user.paralegal?
  end

  class Scope
    attr_reader :user, :scope

    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      scope.all
    end
  end
end

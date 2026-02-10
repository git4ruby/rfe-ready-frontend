class Api::V1::DashboardController < Api::V1::BaseController
  skip_after_action :verify_authorized
  skip_after_action :verify_policy_scoped

  # GET /api/v1/dashboard
  def index
    cases = RfeCase.where(tenant: current_user.tenant)

    render json: {
      data: {
        total_cases: cases.count,
        cases_by_status: cases.group(:status).count,
        approaching_deadlines: cases.approaching_deadline.count,
        recent_cases: CaseSerializer.render_as_hash(
          cases.order(created_at: :desc).limit(5)
        )
      }
    }
  end
end

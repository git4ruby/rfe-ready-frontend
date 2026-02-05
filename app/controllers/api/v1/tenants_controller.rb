class Api::V1::TenantsController < Api::V1::BaseController
  before_action :set_tenant

  # GET /api/v1/tenant
  def show
    authorize @tenant
    render json: { data: TenantSerializer.render_as_hash(@tenant) }
  end

  # PATCH/PUT /api/v1/tenant
  def update
    authorize @tenant

    @tenant.update!(tenant_params)
    render json: { data: TenantSerializer.render_as_hash(@tenant) }
  end

  private

  def set_tenant
    @tenant = current_user.tenant
  end

  def tenant_params
    params.require(:tenant).permit(
      :name,
      :data_retention_days,
      settings: {}
    )
  end
end

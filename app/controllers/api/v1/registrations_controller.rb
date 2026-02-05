class Api::V1::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  before_action :authenticate_user!
  before_action :authorize_admin!

  def create
    build_resource(sign_up_params)
    resource.tenant = current_user.tenant
    resource.jti = SecureRandom.uuid

    if resource.save
      render json: {
        data: {
          id: resource.id,
          type: "user",
          attributes: {
            email: resource.email,
            first_name: resource.first_name,
            last_name: resource.last_name,
            role: resource.role,
            tenant_id: resource.tenant_id
          }
        },
        meta: { message: "User created successfully." }
      }, status: :created
    else
      render json: {
        error: "User could not be created.",
        details: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def sign_up_params
    params.require(:user).permit(
      :email, :password, :password_confirmation,
      :first_name, :last_name, :role, :bar_number
    )
  end

  def authorize_admin!
    unless current_user&.admin?
      render json: { error: "Not authorized." }, status: :forbidden
    end
  end
end

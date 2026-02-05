class Api::V1::RfeSectionsController < Api::V1::BaseController
  before_action :set_case
  before_action :set_section, only: %i[show update reclassify]

  # GET /api/v1/cases/:case_id/rfe_sections
  def index
    authorize @case, :show?
    sections = policy_scope(RfeSection).where(case_id: @case.id).ordered
    render json: { data: RfeSectionSerializer.render_as_hash(sections) }
  end

  # GET /api/v1/cases/:case_id/rfe_sections/:id
  def show
    authorize @section
    render json: { data: RfeSectionSerializer.render_as_hash(@section, view: :detail) }
  end

  # PATCH/PUT /api/v1/cases/:case_id/rfe_sections/:id
  def update
    authorize @section

    @section.update!(section_params)
    render json: { data: RfeSectionSerializer.render_as_hash(@section) }
  end

  # POST /api/v1/cases/:case_id/rfe_sections/:id/reclassify
  def reclassify
    authorize @section, :reclassify?

    @section.update!(section_type: params[:section_type])
    render json: { data: RfeSectionSerializer.render_as_hash(@section) }
  end

  private

  def set_case
    @case = RfeCase.find(params[:case_id])
  end

  def set_section
    @section = @case.rfe_sections.find(params[:id])
  end

  def section_params
    params.require(:rfe_section).permit(
      :section_type,
      :raw_text,
      :position,
      :confidence_score
    )
  end
end

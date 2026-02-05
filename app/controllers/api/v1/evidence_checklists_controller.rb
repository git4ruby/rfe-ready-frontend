class Api::V1::EvidenceChecklistsController < Api::V1::BaseController
  before_action :set_case
  before_action :set_checklist_item, only: %i[update toggle_collected]

  # GET /api/v1/cases/:case_id/evidence_checklists
  def index
    authorize @case, :show?
    items = policy_scope(EvidenceChecklist).where(case_id: @case.id).ordered
    render json: { data: EvidenceChecklistSerializer.render_as_hash(items) }
  end

  # PATCH/PUT /api/v1/cases/:case_id/evidence_checklists/:id
  def update
    authorize @checklist_item

    @checklist_item.update!(checklist_params)
    render json: { data: EvidenceChecklistSerializer.render_as_hash(@checklist_item) }
  end

  # PATCH /api/v1/cases/:case_id/evidence_checklists/:id/toggle_collected
  def toggle_collected
    authorize @checklist_item, :toggle_collected?

    @checklist_item.toggle_collected!
    render json: { data: EvidenceChecklistSerializer.render_as_hash(@checklist_item) }
  end

  private

  def set_case
    @case = RfeCase.find(params[:case_id])
  end

  def set_checklist_item
    @checklist_item = @case.evidence_checklists.find(params[:id])
  end

  def checklist_params
    params.require(:evidence_checklist).permit(
      :document_name,
      :description,
      :priority,
      :is_collected,
      :notes,
      :linked_document_id
    )
  end
end

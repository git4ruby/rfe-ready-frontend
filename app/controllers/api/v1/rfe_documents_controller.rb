class Api::V1::RfeDocumentsController < Api::V1::BaseController
  before_action :set_case
  before_action :set_document, only: :show

  # GET /api/v1/cases/:case_id/rfe_documents
  def index
    authorize @case, :show?
    documents = policy_scope(RfeDocument).where(case_id: @case.id)
    render json: { data: RfeDocumentSerializer.render_as_hash(documents) }
  end

  # GET /api/v1/cases/:case_id/rfe_documents/:id
  def show
    authorize @document
    render json: { data: RfeDocumentSerializer.render_as_hash(@document, view: :detail) }
  end

  # POST /api/v1/cases/:case_id/rfe_documents
  def create
    @document = @case.rfe_documents.new(document_params)
    @document.uploaded_by = current_user
    @document.tenant = current_user.tenant
    authorize @document

    @document.save!
    render json: { data: RfeDocumentSerializer.render_as_hash(@document) }, status: :created
  end

  private

  def set_case
    @case = RfeCase.find(params[:case_id])
  end

  def set_document
    @document = @case.rfe_documents.find(params[:id])
  end

  def document_params
    params.require(:rfe_document).permit(
      :document_type,
      :filename,
      :content_type,
      :file_size,
      :s3_key
    )
  end
end

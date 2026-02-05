class RfeDocumentSerializer < Blueprinter::Base
  identifier :id
  fields :document_type, :filename, :content_type, :file_size, :s3_key,
         :processing_status, :created_at

  view :extended do
    field :extracted_text
    field :ocr_text
    field :processing_metadata
  end
end

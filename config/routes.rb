Rails.application.routes.draw do
  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Authentication (Devise + JWT)
      devise_for :users,
        controllers: {
          sessions: "api/v1/sessions",
          registrations: "api/v1/registrations"
        },
        defaults: { format: :json }

      # Dashboard
      get "dashboard", to: "dashboard#index"

      # Tenant settings (current tenant only)
      resource :tenant, only: [:show, :update]

      # User management (admin)
      resources :users, only: [:index, :show, :update] do
        member do
          post :resend_invitation
        end
      end

      # Cases with nested resources
      resources :cases do
        member do
          post :start_analysis
          patch :assign_attorney
          patch :mark_reviewed
          post :export
        end

        resources :rfe_documents, only: [:index, :show, :create]

        resources :rfe_sections, only: [:index, :show, :update] do
          member do
            post :reclassify
          end
        end

        resources :evidence_checklists, only: [:index, :update] do
          member do
            patch :toggle_collected
          end
        end

        resources :draft_responses, only: [:index, :show, :update] do
          member do
            patch :approve
            post :regenerate
          end
        end

        resources :exhibits
      end

      # Knowledge base
      resources :knowledge_docs
    end
  end
end

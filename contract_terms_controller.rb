class Bo::ContractTermsController < ApplicationController
  include ::CoreAuthenticator

  before_action :set_contract_term, only: [:show, :edit, :update, :destroy]

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  # GET /bo/contract_terms
  # GET /bo/contract_terms.json
  def index
    @contract_terms = policy_scope(Bo::ContractTerm)
                      .order("#{sort_by( %w(label), default: 'label')} #{sort_direction(default: 'asc')}")
                      .page(params[:page])
                      .per(per_page)

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @contract_terms, status: :ok }
    end
  end

  def show
    authorize @contract_term
  end

  def new
    @contract_term = Bo::ContractTerm.new
    authorize @contract_term
  end

  def edit
    authorize @contract_term
  end

  # POST /bo/contract_terms
  # POST /bo/contract_terms.json
  def create
    @contract_term = Bo::ContractTerm.new(contract_term_params)
    authorize @contract_term

    respond_to do |format|
      if @contract_term.save
        format.html { redirect_to @contract_term, notice: 'Contract term was successfully created.' }
        format.json { render json: @contract_term, status: :created, location: @contract_term }
      else
        format.html { render :new }
        format.json { render json: @contract_term.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /bo/contract_terms/1
  # PATCH/PUT /bo/contract_terms/1.json
  def update
    authorize @contract_term

    respond_to do |format|
      if @contract_term.update(contract_term_params)
        format.html { redirect_to @contract_term, notice: 'Contract term was successfully updated.' }
        format.json { render json: @contract_term, status: :ok, location: @contract_term }
      else
        format.html { render :edit }
        format.json { render json: @contract_term.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /bo/contract_terms/1
  # DELETE /bo/contract_terms/1.json
  def destroy
    authorize @contract_term

    @contract_term.destroy
    respond_to do |format|
      format.html { redirect_to bo_contract_terms_url, notice: 'Contract term was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  def set_contract_term
    @contract_term = Bo::ContractTerm.friendly.find(params[:id])
  end

  def contract_term_params
    permitted_attributes = policy(Bo::ContractTerm).permitted_attributes
    params.require(:bo_contract_term).permit(permitted_attributes)
  end
end

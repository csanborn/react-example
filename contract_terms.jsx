import React from 'react';
import ReactDOM from 'react-dom';

class ContractTerms extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            data: [],
            filteredData: []
        };

        this._getInitialData = this._getInitialData.bind(this);
        this._editItem = this._editItem.bind(this);
        this._deleteItem = this._deleteItem.bind(this);
        this._addItem = this._addItem.bind(this);
        this._doSearch = this._doSearch.bind(this);
        this._clearSearch = this._clearSearch.bind(this);
        this._highlight = this._highlight.bind(this);
        this._doSort = this._doSort.bind(this);
    }

    componentDidMount(){
        this._getInitialData();
        // wait until the component mounts before referencing document or jquery
        this._csrfToken = document.querySelector('meta[name="csrf-token"]')['content'];
    }

    render() {
        // console.log("***** render parent")
        return(
            <div>
                <NewItemModal onSubmit={this._addItem} />
                <FormulaLegend />
                { this.state.data.length
                    ? <div>
                        <SearchField inputRef={el => this.searchField = el} onChange={this._doSearch} />
                        <table className="uk-table uk-table-striped uk-table-condensed uk-margin-top">
                            <TableHeader sort={this._doSort} />
                            <tbody>
                            {this.state.filteredData.map((el) =>
                                <ContractTerm
                                    label={el.label}
                                    formula={el.formula}
                                    note={el.note}
                                    id={el.id}
                                    key={el.id}
                                    editHandler = {this._editItem}
                                    deleteHandler = {this._deleteItem}
                                />
                            )}
                            </tbody>
                        </table>
                    </div>
                    : <h3 className="uk-heading-primary uk-margin-top uk-text-center">
                        There aren't any Contract Terms yet. Go ahead and <a href="#contract-term-new" data-uk-modal="{center: true}">add one</a>
                    </h3>
                }
            </div>
        )
    }

    _doSearch(e){
        let query = e.target.value.trim().toLowerCase();
        let data = this.state.data;
        let results = [];

        if( ! query.length ){
            this.setState({filteredData: data});
            return;
        }

        for(let i = 0, len = data.length; i < len; i++){
            if(data[i].label.toLowerCase().indexOf(query) !== -1){
                results.push(data[i]);
            }
        }

        this.setState({filteredData: results});
    }

    _clearSearch(){
        this.searchField.value = '';
    }

    _doSort(ascending){
        let data = this.state.filteredData;

        data.sort(function(a, b){
            if(a.label.toLowerCase() >= b.label.toLowerCase()){
                return ascending ? -1 : 1;
            }
            return ascending ? 1 : -1;
        });

        this.setState({filteredData: data});
    }

    _getInitialData(){
        fetch('/bo/contract_terms.json',{
            method: 'GET',
            credentials: 'same-origin', // need this to pass cookies
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this._csrfToken
            }
        }).then(res => {
            // pass result as json to the next 'then'
            return res.json();
        }).then(response => {
            this.setState({data: response, filteredData: response});
        }).catch(response => {
            UIkit.modal.alert(`<b>Something went wrong when trying to fetch the contract terms:</b><br><br>${response}`);
        });
    }

    _addItem(formData){
        let stateData = this.state.data;
        let modal = UIkit.modal('#contract-term-new');
        let data = {
            bo_contract_term: formData
        };

        data = JSON.stringify(data);

        fetch('/bo/contract_terms.json',{
            method: 'POST',
            body: data,
            credentials: 'same-origin', // need this to pass cookies
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this._csrfToken
            }
        }).then(res => {
            // pass result as json to the next 'then'
            return res.json();
        }).then(response => {
            UIkit.notify('<i class="uk-icon-check"></i> The contract was created successfully.', {status:'success'});
            stateData.unshift(response);
            this._clearSearch();
            // Need to reset fiteredData too or else the new row won't be visible if it doesn't meet the search criteria
            // and will throw an error when trying to highlight it
            this.setState({data: stateData, filteredData: stateData});
            modal.hide();
            this._highlight(response.id);
        }).catch(response => {
            UIkit.modal.alert(`<b>Something went wrong when trying to create the contract:</b><br><br>${response}`);
        });
    }

    _editItem(id, newData){
        let stateData = this.state.data;
        let data = {
            bo_contract_term: {
                label: newData.label,
                formula: newData.formula,
                note: newData.note
            }
        };

        data = JSON.stringify(data);

        fetch(`/bo/contract_terms/${id}.json`,{
            method: 'PUT',
            body: data,
            credentials: 'same-origin', // need this to pass cookies
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this._csrfToken
            }
        }).then(res => {
            // pass result as json to the next 'then'
            return res.json();
        }).then(response => {
            UIkit.notify('<i class="uk-icon-check"></i> The contract was saved successfully.', {status:'success'});

            this._highlight(id);

            // update data
            for(let i = 0, len = stateData.length; i < len; i++){
                if(stateData[i].id === id){
                    stateData.splice(i, 1, response);
                    this.setState({data: stateData});
                    return;
                }
            }
        }).catch(response => {
            UIkit.modal.alert(`<b>Something went wrong when trying to save the contract:</b><br><br>${response}`);
        });
    }

    _deleteItem(id){
        let _this = this;
        let stateData = this.state.data;

        UIkit.modal.confirm('Are you sure you want to delete this contract?', function () {
            fetch(`/bo/contract_terms/${id}.json`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': _this._csrfToken
                }
            }).then( () => {
                UIkit.notify('<i class="uk-icon-check"></i> The contract was deleted.', {status: 'success'});

                for(let i = 0, len = stateData.length; i < len; i++){
                    if(stateData[i].id === id){
                        stateData.splice(i, 1);
                        _this.setState({data: stateData});
                        return;
                    }
                }
            }).catch(response => {
                UIkit.modal.alert(`<b>Something went wrong when trying to delete the contract:</b><br><br>${response}`);
            });
        }, {center: true});
    }

    _highlight(id){
        let item = document.getElementById(`contract${id}`);
        let alpha = 1;
        let originalColor = item.style.backgroundColor;

        let interval = setInterval(function(){
            item.style.backgroundColor = `rgba(255, 255, 0, ${alpha})`;
            alpha -= .1;
            if(alpha < 0){
                clearInterval(interval);
                item.style.backgroundColor = originalColor;
            }
        }, 200);
    }
}


class SearchField extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div className="uk-form-row">
                <div className="uk-form-controls">
                    <input type="text" onChange={this.props.onChange} ref={this.props.inputRef} className="uk-width-1-3 uk-form-large uk-margin-top" placeholder="Search Contract Names"/>
                </div>
            </div>
        )
    }
}

class TableHeader extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            sortAscending: true
        };

        this._doSort = this._doSort.bind(this);
    }

    render(){
        return(
            <thead>
            <tr>
                <th onClick={this._doSort} name="label" className="uk-width-1-10">
                    Label <i className={this.state.sortAscending ? 'uk-icon-angle-down' : 'uk-icon-angle-up'} />
                </th>
                <th className="uk-width-1-10">Formula</th>
                <th className="uk-width-1-10">Note</th>
            </tr>
            </thead>
        )
    }

    _doSort(){
        this.setState({sortAscending: !this.state.sortAscending});
        this.props.sort(this.state.sortAscending);
    }
}

class NewItemModal extends React.Component {
    constructor(props){
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
        this._validateForm = this._validateForm.bind(this);
        this._handleInputChange = this._handleInputChange.bind(this);

        this.state = {
            hasLabelError: false,
            hasFormulaError: false
        };

        this.formData ={
            label: '',
            formula: '',
            note: ''
        }
    }


    render(){
        // console.log("**** render form state-", this.formData);
        return(
            <div className="uk-modal" id="contract-term-new">
                <div className="uk-modal-dialog">
                    <div className="uk-modal-close uk-close" />
                    <div className="uk-modal-header"><h4 className="uk-h4">New Contract Term</h4></div>
                    <form onSubmit={this._onSubmit} className="uk-form uk-form-stacked" id="new_contract_term">
                        <div className="uk-form-row">
                            <label className="uk-form-label" htmlFor="bo_contract_term_label">Label</label>
                            <div className="uk-form-controls">
                                { this.state.hasLabelError
                                    ? <input placeholder="Label can't be blank" onChange={this._handleInputChange} className="uk-form-danger uk-width-1-1" autoFocus="autofocus"  type="text" name="label" />
                                    : <input placeholder="Label" ref={input => this.labelInput = input} defaultValue={this.formData.label} onChange={this._handleInputChange} className="uk-width-1-1" autoFocus="autofocus" type="text" name="label" />
                                }
                            </div>
                            <div className="uk-form-row">
                                <label className="uk-form-label" htmlFor="bo_contract_term_formula">Formula</label>
                                <div className="uk-form-controls">
                                    { this.state.hasFormulaError
                                        ? <input placeholder="Formula can't be blank" onChange={this._handleInputChange} className="uk-form-danger uk-width-1-1" type="text" name="formula" />
                                        : <input placeholder="Formula" ref={input => this.formulaInput = input} defaultValue={this.formData.formula} onChange={this._handleInputChange} className="uk-width-1-1" type="text" name="formula" />
                                    }
                                </div>
                            </div>
                            <div className="uk-form-row">
                                <label className="uk-form-label" htmlFor="bo_contract_term_note">Note</label>
                                <div className="uk-form-controls">
                                    <textarea defaultValue={this.formData.note} ref={input => this.noteInput = input} onChange={this._handleInputChange} className="uk-width-1-1" name="note" />
                                </div>
                            </div>
                        </div>
                        <div className="uk-modal-footer">
                            <button className="uk-button uk-button-primary" name="button" type="submit" >
                                <i className="uk-icon-plus uk-margin-small-right" />
                                Add
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    _onSubmit(e){
        e.preventDefault();

        let data = this.formData;

        if( this._validateForm() ){

            this.formData = {
                label: '',
                formula: '',
                note: ''
            };

            // clear form
            this.labelInput.value = '';
            this.formulaInput.value = '';
            this.noteInput.value = '';

            // submit to parent
            this.props.onSubmit(data);
        }
    }

    _validateForm(){
        let isValid = true;

        // ensure required fields have values
        if( ! this.formData.label.trim().length ){
            this.setState({hasLabelError: true});
            isValid = false;
        }

        if( ! this.formData.formula.trim().length ){
            this.setState({hasFormulaError: true});
            isValid = false;
        }

        return isValid;
    }

    _handleInputChange(e){
        let target = e.target;
        let targetName = target.name;

        // store input value in object
        this.formData[targetName] = target.value;

        // clear errors when input value changes
        if(this.state.hasLabelError && targetName === 'label'){
            this.setState({hasLabelError: false});
        } else if(this.state.hasFormulaError && targetName === 'formula'){
            this.setState({hasFormulaError: false});
        }
    }
}



class ContractTerm extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            isEditing: false,
            hasLabelError: false,
            hasFormulaError: false
        };

        // bind 'this' so it's defined in the callback
        this._editItem = this._editItem.bind(this);
        this._cancelEdit = this._cancelEdit.bind(this);
        this._setNewState = this._setNewState.bind(this);
        this._handleInputChange = this._handleInputChange.bind(this);
        this._validateForm = this._validateForm.bind(this);

        // holds new state values that get passed to the parent's save function
        this._setNewState();
    }

    componentWillReceiveProps(nextProps){
        // close edit fields and buttons if props have changed after Save
        let props = this.props;

        if (props.label !== nextProps.label || props.formula !== nextProps.formula || props.note !== nextProps.note) {
            this.setState({isEditing: false});
        }
    }

    render(){
        // console.log("Render contract")
        return(
            <tr id={`contract${this.props.id}`}>
                <td>
                    { this.state.isEditing
                        ? <div>
                            { this.state.hasLabelError
                                ? <input type="text" name="label" onChange={this._handleInputChange} className='uk-form-danger' placeholder="Label can't be blank" />
                                : <input type="text" name="label" onChange={this._handleInputChange} defaultValue={this.props.label} />
                            }
                            <br/>
                            <Button text="Save" onClick={this._validateForm} className="uk-button uk-button-primary" />
                            <Button text="Cancel" onClick={this._cancelEdit} className="uk-button uk-button-default"/>
                            {/* The pattern below uses an arrow function so you can pass arguments */}
                            <Button text="Delete" onClick={() => this.props.deleteHandler(this.props.id)} className="uk-button uk-button-danger"/>
                        </div>
                        : <div className="editable" onClick={this._editItem}>{this.props.label}</div>
                    }
                </td>
                <td>
                    { this.state.isEditing
                        ? <div>
                            { this.state.hasFormulaError
                                ? <input type="text" name="formula" onChange={this._handleInputChange} className='uk-form-danger' placeholder="Formula can't be blank" />
                                : <input type="text" name="formula" onChange={this._handleInputChange} defaultValue={this.props.formula} />
                            }
                        </div>
                        : this.props.formula
                    }
                </td>
                <td>
                    { this.state.isEditing
                        ? <input type="text" name="note" onChange={this._handleInputChange} defaultValue={this.props.note} />
                        : this.props.note || '-'
                    }
                </td>
            </tr>
        );
    }

    _validateForm(){
        let hasError = false;

        if(this.newState.label.trim().length === 0 ){
            this.setState({hasLabelError: true});
            hasError = true;
        }

        if(this.newState.formula.trim().length === 0 ){
            this.setState({hasFormulaError: true});
            hasError = true;
        }

        if( ! hasError ){
            this.setState({
                hasLabelError: false,
                hasFormulaError: false
            });

            // only submit if data has changed
            if(this.newState.label !== this.props.label || this.newState.formula !== this.props.formula){
                // pass data to edit handler in parent
                this.props.editHandler(this.props.id, this.newState)
            }
        }
    }

    _editItem(){
        // show edit fields and buttons
        this.setState({isEditing: true})
    }

    _cancelEdit(){
        // hide edit fields and buttons
        this.setState({
            isEditing: false,
            hasLabelError: false,
            hasFormulaError: false
        });
        // reset to original state
        this._setNewState();
    }

    _handleInputChange(e){
        // store input value in object
        this.newState[e.target.name] = e.target.value;

        // clear errors when input value changes
        if(e.target.name === 'label' && this.state.hasLabelError){
            this.setState({hasLabelError: false});
        } else if(e.target.name === 'formula' && this.state.hasFormulaError){
            this.setState({hasFormulaError: false});
        }
    }

    _setNewState(){
        this.newState ={
            label: this.props.label,
            formula: this.props.formula,
            note: this.props.note,
            id: this.props.id,
        };
    }
}

class FormulaLegend extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            visible: false
        };

        this._toggleVisibility = this._toggleVisibility.bind(this);
    }

    render(){
        return(
            <div className="legend">
                <h4 className="link" onClick={this._toggleVisibility}>
                    Formula Legend <i className={this.state.visible ? 'uk-icon-angle-up' : 'uk-icon-angle-down'} />
                </h4>
                {this.state.visible
                    ? <div className="uk-grid uk-grid-divider grid">
                        <div className="uk-width-1-2">
                            <div className="uk-panel uk-panel-box">
                                <div className="uk-panel-title">App: Per Installation Count</div>
                                <div className="uk-text-bold uk-text-success">Formula: {'{app_install_count}'} * $n</div>
                                <div className="uk-text-bold uk-text-primary">Example: {'{app_install_count}'} * $0.52</div>
                            </div>
                        </div>
                        <div className="uk-width-1-2">
                            <div className="uk-panel uk-panel-box">
                                <div className="uk-panel-title">App: Per Use (PLACEHOLDER)</div>
                                <div className="uk-text-bold uk-text-success">Formula: {'{app_usage}'} * time_in_minutes / time_in_pool * %</div>
                                <div className="uk-text-bold uk-text-primary">Example: {'{app_usage}'} * 1000 / 12525255 * 10%</div>
                            </div>
                        </div>
                    </div>
                    : null
                }
            </div>
        )
    }

    _toggleVisibility(){
        this.setState({visible: ! this.state.visible});
    }
}

function Button(props){
    return(
        <button className={props.className} onClick={props.onClick}>{props.text}</button>
    )
}

// export default ContractTerms;


document.addEventListener('DOMContentLoaded', () => {
   ReactDOM.render(
       <ContractTerms />,
       document.getElementById('app'),
   )
})
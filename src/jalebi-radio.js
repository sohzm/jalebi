class JalebiRadio extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._options = [];
        this._selectedValue = null;
        this._direction = 'horizontal';
    }

    static get observedAttributes() {
        return ['options', 'value', 'direction'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'options' && newValue) {
            this._options = newValue.split(',').map(option => option.trim());
            this.render();
        } else if (name === 'value' && newValue) {
            this._selectedValue = newValue;
            this.updateSelection();
        } else if (name === 'direction' && newValue) {
            this._direction = newValue === 'vertical' ? 'vertical' : 'horizontal';
            this.render();
        }
    }

    updateSelection() {
        if (!this.shadowRoot) return;

        const inputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
        inputs.forEach(input => {
            if (input.value === this._selectedValue) {
                input.checked = true;
            }
        });
    }

    handleChange(event) {
        this._selectedValue = event.target.value;

        // Dispatch change event
        const changeEvent = new CustomEvent('change', {
            detail: {
                value: this._selectedValue,
            },
            bubbles: true,
            composed: true,
        });

        this.dispatchEvent(changeEvent);
    }

    render() {
        if (!this._options.length) return;

        const direction = this._direction;
        const groupName = `radio-group-${Math.random().toString(36).substring(2, 11)}`;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--font, 'Inter', sans-serif);
                }
                
                .radio-group {
                    display: flex;
                    flex-direction: ${direction === 'vertical' ? 'column' : 'row'};
                    gap: var(--gap-2, 10px);
                }
                
                .radio-option {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                
                input[type="radio"] {
                    position: absolute;
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .radio-control {
                    position: relative;
                    display: inline-block;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 2px solid var(--border-1, #cccccc);
                    background-color: var(--bg-1, #ffffff);
                    margin-right: var(--padding-3, 8px);
                    box-sizing: border-box;
                    transition: border-color 0.2s ease;
                }
                
                input[type="radio"]:checked + .radio-control {
                    border-color: var(--fg-accent, #5c35d9);
                }
                
                input[type="radio"]:checked + .radio-control::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background-color: var(--fg-accent, #5c35d9);
                }
                
                input[type="radio"]:focus + .radio-control {
                    outline: 2px solid var(--fg-accent, #5c35d9);
                    outline-offset: 2px;
                }
                
                .radio-label {
                    color: var(--fg-1, #333333);
                    font-size: 14px;
                }
                
                input[type="radio"]:disabled + .radio-control {
                    background-color: var(--bg-2, #f7f7f7);
                    border-color: var(--border-1, #cccccc);
                    cursor: not-allowed;
                }
                
                input[type="radio"]:disabled ~ .radio-label {
                    color: var(--fg-2, #666666);
                    cursor: not-allowed;
                }
            </style>
            
            <div class="radio-group" role="radiogroup">
                ${this._options
                    .map(
                        (option, index) => `
                    <label class="radio-option">
                        <input 
                            type="radio" 
                            name="${groupName}" 
                            value="${option}"
                            ${this._selectedValue === option ? 'checked' : ''}
                            ${index === 0 && !this._selectedValue ? 'checked' : ''}
                        />
                        <span class="radio-control"></span>
                        <span class="radio-label">${option}</span>
                    </label>
                `
                    )
                    .join('')}
            </div>
        `;

        // Add event listeners
        const radioInputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', this.handleChange.bind(this));
        });

        // Update initial selection
        if (!this._selectedValue && this._options.length > 0) {
            this._selectedValue = this._options[0];
        }
    }
}

customElements.define('jalebi-radio', JalebiRadio);

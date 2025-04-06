class JalebiCheckbox extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Create the internal structure
        this.render();

        // Bind events
        this._checkbox = this.shadowRoot.querySelector('input[type="checkbox"]');
        this._checkbox.addEventListener('change', this._handleChange.bind(this));
        this.addEventListener('keydown', this._handleKeyDown.bind(this));
    }

    static get observedAttributes() {
        return ['checked', 'disabled', 'label', 'label-position'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'checked':
                this._checkbox.checked = this.hasAttribute('checked');
                break;
            case 'disabled':
                this._checkbox.disabled = this.hasAttribute('disabled');
                break;
            case 'label':
                const labelElement = this.shadowRoot.querySelector('label span');
                if (labelElement) {
                    labelElement.textContent = newValue || '';
                }
                break;
            case 'label-position':
                this.render();
                break;
        }
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        if (value) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        if (value) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }

    get label() {
        return this.getAttribute('label') || '';
    }

    set label(value) {
        this.setAttribute('label', value);
    }

    get labelPosition() {
        return this.getAttribute('label-position') || 'right';
    }

    set labelPosition(value) {
        this.setAttribute('label-position', value);
    }

    _handleChange(event) {
        this.checked = event.target.checked;

        // Dispatch custom event
        this.dispatchEvent(
            new CustomEvent('jalebi-change', {
                bubbles: true,
                composed: true,
                detail: {
                    checked: this.checked,
                },
            })
        );
    }

    _handleKeyDown(event) {
        // Handle space key when the component is focused
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            this._checkbox.click();
        }
    }

    render() {
        const label = this.getAttribute('label') || '';
        const labelPosition = this.getAttribute('label-position') || 'right';
        const checked = this.hasAttribute('checked');
        const disabled = this.hasAttribute('disabled');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    align-items: center;
                    font-family: var(--font, 'Inter', sans-serif);
                    color: var(--fg-1, #333333);
                    cursor: pointer;
                    gap: var(--gap-1, 5px);
                }
                
                :host([disabled]) {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: var(--gap-1, 5px);
                }
                
                input[type="checkbox"] {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--fg-1, #333333);
                    background-color: var(--bg-1, #ffffff);
                    cursor: pointer;
                    position: relative;
                    margin: 0;
                    flex-shrink: 0;
                }
                
                input[type="checkbox"]:checked {
                    background-color: var(--fg-1, #333333);
                }
                
                input[type="checkbox"]:checked::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 6px;
                    width: 5px;
                    height: 10px;
                    border: solid var(--bg-1, #ffffff);
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }
                
                input[type="checkbox"]:focus {
                    outline: 2px solid var(--fg-accent, #5c35d9);
                    outline-offset: 1px;
                }
                
                input[type="checkbox"]:disabled {
                    cursor: not-allowed;
                }
                
                label {
                    display: inline-flex;
                    align-items: center;
                    cursor: pointer;
                    user-select: none;
                }
                
                :host([disabled]) label {
                    cursor: not-allowed;
                }
            </style>
            
            <label class="checkbox-container">
                ${labelPosition === 'left' && label ? `<span>${label}</span>` : ''}
                <input type="checkbox" ?checked="${checked}" ?disabled="${disabled}" />
                ${labelPosition === 'right' && label ? `<span>${label}</span>` : ''}
            </label>
        `;

        // Re-assign references after rendering
        this._checkbox = this.shadowRoot.querySelector('input[type="checkbox"]');
        this._checkbox.addEventListener('change', this._handleChange.bind(this));
    }
}

// Define the custom element
customElements.define('jalebi-checkbox', JalebiCheckbox);

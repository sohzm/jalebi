class JalebiInput extends HTMLElement {
    static get observedAttributes() {
        return ['value', 'type', 'required', 'pattern'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._value = '';
        this._isValid = null; // null (initial), true (valid), false (invalid)
        this._isFocused = false;
        this._eventsBound = false;
        this._observer = new MutationObserver(this._handleMutations.bind(this));
    }

    connectedCallback() {
        this._observer.observe(this, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        // Initialize attributes
        this._type = this.getAttribute('type') || 'text';
        this._value = this.getAttribute('value') || '';
        this._required = this.hasAttribute('required');
        this._pattern = this.getAttribute('pattern') || null;

        // Validate initial value
        this.validate();

        // Render initial view
        this.updateView();

        if (!this._eventsBound) {
            this.bindEvents();
            this._eventsBound = true;
        }

        // ARIA attributes
        this.setAttribute('role', 'textbox');
        if (this._required) {
            this.setAttribute('aria-required', 'true');
        }
    }

    disconnectedCallback() {
        this._observer.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this._value = newValue || '';
            this.validate();
            this.updateInputValue();
        } else if (name === 'type') {
            this._type = newValue || 'text';
            this.validate();
            this.updateView();
        } else if (name === 'required') {
            this._required = this.hasAttribute('required');
            this.validate();
            this.updateView();
        } else if (name === 'pattern') {
            this._pattern = newValue || null;
            this.validate();
            this.updateView();
        }
    }

    _handleMutations(mutations) {
        let needsUpdate = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.target === this) {
                needsUpdate = true;
                break;
            }
            if (mutation.type === 'characterData') {
                const target = mutation.target;
                if (target.parentElement && target.parentElement.tagName === 'LABEL') {
                    needsUpdate = true;
                    break;
                }
            }
        }
        if (needsUpdate) {
            this.updateView();
        }
    }

    get _uniqueId() {
        if (!this.__uniqueId) {
            this.__uniqueId = Math.random().toString(36).substring(2, 10);
        }
        return this.__uniqueId;
    }

    get value() {
        return this._value;
    }

    set value(val) {
        const oldValue = this._value;
        if (oldValue !== val) {
            this._value = val;
            this.setAttribute('value', val);
            this.validate();
            this.updateInputValue();
            this.dispatchEvent(
                new CustomEvent('input', {
                    detail: { value: val },
                    bubbles: true,
                    composed: true,
                })
            );
        }
    }

    get type() {
        return this._type;
    }

    set type(val) {
        if (['text', 'email', 'url', 'tel', 'number'].includes(val)) {
            this.setAttribute('type', val);
        }
    }

    validate() {
        if (!this._value && !this._required) {
            this._isValid = null;
            return;
        }

        switch (this._type) {
            case 'email':
                this._isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this._value);
                break;
            case 'url':
                try {
                    new URL(this._value);
                    this._isValid = true;
                } catch {
                    this._isValid = false;
                }
                break;
            case 'tel':
                this._isValid = /^\+?[\d\s-]{10,}$/.test(this._value);
                break;
            case 'number':
                this._isValid = !isNaN(this._value) && this._value.trim() !== '';
                break;
            case 'text':
                if (this._pattern) {
                    const regex = new RegExp(this._pattern);
                    this._isValid = regex.test(this._value);
                } else {
                    this._isValid = this._value.trim() !== '' || !this._required;
                }
                break;
            default:
                this._isValid = this._value.trim() !== '' || !this._required;
        }

        if (this._required && !this._value.trim()) {
            this._isValid = false;
        }
    }

    updateView() {
        if (!this.shadowRoot) return;

        // Only recreate the DOM if it hasn't been initialized
        if (!this.shadowRoot.querySelector('.input-container')) {
            this.shadowRoot.innerHTML = '';
            const view = this.createView();
            this.shadowRoot.appendChild(view);
        }

        // Update input value and container classes
        this.updateInputValue();
        this.updateContainerClasses();

        // Update ARIA attributes
        if (this._isValid === false) {
            this.setAttribute('aria-invalid', 'true');
        } else {
            this.removeAttribute('aria-invalid');
        }
    }

    updateInputValue() {
        const input = this.shadowRoot.querySelector('input');
        if (input && input.value !== this._value) {
            input.value = this._value;
        }
        this.updateContainerClasses();
    }

    updateContainerClasses() {
        const container = this.shadowRoot.querySelector('.input-container');
        if (container) {
            container.classList.remove('valid', 'invalid');
            if (this._isValid === true) {
                container.classList.add('valid');
            } else if (this._isValid === false) {
                container.classList.add('invalid');
            }
        }
    }

    createView() {
        const labelElement = this.querySelector('label');
        const labelText = labelElement ? labelElement.textContent : 'Input';
        const inputId = `input-${this._uniqueId}`;

        const template = document.createElement('div');
        template.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    width: 100%;
                }
                * {
                    box-sizing: border-box;
                    font-size: 12px;
                    font-family: var(--font);
                    user-select: auto;
                }
                .input-container {
                    position: relative;
                    padding: var(--padding-w2);
                    border: 1px solid var(--border-1);
                    border-radius: var(--radius);
                    background-color: var(--bg-1);
                    transition: border-color 0.2s ease;
                    cursor: text;
                }
                :host(:focus-within) .input-container {
                    border-color: var(--fg-accent);
                }
                :host(:focus-within) .input-container.invalid {
                    border-color: var(--fg-red);
                }
                :host(:focus-within) .input-container.valid {
                    border-color: var(--fg-green);
                }
                .input-container:hover {
                    border-color: var(--fg-accent);
                }
                input {
                    width: 100%;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: var(--fg-1);
                    font-size: 12px;
                    padding: 0;
                    position: relative;
                    z-index: 2; /* Ensure input is above label */
                }
                label {
                    position: absolute;
                    top: 50%;
                    left: var(--padding-4);
                    transform: translateY(-50%);
                    color: var(--fg-2);
                    transition: all 0.2s ease;
                    pointer-events: none;
                    z-index: 1; /* Label behind input */
                    font-size: 12px;
                }
                .input-container:focus-within label,
                .input-container:has(input:not(:placeholder-shown)) label {
                    top: -6px;
                    left: var(--padding-3);
                    background: var(--bg-1);
                    transform: translateY(0);
                    padding: 0 var(--padding-3);
                    font-size: 10px;
                }
                input::placeholder {
                    color: transparent;
                }
            </style>
            <div class="input-container">
                <label for="${inputId}">${labelText}</label>
                <input
                    id="${inputId}"
                    type="${this._type}"
                    aria-label="${labelText}"
                    ${this._required ? 'required' : ''}
                    ${this._pattern ? `pattern="${this._pattern}"` : ''}
                    placeholder=" "
                >
            </div>
        `;
        return template;
    }

    bindEvents() {
        // Focus input when clicking anywhere in the container
        this.shadowRoot.addEventListener('click', e => {
            const input = this.shadowRoot.querySelector('input');
            if (input && e.target.closest('.input-container')) {
                input.focus();
            }
        });

        this.shadowRoot.addEventListener('input', e => {
            if (e.target.matches('input')) {
                this.value = e.target.value;
            }
        });

        this.shadowRoot.addEventListener('focusin', e => {
            if (e.target.matches('input')) {
                this._isFocused = true;
                this.updateContainerClasses();
            }
        });

        this.shadowRoot.addEventListener('focusout', e => {
            if (e.target.matches('input')) {
                this._isFocused = false;
                this.updateContainerClasses();
            }
        });

        this.shadowRoot.addEventListener('keydown', e => {
            if (e.target.matches('input') && e.key === 'Enter') {
                const form = this.closest('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
            }
        });
    }
}

customElements.define('jalebi-input', JalebiInput);

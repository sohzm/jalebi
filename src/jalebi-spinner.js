class JalebiSpinner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.size = this.getAttribute('size') || 'medium';
        this.thickness = this.getAttribute('thickness') || '2';
        this.render();
    }

    static get observedAttributes() {
        return ['size', 'thickness'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'size' || name === 'thickness') {
            this[name] = newValue;
            this.render();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }

                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-family: var(--font, sans-serif);
                }
                
                .spinner {
                    display: inline-block;
                    border: ${this.thickness}px solid var(--bg-2);
                    border-top-color: var(--fg-accent);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                .spinner.small {
                    width: 16px;
                    height: 16px;
                }
                
                .spinner.medium {
                    width: 24px;
                    height: 24px;
                }
                
                .spinner.large {
                    width: 32px;
                    height: 32px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            <div class="spinner ${this.size}"></div>
        `;
    }
}

customElements.define('jalebi-spinner', JalebiSpinner);

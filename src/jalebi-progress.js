class JalebiProgress extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.value = this.getAttribute('value') || 0;
        this.max = this.getAttribute('max') || 100;
        this.indeterminate = this.hasAttribute('indeterminate');
        this.rounded = this.hasAttribute('rounded');
        
        this.render();
        this.isReady = true;
    }

    static get observedAttributes() {
        return ['value', 'max', 'indeterminate', 'rounded'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;
        if (name === 'indeterminate') {
            const progress = this.shadowRoot.querySelector('.progress');
            progress.classList.toggle('progress-indeterminate', this.hasAttribute('indeterminate'));
        } else if (name === 'value' || name === 'max') {
            const progressBar = this.shadowRoot.querySelector('.progress-bar');
            this.value = this.getAttribute('value') || 0;
            this.max = this.getAttribute('max') || 100;
            progressBar.style.width = `${(this.value / this.max) * 100}%`;
        } else if (name === 'rounded') {
            this.rounded = this.hasAttribute('rounded');
            this.render();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                
                .progress {
                    width: 100%;
                    height: 8px;
                    background: var(--bg-2);
                    ${this.rounded ? 'border-radius: var(--radius);' : 'border-radius: 0;'}
                    overflow: hidden;
                }
                
                .progress-bar {
                    height: 100%;
                    background: var(--fg-accent);
                    ${this.rounded ? 'border-radius: var(--radius);' : 'border-radius: 0;'}
                    transition: width 0.2s ease;
                }
                
                @keyframes indeterminate {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                
                .progress-indeterminate .progress-bar {
                    width: 50% !important;
                    animation: indeterminate 1.5s infinite linear;
                }
            </style>
            <div class="progress ${this.indeterminate ? 'progress-indeterminate' : ''}">
                <div class="progress-bar" style="width: ${(this.value / this.max) * 100}%"></div>
            </div>
        `;
    }
}

customElements.define('jalebi-progress', JalebiProgress);

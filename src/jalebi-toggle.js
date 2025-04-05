class JalebiToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.checked = this.hasAttribute('checked');

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

                .toggle {
                    position: relative;
                    width: 44px;
                    height: 24px;
                    background: var(--fg-2, #f7f7f7);
                    border-radius: calc(var(--radius-large, 24px) * 10);
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .toggle.checked {
                    background: var(--fg-accent, #5c35d9);
                }

                .thumb {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 20px;
                    height: 20px;
                    background: var(--bg-1, #fff);
                    border-radius: calc(var(--radius-large, 24px) * 10);
                    transition: transform 0.2s;
                }
                .checked .thumb {
                    transform: translateX(20px);
                }
            </style>
            <div class="toggle ${this.checked ? 'checked' : ''}" tabindex="0" role="switch" aria-checked="${this.checked}">
                <div class="thumb"></div>
            </div>
        `;

        this.setupToggle();
        this.setupLabelSupport();
        this.isReady = true;
    }

    setupToggle() {
        const toggle = this.shadowRoot.querySelector('.toggle');
        toggle.addEventListener('click', () => this.toggleChecked());
    }

    setupLabelSupport() {
        if (this.id) {
            const label = document.querySelector(`label[for="${this.id}"]`);
            if (label) {
                label.addEventListener('click', event => {
                    event.preventDefault();
                    this.toggleChecked();
                });
            }
        }
    }

    toggleChecked() {
        this.checked = !this.checked;
        this.shadowRoot.querySelector('.toggle').classList.toggle('checked', this.checked);
        this.shadowRoot.querySelector('.toggle').setAttribute('aria-checked', this.checked);

        const event = new CustomEvent('valuechange', { detail: { value: this.checked } });
        this.dispatchEvent(event);

        if (this.hasAttribute('onvaluechange')) {
            new Function('event', this.getAttribute('onvaluechange')).call(this, event);
        }
    }

    static get observedAttributes() {
        return ['checked'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;
        if (name === 'checked') {
            this.checked = this.hasAttribute('checked');
            const toggle = this.shadowRoot.querySelector('.toggle');
            toggle.classList.toggle('checked', this.checked);
            toggle.setAttribute('aria-checked', this.checked);
        }
    }
}

customElements.define('jalebi-toggle', JalebiToggle);

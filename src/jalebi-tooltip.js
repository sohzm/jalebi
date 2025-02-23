class JalebiTooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.position = this.getAttribute('position') || 'top';
        this.tooltipText = this.getAttribute('tooltip') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                }

                .tooltip-content {
                    position: absolute;
                    visibility: hidden;
                    opacity: 0;
                    padding: var(--padding-w1);
                    background: var(--bg-2);
                    color: var(--fg-1);
                    border-radius: var(--radius);
                    border: 1px solid var(--border-1);
                    font-size: 0.875rem;
                    width: max-content;
                    max-width: 250px;
                    transition: opacity 0.2s, visibility 0.2s;
                    z-index: 1000;
                    white-space: nowrap;
                }

                /* Position variants */
                .tooltip-content[data-position="top"] {
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(-8px);
                }

                .tooltip-content[data-position="bottom"] {
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(8px);
                }

                .tooltip-content[data-position="left"] {
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%) translateX(-8px);
                }

                .tooltip-content[data-position="right"] {
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%) translateX(8px);
                }

                :host(:hover) .tooltip-content {
                    visibility: visible;
                    opacity: 1;
                }
            </style>
            <slot></slot>
            <div class="tooltip-content" data-position="${this.position}">${this.tooltipText}</div>
        `;

        this.isReady = true;
    }

    static get observedAttributes() {
        return ['position', 'tooltip'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;
        if (name === 'position') {
            this.shadowRoot.querySelector('.tooltip-content').dataset.position = newValue;
        } else if (name === 'tooltip') {
            this.shadowRoot.querySelector('.tooltip-content').textContent = newValue;
        }
    }
}

customElements.define('jalebi-tooltip', JalebiTooltip);

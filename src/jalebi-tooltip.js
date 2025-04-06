class JalebiTooltip extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.originalPosition = this.getAttribute('position') || 'top';
        this.position = this.originalPosition;
        this.tooltipText = this.getAttribute('tooltip') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                }
                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-family: var(--font, sans-serif);
                }
                .tooltip-content {
                    position: absolute;
                    visibility: hidden;
                    opacity: 0;
                    padding: var(--padding-w1);
                    font-size: 13px;
                    background: var(--fg-1);
                    color: var(--bg-1);
                    border-radius: var(--radius);
                    width: max-content;
                    max-width: 250px;
                    transition: opacity 0.2s, visibility 0.2s;
                    z-index: 1000;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
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

        this.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        this.isReady = true;
    }

    static get observedAttributes() {
        return ['position', 'tooltip'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;
        if (name === 'position') {
            this.originalPosition = newValue;
            this.setPosition(newValue);
        } else if (name === 'tooltip') {
            this.tooltipText = newValue;
            this.shadowRoot.querySelector('.tooltip-content').textContent = newValue;
        }
    }

    setPosition(pos) {
        this.position = pos;
        const tooltip = this.shadowRoot.querySelector('.tooltip-content');
        if (tooltip) {
            tooltip.dataset.position = pos;
        }
    }

    isTooltipInViewport() {
        const tooltip = this.shadowRoot.querySelector('.tooltip-content');
        const rect = tooltip.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
    }

    handleMouseEnter() {
        const allPositions = ['top', 'right', 'bottom', 'left'];
        const candidates = [this.originalPosition].concat(allPositions.filter(p => p !== this.originalPosition));

        let attempt = 0;

        const tryCandidate = () => {
            const candidate = candidates[attempt];
            this.setPosition(candidate);

            requestAnimationFrame(() => {
                if (this.isTooltipInViewport()) {
                    return;
                } else {
                    attempt++;
                    if (attempt < 3 && attempt < candidates.length) {
                        tryCandidate();
                    } else {
                        this.setPosition(this.originalPosition);
                    }
                }
            });
        };

        requestAnimationFrame(tryCandidate);
    }

    handleMouseLeave() {
        this.setPosition(this.originalPosition);
    }
}

customElements.define('jalebi-tooltip', JalebiTooltip);

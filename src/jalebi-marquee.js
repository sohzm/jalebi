class JalebiMarquee extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.duration = this.getAttribute('duration') || '10s';
        this.direction = this.getAttribute('direction') || 'to-left';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    overflow: hidden;
                    position: relative;
                }
                .marquee {
                    display: flex;
                    white-space: nowrap;
                    will-change: transform;
                }
                .group {
                    display: inline-flex;
                }
                @keyframes marquee-left {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }
                @keyframes marquee-right {
                    from {
                        transform: translateX(-50%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            </style>
            <div class="marquee">
                <div class="group" id="group1"></div>
                <div class="group" id="group2"></div>
            </div>
            <slot style="display: none"></slot>
        `;

        this._slot = this.shadowRoot.querySelector('slot');
        this._group1 = this.shadowRoot.getElementById('group1');
        this._group2 = this.shadowRoot.getElementById('group2');
        this._marquee = this.shadowRoot.querySelector('.marquee');

        this._slot.addEventListener('slotchange', () => {
            requestAnimationFrame(() => this._updateMarquee());
        });

        window.addEventListener('resize', (this._resizeHandler = () => this._updateMarquee()));

        requestAnimationFrame(() => this._updateMarquee());
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this._resizeHandler);
    }

    _updateMarquee() {
        this._group1.innerHTML = '';
        this._group2.innerHTML = '';

        const nodes = this._slot
            .assignedNodes({ flatten: true })
            .filter(n => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0));

        if (nodes.length === 0) return;

        nodes.forEach(node => {
            this._group1.appendChild(node.cloneNode(true));
        });

        const containerWidth = this.offsetWidth;
        if (containerWidth <= 0) return;

        let totalWidth = this._group1.scrollWidth;

        while (totalWidth < containerWidth) {
            nodes.forEach(node => {
                this._group1.appendChild(node.cloneNode(true));
            });
            totalWidth = this._group1.scrollWidth;
        }

        this._group2.innerHTML = this._group1.innerHTML;

        const animationDuration = this._calculateAnimationDuration(totalWidth);

        const animationName = this.direction === 'to-right' ? 'marquee-right' : 'marquee-left';
        this._marquee.style.animation = `${animationName} ${animationDuration} linear infinite`;

        this._marquee.style.animation = 'none';
        this._marquee.offsetWidth;
        this._marquee.style.animation = `${animationName} ${animationDuration} linear infinite`;
    }

    _calculateAnimationDuration(totalWidth) {
        const baseSpeed = 100; // pixels per second
        const durationInSeconds = totalWidth / baseSpeed;

        return `${durationInSeconds}s`;
    }

    static get observedAttributes() {
        return ['duration', 'direction'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === 'duration' || name === 'direction') && this.__group1 && this.__group2) {
            this[name] = newValue;
            this._updateMarquee();
        }
    }
}

customElements.define('jalebi-marquee', JalebiMarquee);

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
                        transform: translateX(-100%);
                    }
                }
                @keyframes marquee-right {
                    from {
                        transform: translateX(-100%);
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

        const scrollDistance = this._group1.scrollWidth / 2;

        if (this._dynamicStyle) {
            this._dynamicStyle.remove();
        }
        this._dynamicStyle = document.createElement('style');

        let keyframes = '';
        if (this.direction === 'to-right') {
            keyframes = `
            @keyframes marqueeAnimation {
                from { transform: translateX(-${scrollDistance}px); }
                to { transform: translateX(0); }
            }
        `;
        } else {
            // default to left
            keyframes = `
            @keyframes marqueeAnimation {
                from { transform: translateX(0); }
                to { transform: translateX(-${scrollDistance}px); }
            }
        `;
        }
        this._dynamicStyle.textContent = keyframes;
        this.shadowRoot.appendChild(this._dynamicStyle);

        this._marquee.style.animation = 'none';
        void this._marquee.offsetWidth;
        this._marquee.style.animation = `marqueeAnimation ${this.duration} linear infinite`;
    }

    static get observedAttributes() {
        return ['duration', 'direction'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === 'duration' || name === 'direction') && this._group1 && this._group2) {
            this[name] = newValue;
            this._updateMarquee();
        }
    }
}

customElements.define('jalebi-marquee', JalebiMarquee);

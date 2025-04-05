class JalebiMarquee extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
        this._resizeObserver = null;
        this._debounceTimeout = null;
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
                    width: 100%;
                }
                .marquee {
                    display: flex;
                    white-space: nowrap;
                    will-change: transform;
                }
                .group {
                    display: inline-flex;
                    flex-shrink: 0;
                }
                /* Base keyframes defined in static CSS */
                @keyframes marquee-left {
                    from { transform: translateX(0); }
                    to { transform: translateX(-100%); }
                }
                @keyframes marquee-right {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
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

        // Listen for slot changes
        this._slot.addEventListener('slotchange', () => {
            this._debounceUpdate();
        });

        // Use ResizeObserver instead of window resize event
        this._resizeObserver = new ResizeObserver(entries => {
            this._debounceUpdate();
        });
        this._resizeObserver.observe(this);

        // Initial update with a small delay to ensure proper rendering
        setTimeout(() => {
            this.isReady = true;
            this._updateMarquee();
        }, 50);
    }

    disconnectedCallback() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
        }
    }

    _debounceUpdate() {
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
        }
        this._debounceTimeout = setTimeout(() => {
            this._updateMarquee();
        }, 100);
    }

    _updateMarquee() {
        if (!this.isReady || !this.isConnected) return;

        // Clear previous content
        this._group1.innerHTML = '';
        this._group2.innerHTML = '';

        // Get assigned nodes
        const nodes = this._slot
            .assignedNodes({ flatten: true })
            .filter(n => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0));

        if (nodes.length === 0) return;

        // Clone nodes to first group
        nodes.forEach(node => {
            this._group1.appendChild(node.cloneNode(true));
        });

        // Check if container has width
        const containerWidth = this.offsetWidth;
        if (containerWidth <= 0) {
            // If container width is not available yet, try again later
            requestAnimationFrame(() => this._updateMarquee());
            return;
        }

        // Fill first group until it's wider than container
        let contentWidth = this._group1.scrollWidth;
        while (contentWidth < containerWidth * 2) {
            nodes.forEach(node => {
                this._group1.appendChild(node.cloneNode(true));
            });
            contentWidth = this._group1.scrollWidth;
        }

        // Clone first group to second group for seamless looping
        this._group2.innerHTML = this._group1.innerHTML;

        // Create dynamic animation based on content width
        if (this._dynamicStyle) {
            this._dynamicStyle.remove();
        }

        this._dynamicStyle = document.createElement('style');
        const animationName = `marquee-animation-${Math.floor(Math.random() * 1000000)}`;

        const keyframes =
            this.direction === 'to-right'
                ? `@keyframes ${animationName} {
                 from { transform: translateX(-${contentWidth}px); }
                 to { transform: translateX(0); }
               }`
                : `@keyframes ${animationName} {
                 from { transform: translateX(0); }
                 to { transform: translateX(-${contentWidth}px); }
               }`;

        this._dynamicStyle.textContent = keyframes;
        this.shadowRoot.appendChild(this._dynamicStyle);

        // Reset animation to ensure it restarts properly
        this._marquee.style.animation = 'none';

        // Force reflow
        void this._marquee.offsetWidth;

        // Start animation
        const durationInMs = parseFloat(this.duration) * (this.duration.includes('ms') ? 1 : this.duration.includes('s') ? 1000 : 10000);

        // Scale duration based on content width to maintain consistent speed
        const scaledDuration = Math.max(5, contentWidth / 100) + 's';

        this._marquee.style.animation = `${animationName} ${this.duration} linear infinite`;
    }

    static get observedAttributes() {
        return ['duration', 'direction'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady || oldValue === newValue) return;

        if (name === 'duration' || name === 'direction') {
            this[name] = newValue;
            this._debounceUpdate();
        }
    }
}

customElements.define('jalebi-marquee', JalebiMarquee);

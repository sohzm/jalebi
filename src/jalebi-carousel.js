class JalebiCarousel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentIndex = 0;
        this.autoplayInterval = null;
        this.isDragging = false;
        this.startX = 0;
        this.isHovered = false;
    }

    static get observedAttributes() {
        return ['autoplay', 'interval', 'hide-controls', 'indicator-type', 'indicator-position'];
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    font-family: var(--font);
                    --indicator-size: 8px;
                    --indicator-length: 20px; /* For dash and continuous line */
                    --indicator-spacing: 10px;
                    --indicator-color: var(--bg-3);
                    --indicator-active-color: var(--fg-1);
                }
                
                .carousel-container {
                    position: relative;
                    overflow: hidden;
                    border-radius: var(--radius-large);
                    box-shadow: var(--drop-shadow);
                }
                
                .slides {
                    display: flex;
                    transition: transform 0.5s ease-in-out;
                    touch-action: pan-y;
                }
                
                ::slotted(*) {
                    flex: 0 0 100%;
                    scroll-snap-align: start;
                    transition: opacity 0.3s;
                }
                
                .nav-button {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    transition: background 0.3s, opacity 0.3s;
                    opacity: 0;
                }
                
                .nav-button:hover {
                    background: rgba(0, 0, 0, 0.8);
                }
                
                .prev {
                    left: 10px;
                    z-index: 1;
                }
                
                .next {
                    right: 10px;
                    z-index: 1;
                }
                
                .indicators {
                    display: flex;
                    gap: var(--indicator-spacing);
                    justify-content: center;
                }
                
                .indicators-internal {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1;
                }
                
                .indicators-external {
                    margin-top: 10px;
                }
                
                /* Dot indicator style */
                .indicator-dot {
                    width: var(--indicator-size);
                    height: var(--indicator-size);
                    background: var(--indicator-color);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background 0.3s, transform 0.3s;
                }
                
                .indicator-dot.active {
                    background: var(--indicator-active-color);
                    transform: scale(1.2);
                }
                
                /* Dash indicator style */
                .indicator-dash {
                    width: var(--indicator-length);
                    height: 4px;
                    background: var(--indicator-color);
                    cursor: pointer;
                    transition: background 0.3s, transform 0.3s;
                }
                
                .indicator-dash.active {
                    background: var(--indicator-active-color);
                    transform: scaleY(1.2);
                }
                
                /* Continuous line indicator style */
                .indicator-line {
                    height: 4px;
                    background: var(--indicator-color);
                    flex: 1;
                    cursor: pointer;
                    transition: background 0.3s, transform 0.3s;
                }
                
                .indicator-line.active {
                    background: var(--indicator-active-color);
                    transform: scaleY(1.2);
                }
                
                /* Continuous line container needs special styling */
                .indicators-line-container {
                    display: flex;
                    width: 100%;
                    max-width: 80%;
                    gap: 0;
                }
                
                @media (max-width: 600px) {
                    .nav-button {
                        width: 30px;
                        height: 30px;
                    }
                }
                
                /* Show buttons on hover */
                :host(:hover) .nav-button:not(.hidden) {
                    opacity: 1;
                }
                
                /* Always show buttons when there are multiple slides */
                :host([has-multiple-slides]) .nav-button:not(.hidden) {
                    opacity: 0.5;
                }
                
                :host([has-multiple-slides]:hover) .nav-button:not(.hidden) {
                    opacity: 1;
                }
                
                /* Hide controls */
                .hidden {
                    display: none !important;
                }
            </style>
            
            <div class="carousel-container">
                <button class="nav-button prev">&#10094;</button>
                <div class="slides">
                    <slot></slot>
                </div>
                <button class="nav-button next">&#10095;</button>
                <div class="indicators indicators-internal"></div>
            </div>
            <div class="indicators indicators-external"></div>
        `;

        this.slidesContainer = this.shadowRoot.querySelector('.slides');
        this.prevButton = this.shadowRoot.querySelector('.prev');
        this.nextButton = this.shadowRoot.querySelector('.next');
        this.internalIndicatorsContainer = this.shadowRoot.querySelector('.indicators-internal');
        this.externalIndicatorsContainer = this.shadowRoot.querySelector('.indicators-external');

        this.prevButton.addEventListener('click', () => this.prev());
        this.nextButton.addEventListener('click', () => this.next());

        this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => {
            this.updateIndicators();
            this.resetAutoplay();
        });

        this.setupTouchEvents();
        this.setupAutoplay();
        this.updateControlsVisibility();
        this.updateIndicators();
    }

    setupTouchEvents() {
        this.slidesContainer.addEventListener('touchstart', e => {
            this.isDragging = true;
            this.startX = e.touches[0].clientX;
        });

        this.slidesContainer.addEventListener('touchmove', e => {
            if (!this.isDragging) return;
            const currentX = e.touches[0].clientX;
            const diff = this.startX - currentX;
            if (Math.abs(diff) > 50) {
                this.isDragging = false;
                diff > 0 ? this.next() : this.prev();
            }
        });

        this.slidesContainer.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }

    setupAutoplay() {
        if (!this.hasAttribute('autoplay')) return;

        const interval = parseInt(this.getAttribute('interval')) || 3000;

        if (!this.autoplayInterval) {
            this.autoplayInterval = setInterval(() => {
                this.next();
            }, interval);
        }
    }

    pauseAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    resumeAutoplay() {
        if (this.hasAttribute('autoplay') && !this.autoplayInterval && !this.isHovered) {
            this.setupAutoplay();
        }
    }

    resetAutoplay() {
        if (this.hasAttribute('autoplay')) {
            this.pauseAutoplay();
            this.setupAutoplay();
        }
    }

    updateControlsVisibility() {
        const hideControls = this.hasAttribute('hide-controls');

        if (hideControls) {
            this.prevButton.classList.add('hidden');
            this.nextButton.classList.add('hidden');
        } else {
            this.prevButton.classList.remove('hidden');
            this.nextButton.classList.remove('hidden');
        }
    }

    updateIndicators() {
        const slides = this.getSlides();
        const indicatorType = this.getAttribute('indicator-type') || 'dot';
        const indicatorPosition = this.getAttribute('indicator-position') || 'internal';

        // Determine which indicator container to use
        const activeContainer = indicatorPosition === 'external' ? this.externalIndicatorsContainer : this.internalIndicatorsContainer;

        // Hide the inactive container
        this.internalIndicatorsContainer.style.display = indicatorPosition === 'internal' ? 'flex' : 'none';
        this.externalIndicatorsContainer.style.display = indicatorPosition === 'external' ? 'flex' : 'none';

        // Clear the container
        activeContainer.innerHTML = '';

        // Update navigation button visibility
        const showButtons = slides.length > 1 && !this.hasAttribute('hide-controls');
        this.prevButton.style.display = showButtons ? 'block' : 'none';
        this.nextButton.style.display = showButtons ? 'block' : 'none';

        // Set attribute for CSS styling
        if (slides.length > 1) {
            this.setAttribute('has-multiple-slides', '');
        } else {
            this.removeAttribute('has-multiple-slides');
        }

        // Special container for continuous line
        let indicatorsContainer = activeContainer;
        if (indicatorType === 'line') {
            indicatorsContainer = document.createElement('div');
            indicatorsContainer.className = 'indicators-line-container';
            activeContainer.appendChild(indicatorsContainer);
        }

        // Create indicators based on type
        slides.forEach((_, index) => {
            const indicator = document.createElement('div');

            // Set class based on indicator type
            switch (indicatorType) {
                case 'dash':
                    indicator.className = 'indicator-dash';
                    break;
                case 'line':
                    indicator.className = 'indicator-line';
                    break;
                case 'dot':
                default:
                    indicator.className = 'indicator-dot';
                    break;
            }

            indicator.addEventListener('click', () => this.goTo(index));
            indicatorsContainer.appendChild(indicator);
        });

        this.updateIndicatorStyles();
    }

    updateIndicatorStyles() {
        const indicatorType = this.getAttribute('indicator-type') || 'dot';
        const indicatorPosition = this.getAttribute('indicator-position') || 'internal';

        // Determine which indicator container to use
        const activeContainer = indicatorPosition === 'external' ? this.externalIndicatorsContainer : this.internalIndicatorsContainer;

        // Get the correct selector based on indicator type
        let indicatorSelector;
        switch (indicatorType) {
            case 'dash':
                indicatorSelector = '.indicator-dash';
                break;
            case 'line':
                indicatorSelector = '.indicator-line';
                break;
            case 'dot':
            default:
                indicatorSelector = '.indicator-dot';
                break;
        }

        // Find the indicator container if it's a line type
        const container = indicatorType === 'line' ? activeContainer.querySelector('.indicators-line-container') : activeContainer;

        if (!container) return;

        const indicators = container.querySelectorAll(indicatorSelector);
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }

    getSlides() {
        const slides = Array.from(this.querySelectorAll(':scope > *'));
        // Validate current index
        if (slides.length === 0) return [];
        this.currentIndex = Math.max(0, Math.min(this.currentIndex, slides.length - 1));
        return slides;
    }

    goTo(index) {
        const slides = this.getSlides();
        if (index < 0 || index >= slides.length) return;

        this.currentIndex = index;
        this.updateTransform();
        this.updateIndicatorStyles();
        this.resetAutoplay();
    }

    prev() {
        const slides = this.getSlides();
        if (slides.length === 0) return;

        this.currentIndex = (this.currentIndex - 1 + slides.length) % slides.length;
        this.updateTransform();
        this.updateIndicatorStyles();
        this.resetAutoplay();
    }

    next() {
        const slides = this.getSlides();
        if (slides.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % slides.length;
        this.updateTransform();
        this.updateIndicatorStyles();
        this.resetAutoplay();
    }

    updateTransform() {
        const offset = -this.currentIndex * 100;
        this.slidesContainer.style.transform = `translateX(${offset}%)`;
    }

    disconnectedCallback() {
        this.pauseAutoplay();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'autoplay' || name === 'interval') {
            this.pauseAutoplay();
            this.setupAutoplay();
        } else if (name === 'hide-controls') {
            this.updateControlsVisibility();
        } else if (name === 'indicator-type' || name === 'indicator-position') {
            this.updateIndicators();
        }
    }
}

customElements.define('jalebi-carousel', JalebiCarousel);

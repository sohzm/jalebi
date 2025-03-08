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
        return ['autoplay', 'interval'];
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    font-family: var(--font);
                    --indicator-size: 8px;
                    --indicator-spacing: 10px;
                    --indicator-color: var(--fg-1);
                    --indicator-active-color: var(--fg-accent);
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
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: var(--indicator-spacing);
                }
                
                .indicator {
                    width: var(--indicator-size);
                    height: var(--indicator-size);
                    background: var(--indicator-color);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background 0.3s, transform 0.3s;
                }
                
                .indicator.active {
                    background: var(--indicator-active-color);
                    transform: scale(1.2);
                }
                
                @media (max-width: 600px) {
                    .nav-button {
                        width: 30px;
                        height: 30px;
                    }
                }
                
                /* Show buttons on hover */
                :host(:hover) .nav-button {
                    opacity: 1;
                }
                
                /* Always show buttons when there are multiple slides */
                :host([has-multiple-slides]) .nav-button {
                    opacity: 0.5;
                }
                
                :host([has-multiple-slides]:hover) .nav-button {
                    opacity: 1;
                }
            </style>
            
            <div class="carousel-container">
                <button class="nav-button prev">&#10094;</button>
                <div class="slides">
                    <slot></slot>
                </div>
                <button class="nav-button next">&#10095;</button>
                <div class="indicators"></div>
            </div>
        `;

        this.slidesContainer = this.shadowRoot.querySelector('.slides');
        this.prevButton = this.shadowRoot.querySelector('.prev');
        this.nextButton = this.shadowRoot.querySelector('.next');
        this.indicatorsContainer = this.shadowRoot.querySelector('.indicators');

        this.prevButton.addEventListener('click', () => this.prev());
        this.nextButton.addEventListener('click', () => this.next());

        this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => {
            this.updateIndicators();
            this.resetAutoplay();
        });

        this.setupTouchEvents();
        this.setupAutoplay();
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

    updateIndicators() {
        const slides = this.getSlides();
        this.indicatorsContainer.innerHTML = '';

        // Update navigation button visibility
        const showButtons = slides.length > 1;
        this.prevButton.style.display = showButtons ? 'block' : 'none';
        this.nextButton.style.display = showButtons ? 'block' : 'none';

        // Set attribute for CSS styling
        if (showButtons) {
            this.setAttribute('has-multiple-slides', '');
        } else {
            this.removeAttribute('has-multiple-slides');
        }

        slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'indicator';
            indicator.addEventListener('click', () => this.goTo(index));
            this.indicatorsContainer.appendChild(indicator);
        });

        this.updateIndicatorStyles();
    }

    updateIndicatorStyles() {
        const indicators = this.indicatorsContainer.querySelectorAll('.indicator');
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
        }
    }
}

customElements.define('jalebi-carousel', JalebiCarousel);

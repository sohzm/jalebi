class JalebiTabs extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
        this._activeTab = 0;
    }

    connectedCallback() {
        if (this.hasAttribute('active-tab')) {
            this._activeTab = parseInt(this.getAttribute('active-tab'), 10) || 0;
        }

        this.render();
        this.isReady = true;
    }

    static get observedAttributes() {
        return ['active-tab'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;

        if (name === 'active-tab') {
            const newTabIndex = parseInt(newValue, 10) || 0;
            this.selectTab(newTabIndex);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--font, sans-serif);
                }
                
                * {
                    box-sizing: border-box;
                    user-select: none;
                }
                
                .tabs-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }
                
                .tab-headers {
                    display: flex;
                    background: var(--bg-1);
                    position: relative;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                
                .tab-headers::-webkit-scrollbar {
                    display: none;
                }
                
                .tab-header {
                    padding: var(--padding-w2);
                    color: var(--fg-2);
                    cursor: pointer;
                    position: relative;
                    user-select: none;
                    border-bottom: 4px solid var(--bg-3);
                    flex: 1 1 0%;
                    text-align: center;
                    font-weight: 500;
                }
                
                .tab-header:hover {
                    background-color: var(--bg-2);
                }
                
                .tab-header.active {
                    color: var(--fg-1);
                    border-bottom: 4px solid var(--fg-1);
                }
                
                .tab-content-container {
                    padding: var(--padding-4);
                    background: var(--bg-1);
                    border-bottom-left-radius: var(--radius);
                    border-bottom-right-radius: var(--radius);
                }
                
                .tab-content {
                    display: none;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                .tab-content.active {
                    display: block;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                /* Scrollable tabs with shadows */
                .tab-headers-container {
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                }
                
                .shadow-left, .shadow-right {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 24px;
                    pointer-events: none;
                    z-index: 1;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                
                .shadow-left {
                    left: 0;
                    background: linear-gradient(90deg, var(--bg-1) 0%, transparent 100%);
                }
                
                .shadow-right {
                    right: 0;
                    background: linear-gradient(90deg, transparent 0%, var(--bg-1) 100%);
                }
                
                .show-left-shadow .shadow-left {
                    opacity: 1;
                }
                
                .show-right-shadow .shadow-right {
                    opacity: 1;
                }
                
                /* Navigation arrows for mobile */
                .tab-nav-arrows {
                    display: none;
                }
                
                @media (max-width: 768px) {
                    .tab-nav-arrows {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 8px;
                    }
                    
                    .tab-nav-arrow {
                        background: var(--bg-2);
                        border: 1px solid var(--border-1);
                        border-radius: var(--radius);
                        padding: 4px 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .tab-nav-arrow:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                }
            </style>
            
            <div class="tabs-container">
                <div class="tab-headers-container">
                    <div class="shadow-left"></div>
                    <div class="tab-headers"></div>
                    <div class="shadow-right"></div>
                </div>
                <div class="tab-content-container">
                    <slot></slot>
                </div>
                <div class="tab-nav-arrows">
                    <button class="tab-nav-arrow prev" aria-label="Previous tab">&#10094;</button>
                    <button class="tab-nav-arrow next" aria-label="Next tab">&#10095;</button>
                </div>
            </div>
        `;

        this.setupTabs();
        this.addEventListeners();
    }

    setupTabs() {
        const tabSlot = this.shadowRoot.querySelector('slot');
        const tabHeaders = this.shadowRoot.querySelector('.tab-headers');

        tabSlot.addEventListener('slotchange', () => {
            this.updateTabs();
        });

        this.updateTabs();
    }

    updateTabs() {
        const tabHeaders = this.shadowRoot.querySelector('.tab-headers');
        const tabContents = Array.from(this.querySelectorAll('jalebi-tab'));

        // Clear existing tab headers
        tabHeaders.innerHTML = '';

        // Create tab headers
        tabContents.forEach((tab, index) => {
            const tabHeader = document.createElement('div');
            tabHeader.className = 'tab-header';
            tabHeader.textContent = tab.getAttribute('label') || `Tab ${index + 1}`;
            tabHeader.dataset.index = index;

            // Set icon if present
            const icon = tab.getAttribute('icon');
            if (icon) {
                tabHeader.innerHTML = `
                    ${icon}
                    <span>${tabHeader.textContent}</span>
                `;
            }

            tabHeaders.appendChild(tabHeader);
        });

        // Initially hide all tab contents except the active one
        tabContents.forEach((tab, index) => {
            tab.style.display = index === this._activeTab ? 'block' : 'none';
        });

        // Set initial active tab
        this.selectTab(this._activeTab);

        // Update shadow indicators
        this.updateScrollShadows();
    }

    addEventListeners() {
        const tabHeaders = this.shadowRoot.querySelector('.tab-headers');
        const headersContainer = this.shadowRoot.querySelector('.tab-headers-container');
        const prevButton = this.shadowRoot.querySelector('.tab-nav-arrow.prev');
        const nextButton = this.shadowRoot.querySelector('.tab-nav-arrow.next');

        // Tab selection
        tabHeaders.addEventListener('click', e => {
            const tabHeader = e.target.closest('.tab-header');
            if (tabHeader) {
                const index = parseInt(tabHeader.dataset.index, 10);
                this.selectTab(index);
            }
        });

        // Scroll shadow indicators
        tabHeaders.addEventListener('scroll', () => {
            this.updateScrollShadows();
        });

        // Navigation arrows
        prevButton.addEventListener('click', () => {
            this.navigateTab(-1);
        });

        nextButton.addEventListener('click', () => {
            this.navigateTab(1);
        });

        // Check for overflow on resize
        window.addEventListener('resize', () => {
            this.updateScrollShadows();
        });
    }

    selectTab(index) {
        if (index < 0) return;

        const tabHeaders = Array.from(this.shadowRoot.querySelectorAll('.tab-header'));
        const tabContents = Array.from(this.querySelectorAll('jalebi-tab'));

        if (index >= tabContents.length) return;

        // Update active state
        this._activeTab = index;

        // Update tab headers
        tabHeaders.forEach((header, i) => {
            header.classList.toggle('active', i === index);
        });

        // Update tab contents - explicitly set display style
        tabContents.forEach((content, i) => {
            const isActive = i === index;
            content.setAttribute('active', isActive ? '' : null);
            content.classList.toggle('active', isActive);
            content.style.display = isActive ? 'block' : 'none';
        });

        // Ensure the selected tab is visible
        if (tabHeaders[index]) {
            this.scrollTabIntoView(tabHeaders[index]);
        }

        // Dispatch change event
        this.dispatchEvent(
            new CustomEvent('tabchange', {
                detail: { index, tabId: tabContents[index]?.id || null },
                bubbles: true,
                composed: true,
            })
        );
    }

    navigateTab(direction) {
        const tabContents = this.querySelectorAll('jalebi-tab');
        const newIndex = this._activeTab + direction;

        if (newIndex >= 0 && newIndex < tabContents.length) {
            this.selectTab(newIndex);
        }
    }

    scrollTabIntoView(tabHeader) {
        if (!tabHeader) return;

        const tabHeaders = this.shadowRoot.querySelector('.tab-headers');
        const headerRect = tabHeader.getBoundingClientRect();
        const containerRect = tabHeaders.getBoundingClientRect();

        if (headerRect.left < containerRect.left) {
            tabHeaders.scrollLeft += headerRect.left - containerRect.left - 16;
        } else if (headerRect.right > containerRect.right) {
            tabHeaders.scrollLeft += headerRect.right - containerRect.right + 16;
        }
    }

    updateScrollShadows() {
        const tabHeaders = this.shadowRoot.querySelector('.tab-headers');
        const container = this.shadowRoot.querySelector('.tab-headers-container');

        const hasLeftScroll = tabHeaders.scrollLeft > 0;
        const hasRightScroll = tabHeaders.scrollLeft < tabHeaders.scrollWidth - tabHeaders.clientWidth - 1;

        container.classList.toggle('show-left-shadow', hasLeftScroll);
        container.classList.toggle('show-right-shadow', hasRightScroll);

        // Update nav buttons state
        const prevButton = this.shadowRoot.querySelector('.tab-nav-arrow.prev');
        const nextButton = this.shadowRoot.querySelector('.tab-nav-arrow.next');

        if (prevButton && nextButton) {
            prevButton.disabled = !hasLeftScroll;
            nextButton.disabled = !hasRightScroll;
        }
    }
}

class JalebiTab extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();

        // Initialize visibility based on parent's active tab
        if (this.parentElement && this.parentElement.tagName === 'JALEBI-TABS') {
            const index = Array.from(this.parentElement.children).indexOf(this);
            const isActive = index === parseInt(this.parentElement.getAttribute('active-tab') || 0, 10);
            this.style.display = isActive ? 'block' : 'none';
        }
    }

    static get observedAttributes() {
        return ['active'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'active') {
            this.updateVisibility(newValue !== null);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .tab-panel {
                    display: block;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>
            
            <div class="tab-panel" role="tabpanel">
                <slot></slot>
            </div>
        `;
    }

    updateVisibility(isVisible) {
        // This method is now mainly handled by the parent component
        // which directly sets the style.display property
        const tabPanel = this.shadowRoot.querySelector('.tab-panel');
        if (tabPanel) {
            tabPanel.style.animation = isVisible ? 'fadeIn 0.3s ease-in-out' : 'none';
        }
    }
}

customElements.define('jalebi-tabs', JalebiTabs);
customElements.define('jalebi-tab', JalebiTab);

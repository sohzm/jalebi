class JalebiAccordion extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.allowMultiple = false;
    }

    connectedCallback() {
        this.allowMultiple = this.hasAttribute('allow-multiple');
        this.render();
        this.setupItems();
    }

    static get observedAttributes() {
        return ['allow-multiple'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'allow-multiple') {
            this.allowMultiple = this.hasAttribute('allow-multiple');
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--font, sans-serif);
                    --icon-size: 16px;
                    width: 100%;
                }
                
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                .accordion {
                    border-radius: var(--radius, 4px);
                    overflow: hidden;
                }
                
                ::slotted(jalebi-accordion-item:not(:first-child)) {
                    border-top: 1px solid var(--border-1, #cccccc);
                }
            </style>
            
            <div class="accordion">
                <slot></slot>
            </div>
        `;
    }

    setupItems() {
        const slot = this.shadowRoot.querySelector('slot');
        slot.addEventListener('slotchange', () => {
            this.updateItems();
        });

        this.updateItems();
    }

    updateItems() {
        const items = this.querySelectorAll('jalebi-accordion-item');
        items.forEach((item, index) => {
            item.setAttribute('data-index', index);
            item.addEventListener('toggle', this.handleItemToggle.bind(this));
        });
    }

    handleItemToggle(event) {
        if (!this.allowMultiple) {
            const toggledItem = event.target;
            const isExpanded = toggledItem.hasAttribute('expanded');

            if (isExpanded) {
                const items = this.querySelectorAll('jalebi-accordion-item');
                items.forEach(item => {
                    if (item !== toggledItem && item.hasAttribute('expanded')) {
                        item.removeAttribute('expanded');
                    }
                });
            }
        }

        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('accordion-change', {
                detail: {
                    index: parseInt(event.target.getAttribute('data-index'), 10),
                    expanded: event.target.hasAttribute('expanded'),
                },
                bubbles: true,
                composed: true,
            })
        );
    }
}

class JalebiAccordionItem extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.isReady = true;
    }

    static get observedAttributes() {
        return ['expanded', 'title', 'icon'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;

        if (name === 'expanded') {
            this.updateExpandedState();
        } else if (name === 'title' || name === 'icon') {
            this.updateHeader();
        }
    }

    render() {
        const title = this.getAttribute('title') || 'Accordion Item';
        const icon = this.getAttribute('icon') || '';
        const isExpanded = this.hasAttribute('expanded');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: var(--bg-1, #ffffff);
                }
                
                * {
                    box-sizing: border-box;
                    user-select: none;
                }
                
                .accordion-item {
                    width: 100%;
                }
                
                .accordion-header {
                    display: flex;
                    align-items: center;
                    padding: var(--padding-w2, 8px 16px);
                    cursor: pointer;
                    background: var(--bg-1, #ffffff);
                    font-size: 14px;
                    transition: background-color 0.2s;
                    min-height: 48px;
                }
                
                .accordion-header:hover {
                    background-color: var(--bg-2, #f7f7f7);
                }
                
                .accordion-title {
                    flex: 1;
                    font-weight: 500;
                    color: var(--fg-1, #333333);
                    display: flex;
                    align-items: center;
                    gap: var(--gap-2, 10px);
                    font-size: 16px;
                }
                
                .icon-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .toggle-icon {
                    transition: transform 0.3s;
                    color: var(--fg-1);
                }
                
                .toggle-icon.expanded {
                    transform: rotate(180deg);
                }
                
                .accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                    background: var(--bg-1, #ffffff);
                    will-change: max-height;
                }
                
                .accordion-content.expanded {
                    max-height: 1000px; /* Arbitrary large value, will be adjusted by JS */
                }
                
                .accordion-content-inner {
                    padding: var(--padding-4, 16px);
                    overflow: hidden;
                }
                
                /* Animation for content */
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .expanded .accordion-content-inner {
                    animation: slideDown 0.3s ease-out;
                }
            </style>
            
            <div class="accordion-item">
                <div class="accordion-header" role="button" aria-expanded="${isExpanded}" tabindex="0">
                    <div class="accordion-title">
                        ${icon ? `<div class="icon-container">${icon}</div>` : ''}
                        <span>${title}</span>
                    </div>
                    <div class="toggle-icon ${isExpanded ? 'expanded' : ''}">
                        <svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </div>
                </div>
                <div class="accordion-content ${isExpanded ? 'expanded' : ''}">
                    <div class="accordion-content-inner">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;

        if (isExpanded) {
            this.updateExpandedState();
        }
    }

    setupEventListeners() {
        const header = this.shadowRoot.querySelector('.accordion-header');

        header.addEventListener('click', () => {
            this.toggleExpanded();
        });

        header.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleExpanded();
            }
        });

        // Listen for slot changes to adjust content height
        const slot = this.shadowRoot.querySelector('slot');
        slot.addEventListener('slotchange', () => {
            if (this.hasAttribute('expanded')) {
                this.adjustContentHeight();
            }
        });

        // No need for this transitionend listener anymore as we handle it
        // directly in the updateExpandedState method
    }

    toggleExpanded() {
        if (this.hasAttribute('expanded')) {
            this.removeAttribute('expanded');
        } else {
            this.setAttribute('expanded', '');
        }

        // Dispatch toggle event
        this.dispatchEvent(
            new CustomEvent('toggle', {
                bubbles: true,
                composed: true,
                detail: { expanded: this.hasAttribute('expanded') },
            })
        );
    }

    updateExpandedState() {
        const header = this.shadowRoot.querySelector('.accordion-header');
        const toggleIcon = this.shadowRoot.querySelector('.toggle-icon');
        const content = this.shadowRoot.querySelector('.accordion-content');
        const contentInner = this.shadowRoot.querySelector('.accordion-content-inner');
        const isExpanded = this.hasAttribute('expanded');

        header.setAttribute('aria-expanded', isExpanded);
        toggleIcon.classList.toggle('expanded', isExpanded);

        if (isExpanded) {
            // First, ensure the content class is set to expanded
            content.classList.add('expanded');

            // Calculate and set the height
            setTimeout(() => {
                const height = contentInner.offsetHeight;
                content.style.maxHeight = `${height}px`;

                // After transition completes, set to 'none' to handle dynamic content
                const transitionEndHandler = () => {
                    content.style.maxHeight = 'none';
                    content.removeEventListener('transitionend', transitionEndHandler);
                };
                content.addEventListener('transitionend', transitionEndHandler);
            }, 10);
        } else {
            // First set a fixed height based on current height before starting to collapse
            content.style.maxHeight = `${content.scrollHeight}px`;

            // Force reflow
            content.offsetHeight;

            // Remove expanded class
            content.classList.remove('expanded');

            // Set height to 0 to trigger collapse animation
            setTimeout(() => {
                content.style.maxHeight = '0';
            }, 10);
        }
    }

    updateHeader() {
        const titleElement = this.shadowRoot.querySelector('.accordion-title span');
        const iconContainer = this.shadowRoot.querySelector('.icon-container');

        if (titleElement) {
            titleElement.textContent = this.getAttribute('title') || 'Accordion Item';
        }

        if (this.hasAttribute('icon')) {
            if (!iconContainer) {
                const newIconContainer = document.createElement('div');
                newIconContainer.className = 'icon-container';
                newIconContainer.innerHTML = this.getAttribute('icon');

                const titleElement = this.shadowRoot.querySelector('.accordion-title');
                titleElement.insertBefore(newIconContainer, titleElement.firstChild);
            } else {
                iconContainer.innerHTML = this.getAttribute('icon');
            }
        } else if (iconContainer) {
            iconContainer.remove();
        }
    }

    // This method is no longer needed as we've integrated
    // the height calculation directly in updateExpandedState
}

customElements.define('jalebi-accordion', JalebiAccordion);
customElements.define('jalebi-accordion-item', JalebiAccordionItem);

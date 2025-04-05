class DraggableDialog extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // State variables
        this.isVisible = false;
        this.isDragging = false;
        this.startY = 0;
        this.currentY = 0;
        this.initialTranslateY = 0;

        // Bind methods to this
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.toggle = this.toggle.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.dragMove = this.dragMove.bind(this);
        this.endDrag = this.endDrag.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
    }

    static get observedAttributes() {
        return ['title', 'visible', 'no-header'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'title') {
            const titleElement = this.shadowRoot.querySelector('.dialog-title');
            if (titleElement) titleElement.textContent = newValue;
        }

        if (name === 'visible') {
            this.isVisible = newValue === 'true';
            const dialog = this.shadowRoot.querySelector('.dialog');
            if (dialog) {
                if (this.isVisible) {
                    dialog.classList.remove('hidden');

                    // Call opened method on first slotted element if it exists
                    const content = this.querySelector('[slot="content"]');
                    if (content && typeof content.opened === 'function') {
                        content.opened();
                    }
                } else {
                    dialog.classList.add('hidden');
                }
            }
        }

        if (name === 'no-header') {
            this.render();
            this.setupEventListeners();

            // Re-initialize visibility state after re-render
            this.isVisible = this.getAttribute('visible') === 'true';
            const dialog = this.shadowRoot.querySelector('.dialog');
            if (dialog) {
                if (this.isVisible) {
                    dialog.classList.remove('hidden');
                } else {
                    dialog.classList.add('hidden');
                }
            }

            // Re-initialize draggable functionality
            setTimeout(() => this.initDraggableSheet(), 0);
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();

        // Initial state
        this.isVisible = this.getAttribute('visible') === 'true';
        const dialog = this.shadowRoot.querySelector('.dialog');
        if (dialog) {
            if (this.isVisible) {
                dialog.classList.remove('hidden');
            } else {
                dialog.classList.add('hidden');
            }
        }

        // Initialize draggable functionality after DOM is ready
        setTimeout(() => this.initDraggableSheet(), 0);
    }

    render() {
        const title = this.getAttribute('title') || '';
        const hasNoHeader = this.hasAttribute('no-header');

        this.shadowRoot.innerHTML = `
            <style>
                .dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 100;
                    transition: all 0.1s ease;
                }
                
                .dialog.hidden {
                    display: none;
                }
                
                .dialog-bg {
                    background-color: var(--fg-2);
                    opacity: 0.3;
                    width: 100%;
                    height: 100%;
                    transition: all 0.3s ease;
                }
                
                .dialog-content {
                    background-color: var(--bg-1);
                    padding: 0;
                    border-radius: var(--radius-large);
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    max-width: 1010px;
                    max-height: 730px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    will-change: transform;
                }
                
                .dialog-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: var(--padding-w2);
                    border-bottom: 1px solid var(--bg-3);
                    font-weight: 400;
                    user-select: none;
                }
                
                .dialog-sheet-holder-area {
                    height: 40px;
                    width: calc(100% - 120px);
                    background-color: transparent;
                    position: absolute;
                    top: 7px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-radius: 10px;
                    cursor: pointer;
                    display: none;
                    z-index: 1;
                    user-select: none;
                }
                
                .dialog-sheet-holder {
                    height: 5px;
                    width: 100px;
                    background-color: var(--bg-3);
                    position: absolute;
                    top: 7px;
                    left: 50%;
                    transform: translateX(-50%);
                    border-radius: 10px;
                    display: none;
                    z-index: 1;
                    pointer-events: none;
                    transition: background-color 0.2s;
                }
                
                .dialog-sheet-holder.active {
                    background-color: var(--bg-2);
                }
                
                .dialog-close {
                    outline: none;
                    border: none;
                    background-color: transparent;
                    color: var(--fg-1);
                    cursor: pointer;
                    padding: var(--padding-2);
                    border-radius: 999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    transition: background-color 0.2s;
                    user-select: none;
                }
                
                .dialog-close:hover {
                    background-color: var(--bg-3);
                }
                
                .dialog-body {
                    position: relative;
                    overflow: auto;
                    height: 100%;
                }

                .dialog-title {
                    font-size: large;
                    font-weight: 500;
                }
                
                @media (max-width: 900px) {
                    .dialog-content {
                        top: auto;
                        bottom: 0;
                        left: 0;
                        transform: translateY(100%);
                        width: 100%;
                        height: 90%;
                        max-width: 100%;
                        max-height: 100%;
                        border-radius: 0;
                        border-top-left-radius: var(--radius-large);
                        border-top-right-radius: var(--radius-large);
                    }
                    
                    .dialog-content.visible {
                        transform: translateY(0);
                    }
                    
                    .dialog-sheet-holder, .dialog-sheet-holder-area {
                        display: block;
                    }
                    
                    .dialog-sheet-holder-area {
                        cursor: grab;
                    }
                    
                    .dialog-sheet-holder-area.active {
                        cursor: grabbing;
                    }
                    
                    .dialog-close {
                        display: none;
                    }

                    .dialog-title {
                        text-align: center;
                        width: 100%;
                        margin-top: 10px;
                    }
                }
            </style>
            
            <div class="dialog hidden">
                <div class="dialog-bg"></div>
                <div class="dialog-content">
                    <div class="dialog-sheet-holder-area"></div>
                    <div class="dialog-sheet-holder"></div>
                    
                    ${
                        hasNoHeader
                            ? ''
                            : `
                    <div class="dialog-header">
                        <span class="dialog-title">${title}</span>
                        <button class="dialog-close"><?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)"><path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426" stroke="var(--fg-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> </button>
                    </div>
                    `
                    }
                    
                    <div class="dialog-body">
                        ${hasNoHeader ? '<slot name="header"></slot>' : ''}
                        <slot name="content"></slot>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const closeButton = this.shadowRoot.querySelector('.dialog-close');
        const backdrop = this.shadowRoot.querySelector('.dialog-bg');

        if (closeButton) {
            closeButton.addEventListener('click', this.hide);
        }

        if (backdrop) {
            backdrop.addEventListener('click', this.handleBackdropClick);
        }
    }

    handleBackdropClick(e) {
        if (e.target === this.shadowRoot.querySelector('.dialog-bg')) {
            this.hide();
        }
    }

    show() {
        const dialog = this.shadowRoot.querySelector('.dialog');
        const dialogContent = this.shadowRoot.querySelector('.dialog-content');
        const dialogBg = this.shadowRoot.querySelector('.dialog-bg');
        const isMobile = window.matchMedia('(max-width: 900px)').matches;

        // First make dialog visible
        dialog.classList.remove('hidden');
        this.setAttribute('visible', 'true');

        // Set initial state for transition
        dialogBg.style.opacity = '0';

        if (isMobile) {
            // Mobile: Start from bottom (translateY(100%))
            dialogContent.style.transform = 'translateY(100%)';
        } else {
            // Desktop: Reset to center position
            dialogContent.style.transform = 'translate(-50%, -50%)';
        }

        // Force reflow
        void dialogContent.offsetWidth;

        // Animate in
        dialogBg.style.opacity = '0.3';

        if (isMobile) {
            // Mobile: Slide up from bottom
            dialogContent.style.transform = 'translateY(0)';
        }
    }

    hide() {
        const dialogContent = this.shadowRoot.querySelector('.dialog-content');
        const dialogBg = this.shadowRoot.querySelector('.dialog-bg');
        const isMobile = window.matchMedia('(max-width: 900px)').matches;

        if (isMobile) {
            // Mobile: animate out by sliding down
            dialogContent.style.transform = 'translateY(100%)';
            dialogBg.style.opacity = '0';

            // Wait for animation to complete before hiding
            setTimeout(() => {
                this.setAttribute('visible', 'false');
            }, 300);
        } else {
            // Desktop: hide immediately
            this.setAttribute('visible', 'false');
        }
    }

    toggle() {
        if (this.getAttribute('visible') === 'true') {
            this.hide();
        } else {
            this.show();
        }
    }

    initDraggableSheet() {
        if (window.innerWidth > 900) return;

        const sheetHolder = this.shadowRoot.querySelector('.dialog-sheet-holder-area');
        const dialogContent = this.shadowRoot.querySelector('.dialog-content');
        const dialog = this.shadowRoot.querySelector('.dialog');

        if (!sheetHolder || !dialogContent || !dialog) return;

        sheetHolder.addEventListener('mousedown', this.startDrag);
        sheetHolder.addEventListener('touchstart', this.startDrag, { passive: true });
    }

    startDrag(e) {
        this.isDragging = true;
        this.startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        const dialogContent = this.shadowRoot.querySelector('.dialog-content');
        const transform = window.getComputedStyle(dialogContent).transform;
        if (transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            this.initialTranslateY = matrix.m42;
        } else {
            this.initialTranslateY = 0;
        }

        document.addEventListener('mousemove', this.dragMove);
        document.addEventListener('touchmove', this.dragMove, { passive: false });
        document.addEventListener('mouseup', this.endDrag);
        document.addEventListener('touchend', this.endDrag);

        const sheetHolder = this.shadowRoot.querySelector('.dialog-sheet-holder');
        if (sheetHolder) {
            sheetHolder.classList.add('active');
        }

        const sheetHolderArea = this.shadowRoot.querySelector('.dialog-sheet-holder-area');
        if (sheetHolderArea) {
            sheetHolderArea.classList.add('active');
        }
    }

    dragMove(e) {
        if (!this.isDragging) return;

        if (e.cancelable) e.preventDefault();

        const dialogContent = this.shadowRoot.querySelector('.dialog-content');
        const dialogBg = this.shadowRoot.querySelector('.dialog-bg');

        this.currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const deltaY = this.currentY - this.startY;

        this.applyTransform(deltaY, dialogContent, dialogBg);
    }

    applyTransform(y, dialogContent, dialogBg) {
        const isMobile = window.matchMedia('(max-width: 900px)').matches;

        if (isMobile) {
            // Only allow downward dragging in mobile view (positive y)
            if (y > 0) {
                // Apply elastic effect for dragging down
                const elasticY = Math.pow(y, 0.8);
                dialogContent.style.transform = `translateY(${elasticY}px)`;

                // Reduce backdrop opacity as dialog is dragged down
                const opacity = Math.max(0.3 - elasticY / 1000, 0);
                dialogBg.style.opacity = opacity.toString();
            } else if (y < 0) {
                // Allow slight upward drag with resistance
                const reducedUpwardY = y * 0.3;
                dialogContent.style.transform = `translateY(${reducedUpwardY}px)`;
            }
        } else {
            // Desktop behavior: center-positioned dialog
            const elasticY = y > 0 ? Math.pow(y, 0.8) : y;
            dialogContent.style.transform = `translate(-50%, -50%) translateY(${elasticY}px)`;

            const opacity = Math.max(0.3 - Math.abs(elasticY) / 1000, 0);
            dialogBg.style.opacity = opacity.toString();
        }
    }

    endDrag(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        document.removeEventListener('mousemove', this.dragMove);
        document.removeEventListener('touchmove', this.dragMove);
        document.removeEventListener('mouseup', this.endDrag);
        document.removeEventListener('touchend', this.endDrag);

        const sheetHolder = this.shadowRoot.querySelector('.dialog-sheet-holder');
        if (sheetHolder) {
            sheetHolder.classList.remove('active');
        }

        const sheetHolderArea = this.shadowRoot.querySelector('.dialog-sheet-holder-area');
        if (sheetHolderArea) {
            sheetHolderArea.classList.remove('active');
        }

        const dialogContent = this.shadowRoot.querySelector('.dialog-content');
        const dialogBg = this.shadowRoot.querySelector('.dialog-bg');

        const transform = window.getComputedStyle(dialogContent).transform;
        const matrix = new DOMMatrix(transform);
        let translateY;

        const isMobile = window.matchMedia('(max-width: 900px)').matches;
        if (isMobile) {
            translateY = matrix.m42;
        } else {
            translateY = matrix.m42 - matrix.m43; // Adjusting for translate(-50%, -50%)
        }

        // If dragged down enough, dismiss the dialog
        if (translateY > 80) {
            dialogContent.style.transition = 'all 0.3s ease-out';

            if (isMobile) {
                dialogContent.style.transform = 'translateY(100%)';
            } else {
                dialogContent.style.transform = 'translate(-50%, -50%) translateY(100%)';
            }

            dialogBg.style.opacity = '0';

            setTimeout(() => {
                this.hide();

                // Reset for next open
                dialogContent.style.transition = 'all 0.3s ease';
            }, 300);
        } else {
            // Spring back to normal position
            dialogContent.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            if (isMobile) {
                dialogContent.style.transform = 'translateY(0)';
            } else {
                dialogContent.style.transform = 'translate(-50%, -50%)';
            }

            dialogBg.style.opacity = '0.3';

            setTimeout(() => {
                dialogContent.style.transition = 'all 0.3s ease';
            }, 500);
        }
    }
}

// Define the custom element
customElements.define('draggable-dialog', DraggableDialog);

class JalebiBreadcrumbs extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isReady = false;
    }

    connectedCallback() {
        this.render();
        this.isReady = true;
    }

    static get observedAttributes() {
        return ['separator'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isReady) return;
        if (name === 'separator') {
            this.render();
        }
    }

    render() {
        // Get the separator from the attribute or use a default
        const separator = this.getAttribute('separator') || '/';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--font, sans-serif);
                }
                
                * {
                    box-sizing: border-box;
                }
                
                .breadcrumbs {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    padding: var(--padding-2, 4px) 0;
                    list-style: none;
                    margin: 0;
                }
                
                ::slotted(jalebi-breadcrumb) {
                    display: flex;
                    align-items: center;
                }
                
                ::slotted(jalebi-breadcrumb:not(:last-child))::after {
                    content: "${separator}";
                    margin: 0 var(--padding-2, 4px);
                    color: var(--fg-2, #666666);
                }
                
                ::slotted(jalebi-breadcrumb:last-child) {
                    color: var(--fg-1, #333333);
                    font-weight: 500;
                    pointer-events: none;
                }
                
                @media (max-width: 480px) {
                    /* On mobile, truncate or collapse breadcrumbs as needed */
                    .breadcrumbs {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    ::slotted(jalebi-breadcrumb) {
                        white-space: nowrap;
                    }
                }
            </style>
            
            <nav aria-label="Breadcrumb">
                <ol class="breadcrumbs">
                    <slot></slot>
                </ol>
            </nav>
        `;
    }
}

class JalebiBreadcrumb extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['href', 'active', 'icon'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
    }

    render() {
        const href = this.getAttribute('href') || '#';
        const isActive = this.hasAttribute('active');
        const icon = this.getAttribute('icon') || '';
        const target = this.getAttribute('target') || '_self';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    align-items: center;
                    font-size: 14px;
                }
                
                a, span {
                    color: ${isActive ? 'var(--fg-1, #333333)' : 'var(--fg-accent, #5c35d9)'};
                    text-decoration: ${isActive ? 'none' : 'hover' in window ? 'none' : 'underline'};
                    font-weight: ${isActive ? '500' : 'normal'};
                    display: inline-flex;
                    align-items: center;
                    gap: var(--padding-1, 2px);
                }
                
                @media (hover: hover) {
                    a:hover {
                        text-decoration: underline;
                        color: ${isActive ? 'var(--fg-1, #333333)' : 'var(--fg-accent-dark, #4925b3)'};
                    }
                }
                
                .icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: var(--padding-1, 2px);
                }
            </style>
            
            ${
                isActive
                    ? `<span aria-current="page">
                    ${icon ? `<span class="icon">${icon}</span>` : ''}
                    <slot></slot>
                </span>`
                    : `<a href="${href}" target="${target}">
                    ${icon ? `<span class="icon">${icon}</span>` : ''}
                    <slot></slot>
                </a>`
            }
        `;
    }
}

customElements.define('jalebi-breadcrumbs', JalebiBreadcrumbs);
customElements.define('jalebi-breadcrumb', JalebiBreadcrumb);

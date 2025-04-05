class JalebiBreadcrumbs extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['data-breadcrumb', 'type', 'max-elements'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-breadcrumb' || name === 'type' || name === 'max-elements') {
            this.render();
        }
    }

    // Timer for temporary expanded view
    expandTimeout = null;

    render() {
        // Get the breadcrumb type (slash or arrow) or default to arrow
        const type = this.getAttribute('type') || 'arrow';

        // Define separator SVGs
        const slashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="separator-icon">
            <path fill-rule="evenodd" d="M10.074 2.047a.75.75 0 0 1 .449.961L6.705 13.507a.75.75 0 0 1-1.41-.513L9.113 2.496a.75.75 0 0 1 .961-.449Z" clip-rule="evenodd" />
        </svg>`;

        const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="separator-icon">
            <path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>`;

        const moreDotsIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4" width="16" height="16">
  <path d="M2 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM12.5 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
</svg>`;

        // Choose the separator based on type
        const separator = type === 'slash' ? slashSvg : arrowSvg;

        // CSS styles
        const styles = `
            :host {
                display: block;
                font-family: var(--font, sans-serif);
            }
            
            * {
                box-sizing: border-box;
                font-weight: 500;
            }
            
            .breadcrumbs {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                padding: var(--padding-2) 0;
                list-style: none;
                margin: 0;
            }
            
            .breadcrumb-item {
                display: flex;
                align-items: center;
                font-size: 15px;
                opacity: 0.6;
            }

            .breadcrumb-item:hover {
                opacity: 1;
                transition: opacity 0.2s ease;
            }

            .breadcrumb-item:last-child {
                opacity: 1;
            }
            
            .breadcrumb-link {
                color: var(--fg-1);
                text-decoration: none;
                display: inline-flex;
                align-items: center;
            }
            
            .breadcrumb-link:hover {
                text-decoration: underline;
                color: var(--fg-1);
            }
            
            .separator {
                display: inline-flex;
                align-items: center;
                margin: 0 var(--padding-3);
                color: var(--fg-1);
                opacity: 0.6;
            }
            
            .separator-icon {
                width: 16px;
                height: 16px;
            }
            
            .more-dots {
                display: inline-flex;
                align-items: center;
                color: var(--fg-1);
                margin: 0 var(--padding-3);
                cursor: pointer;
                transition: transform 0.2s ease, color 0.2s ease;
                opacity: 0.6;
            }
            
            .more-dots:hover {
                color: var(--fg-1);
                opacity: 1;
                transform: scale(1.1);
            }
            
            .more-dots-icon {
                width: 20px;
                height: 20px;
            }
            
            .breadcrumbs.expanded {
                animation: fadeIn 0.3s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0.7; }
                to { opacity: 1; }
            }
            
            .breadcrumb-item:last-child .breadcrumb-link {
                color: var(--fg-1);
                font-weight: 500;
                pointer-events: none;
            }
            
            @media (max-width: 480px) {
                .breadcrumbs {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                
                .breadcrumb-item {
                    white-space: nowrap;
                }
            }
        `;

        // Get the breadcrumb data
        const breadcrumbData = this.parseBreadcrumbData();

        // Get max elements to display
        const maxElements = parseInt(this.getAttribute('max-elements')) || breadcrumbData.length;

        // Generate breadcrumb HTML
        let breadcrumbsHTML = '';

        // Check if we need to limit the displayed elements and show "more" dots
        const needsMoreDots = breadcrumbData.length > maxElements && maxElements >= 2;

        if (needsMoreDots) {
            // Always show the first item
            const firstItem = breadcrumbData[0];
            breadcrumbsHTML += `
                <li class="breadcrumb-item">
                    <a href="${firstItem.url}" class="breadcrumb-link">${firstItem.label}</a>
                </li>
            `;

            // Add more dots
            breadcrumbsHTML += `
                <li class="more-dots" aria-label="More breadcrumbs" title="More breadcrumbs">
                    ${moreDotsIcon}
                </li>
            `;

            // Show the last (maxElements-1) items (since we already showed the first one)
            const remainingItems = breadcrumbData.slice(-(maxElements - 1));

            remainingItems.forEach((item, index) => {
                const isLast = index === remainingItems.length - 1;

                // Create breadcrumb item
                breadcrumbsHTML += `
                    <li class="breadcrumb-item">
                        ${
                            isLast
                                ? `<span class="breadcrumb-link" aria-current="page">${item.label}</span>`
                                : `<a href="${item.url}" class="breadcrumb-link">${item.label}</a>`
                        }
                    </li>
                `;

                // Add separator if not the last item
                if (!isLast) {
                    breadcrumbsHTML += `
                        <li class="separator" aria-hidden="true">
                            ${separator}
                        </li>
                    `;
                }
            });
        } else {
            // Show all items (or up to maxElements)
            const displayItems = breadcrumbData.slice(0, maxElements);

            displayItems.forEach((item, index) => {
                const isLast = index === displayItems.length - 1;

                // Create breadcrumb item
                breadcrumbsHTML += `
                    <li class="breadcrumb-item">
                        ${
                            isLast
                                ? `<span class="breadcrumb-link" aria-current="page">${item.label}</span>`
                                : `<a href="${item.url}" class="breadcrumb-link">${item.label}</a>`
                        }
                    </li>
                `;

                // Add separator if not the last item
                if (!isLast) {
                    breadcrumbsHTML += `
                        <li class="separator" aria-hidden="true">
                            ${separator}
                        </li>
                    `;
                }
            });
        }

        // Set inner HTML
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <nav aria-label="Breadcrumb">
                <ol class="breadcrumbs" data-separator-type="${type}">
                    ${breadcrumbsHTML}
                </ol>
            </nav>
        `;

        // Add click event listener to the more dots element
        const moreDotsElement = this.shadowRoot.querySelector('.more-dots');
        if (moreDotsElement) {
            moreDotsElement.addEventListener('click', () => this.expandBreadcrumbs());
        }
    }

    parseBreadcrumbData() {
        const breadcrumbData = [];
        const dataAttr = this.getAttribute('data-breadcrumb');

        if (!dataAttr) return breadcrumbData;

        // Split the data attribute by comma to get each breadcrumb item
        const items = dataAttr.split(',');

        items.forEach(item => {
            // Split each item by colon to get label and URL
            const [label, url] = item.split(':');

            if (label && url) {
                breadcrumbData.push({
                    label: label.trim(),
                    url: url.trim(),
                });
            }
        });

        return breadcrumbData;
    }

    // Method to temporarily show all breadcrumbs
    expandBreadcrumbs() {
        // Clear any existing timeout
        if (this.expandTimeout) {
            clearTimeout(this.expandTimeout);
        }

        // Set a temporary attribute to show all breadcrumbs
        this.setAttribute('expanded', 'true');

        // Create a new render with all items
        this.renderExpanded();

        // Set timeout to revert back after 5 seconds
        this.expandTimeout = setTimeout(() => {
            this.removeAttribute('expanded');
            this.render();
        }, 5000);
    }

    // Special render method for expanded view
    renderExpanded() {
        // Get the breadcrumb type (slash or arrow) or default to arrow
        const type = this.getAttribute('type') || 'arrow';

        // Define separator SVG
        const slashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="separator-icon">
            <path fill-rule="evenodd" d="M10.074 2.047a.75.75 0 0 1 .449.961L6.705 13.507a.75.75 0 0 1-1.41-.513L9.113 2.496a.75.75 0 0 1 .961-.449Z" clip-rule="evenodd" />
        </svg>`;

        const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="separator-icon">
            <path fill-rule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
        </svg>`;

        // Choose the separator based on type
        const separator = type === 'slash' ? slashSvg : arrowSvg;

        // Get the breadcrumb data - show ALL items
        const breadcrumbData = this.parseBreadcrumbData();

        // Generate breadcrumb HTML for ALL items
        let breadcrumbsHTML = '';

        breadcrumbData.forEach((item, index) => {
            const isLast = index === breadcrumbData.length - 1;

            // Create breadcrumb item
            breadcrumbsHTML += `
                <li class="breadcrumb-item">
                    ${
                        isLast
                            ? `<span class="breadcrumb-link" aria-current="page">${item.label}</span>`
                            : `<a href="${item.url}" class="breadcrumb-link">${item.label}</a>`
                    }
                </li>
            `;

            // Add separator if not the last item
            if (!isLast) {
                breadcrumbsHTML += `
                    <li class="separator" aria-hidden="true">
                        ${separator}
                    </li>
                `;
            }
        });

        // Get the same styles from render()
        const styles = this.shadowRoot.querySelector('style').textContent;

        // Update the HTML with all breadcrumbs
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <nav aria-label="Breadcrumb">
                <ol class="breadcrumbs expanded" data-separator-type="${type}">
                    ${breadcrumbsHTML}
                </ol>
            </nav>
        `;
    }
}

// Define the custom element
customElements.define('jalebi-breadcrumbs', JalebiBreadcrumbs);

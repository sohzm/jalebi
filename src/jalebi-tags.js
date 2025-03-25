class JalebiTags extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.hasSearch = this.hasAttribute('search');
        this._values = [];
        this._eventsBound = false;
    }

    connectedCallback() {
        if (this.hasAttribute('value')) {
            const attrValue = this.getAttribute('value');
            if (attrValue) {
                this._values = attrValue.split(',').map(v => v.trim());
            }
        }
        this.updateView();
        if (!this._eventsBound) {
            this.bindEvents();
            this._eventsBound = true;
        }
    }

    get values() {
        return this._values;
    }

    set values(val) {
        this._values = val;
        this.updateView();
    }

    updateView() {
        this.shadowRoot.innerHTML = '';
        const view = this.createView();
        this.shadowRoot.appendChild(view);
    }

    createView() {
        // Convert selected values to tag capsules
        const selectedTags = this._values
            .map(val => {
                const option = this.querySelector(`option[value="${val}"]`);
                const label = option ? option.textContent : val;
                return `<div class="tag" data-value="${val}">
                <span>${label}</span>
                <button class="tag-remove" aria-label="Remove ${label}">
                    <svg width="12px" height="12px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </button>
            </div>`;
            })
            .join('');

        // Create options HTML for dropdown
        const optionsHTML = Array.from(this.querySelectorAll(':scope > option, :scope > optgroup'))
            .map(el => {
                if (el.tagName === 'OPTGROUP') {
                    const groupOptions = Array.from(el.children)
                        .map(opt => {
                            return `<div class="option ${this._values.includes(opt.value) ? 'selected' : ''}" data-value="${opt.value}">
                                ${opt.textContent}
                                ${
                                    this._values.includes(opt.value)
                                        ? `<svg width="16px" height="16px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-2)">
                                    <path d="M5 13L9 17L19 7" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>`
                                        : ''
                                }
                            </div>`;
                        })
                        .join('');
                    return `<div class="optgroup">
                            <div class="optgroup-label">${el.label}</div>
                            ${groupOptions}
                        </div>`;
                }
                return `<div class="option ${this._values.includes(el.value) ? 'selected' : ''}" data-value="${el.value}">
                        ${el.textContent}
                        ${
                            this._values.includes(el.value)
                                ? `<svg width="16px" height="16px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-2)">
                            <path d="M5 13L9 17L19 7" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>`
                                : ''
                        }
                    </div>`;
            })
            .join('');

        // Create the container element
        const container = document.createElement('div');
        container.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                }
                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-size: 12px;
                    font-family: var(--font, sans-serif);
                }
                .tags-container {
                    border: 1px solid var(--border-1, #cccccc);
                    border-radius: var(--radius, 4px);
                    padding: var(--padding-1, 2px);
                    background: var(--bg-1, #ffffff);
                    min-height: 38px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--gap-1, 5px);
                    cursor: text;
                    align-items: center;
                }
                .tags-container:focus-within {
                    outline: 1px solid var(--fg-accent, #5c35d9);
                    border-color: var(--fg-accent, #5c35d9);
                }
                .tags-container.open {
                    border-bottom-left-radius: ${this.isOpen ? '0' : 'var(--radius, 4px)'};
                    border-bottom-right-radius: ${this.isOpen ? '0' : 'var(--radius, 4px)'};
                }
                .tag {
                    display: inline-flex;
                    align-items: center;
                    background: var(--bg-accent, #f2eeff);
                    color: var(--fg-accent, #5c35d9);
                    border-radius: 50px;
                    padding: var(--padding-w1, 4px 8px);
                    margin: 2px;
                    gap: var(--gap-1, 5px);
                }
                .tag-remove {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                }
                .tag-remove:hover {
                    background: rgba(0, 0, 0, 0.1);
                }
                .input-container {
                    flex: 1;
                    min-width: 60px;
                    display: flex;
                    align-items: center;
                }
                .input {
                    border: none;
                    outline: none;
                    background: transparent;
                    flex: 1;
                    min-width: 60px;
                    padding: var(--padding-2, 4px);
                    color: var(--fg-1, #333);
                }
                .toggle-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--fg-2, #666);
                    padding: var(--padding-1, 2px);
                    margin-right: 4px;
                    display: flex;
                    align-items: center;
                }
                .dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    background: var(--bg-1, #ffffff);
                    border: 1px solid var(--border-1, #cccccc);
                    border-top: none;
                    border-bottom-left-radius: var(--radius, 4px);
                    border-bottom-right-radius: var(--radius, 4px);
                    display: ${this.isOpen ? 'block' : 'none'};
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 10;
                }
                .option, .optgroup-label {
                    padding: var(--padding-w2, 4px 8px);
                    cursor: pointer;
                    color: var(--fg-1, #333);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .option:hover {
                    background: var(--bg-accent, #f2eeff);
                }
                .option.selected {
                    background: var(--bg-2, #f7f7f7);
                    color: var(--fg-2, #666);
                }
                .optgroup-label {
                    font-weight: bold;
                    cursor: default;
                    text-align: center;
                }
                .no-results {
                    padding: var(--padding-w2, 4px 8px);
                    color: var(--fg-2, #666);
                    font-style: italic;
                    text-align: center;
                }
                .placeholder {
                    color: var(--fg-2, #666);
                    opacity: 0.7;
                }
                @media (hover: hover) {
                    *::-webkit-scrollbar { width: 15px; }
                    *::-webkit-scrollbar-track { background: var(--bg-1); }
                    *::-webkit-scrollbar-thumb { background-color: var(--bg-3); border-radius: 20px; border: 4px solid var(--bg-1); }
                    *::-webkit-scrollbar-thumb:hover { background-color: var(--fg-1); }
                }
            </style>
            <div class="tags-container ${this.isOpen ? 'open' : ''}">
                ${selectedTags}
                <div class="input-container">
                    <input 
                        type="text" 
                        class="input" 
                        placeholder="${this._values.length === 0 ? this.getAttribute('placeholder') || 'Select tags...' : ''}"
                    >
                    <button class="toggle-button" aria-label="Toggle options">
                        <svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="${this.isOpen ? 'M18 15L12 9L6 15' : 'M6 9L12 15L18 9'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="dropdown">
                <div class="options">${optionsHTML}</div>
            </div>
        `;
        return container;
    }

    bindEvents() {
        // Click event delegation
        this.shadowRoot.addEventListener('click', e => {
            // Handle tag removal
            if (e.target.closest('.tag-remove')) {
                const tag = e.target.closest('.tag');
                const value = tag.getAttribute('data-value');
                this._values = this._values.filter(v => v !== value);
                this.dispatchEvent(
                    new CustomEvent('change', {
                        detail: { values: this._values },
                        bubbles: true,
                        composed: true,
                    })
                );
                this.updateView();
                // Focus the input after removing a tag
                setTimeout(() => this.shadowRoot.querySelector('.input').focus(), 0);
                return;
            }

            // Handle option selection
            if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
                const value = option.getAttribute('data-value');

                if (this._values.includes(value)) {
                    this._values = this._values.filter(v => v !== value);
                } else {
                    this._values.push(value);
                }

                this.dispatchEvent(
                    new CustomEvent('change', {
                        detail: { values: this._values },
                        bubbles: true,
                        composed: true,
                    })
                );

                // Keep dropdown open after selection
                const input = this.shadowRoot.querySelector('.input');
                const inputValue = input.value;
                this.updateView();

                // Restore focus and filter value
                setTimeout(() => {
                    this.shadowRoot.querySelector('.input').focus();
                    this.shadowRoot.querySelector('.input').value = inputValue;
                    // Re-filter options if needed
                    if (inputValue) {
                        this.filterOptions(inputValue);
                    }
                }, 0);

                return;
            }

            // Handle toggle button or clicking on the container
            if (e.target.closest('.toggle-button') || e.target.closest('.tags-container')) {
                const wasOnInput = e.target.matches('.input');

                // Toggle dropdown
                if (!wasOnInput || e.target.closest('.toggle-button')) {
                    this.isOpen = !this.isOpen;
                    this.updateView();

                    // Focus input after opening
                    if (this.isOpen) {
                        setTimeout(() => this.shadowRoot.querySelector('.input').focus(), 0);
                    }
                } else if (!this.isOpen && wasOnInput) {
                    // Open dropdown when clicking on input if closed
                    this.isOpen = true;
                    this.updateView();
                }
            }
        });

        // Input handling
        this.shadowRoot.addEventListener('input', e => {
            if (e.target.matches('.input')) {
                const value = e.target.value.trim().toLowerCase();

                // Open dropdown when typing
                if (value && !this.isOpen) {
                    this.isOpen = true;
                    this.updateView();
                    setTimeout(() => {
                        this.shadowRoot.querySelector('.input').value = value;
                        this.filterOptions(value);
                    }, 0);
                } else {
                    this.filterOptions(value);
                }
            }
        });

        // Keyboard navigation
        this.shadowRoot.addEventListener('keydown', e => {
            const input = e.target.matches('.input');

            if (input) {
                // Toggle dropdown with arrow down
                if (e.key === 'ArrowDown') {
                    if (!this.isOpen) {
                        this.isOpen = true;
                        this.updateView();
                        setTimeout(() => this.shadowRoot.querySelector('.input').focus(), 0);
                    }
                    e.preventDefault();
                }

                // Close dropdown with Escape
                if (e.key === 'Escape' && this.isOpen) {
                    this.isOpen = false;
                    this.updateView();
                    setTimeout(() => this.shadowRoot.querySelector('.input').focus(), 0);
                    e.preventDefault();
                }

                // Handle backspace on empty input to remove last tag
                if (e.key === 'Backspace' && e.target.value === '' && this._values.length > 0) {
                    this._values.pop();
                    this.dispatchEvent(
                        new CustomEvent('change', {
                            detail: { values: this._values },
                            bubbles: true,
                            composed: true,
                        })
                    );
                    this.updateView();
                    setTimeout(() => this.shadowRoot.querySelector('.input').focus(), 0);
                }
            }
        });

        // Outside click handler to close dropdown
        document.addEventListener('click', e => {
            if (!this.contains(e.target) && this.isOpen) {
                this.isOpen = false;
                this.updateView();
            }
        });

        // Prevent form submission when pressing enter in the input
        this.addEventListener('keydown', e => {
            if (e.key === 'Enter' && e.target.matches('.input')) {
                e.preventDefault();
            }
        });
    }

    filterOptions(filter) {
        if (!filter) {
            // Show all options if filter is empty
            this.shadowRoot.querySelectorAll('.option').forEach(opt => {
                opt.style.display = '';
            });
            this.shadowRoot.querySelectorAll('.optgroup').forEach(group => {
                group.style.display = '';
                group.querySelector('.optgroup-label').style.display = '';
            });

            // Remove any "no results" message
            const noResults = this.shadowRoot.querySelector('.no-results');
            if (noResults) noResults.remove();
            return;
        }

        let anyVisible = false;

        // Filter direct options
        const directOptions = Array.from(this.shadowRoot.querySelectorAll('.options > .option'));
        directOptions.forEach(opt => {
            const isVisible = opt.textContent.toLowerCase().includes(filter);
            opt.style.display = isVisible ? '' : 'none';
            if (isVisible) anyVisible = true;
        });

        // Filter option groups
        const groups = Array.from(this.shadowRoot.querySelectorAll('.options > .optgroup'));
        groups.forEach(group => {
            const groupLabel = group.querySelector('.optgroup-label');
            const groupOptions = Array.from(group.querySelectorAll('.option'));

            // Check if group label matches
            const labelMatches = groupLabel.textContent.toLowerCase().includes(filter);

            if (labelMatches) {
                // Show all options if the group label matches
                groupLabel.style.display = '';
                groupOptions.forEach(opt => (opt.style.display = ''));
                anyVisible = true;
            } else {
                // Otherwise, filter individual options
                let anyGroupVisible = false;
                groupOptions.forEach(opt => {
                    const isVisible = opt.textContent.toLowerCase().includes(filter);
                    opt.style.display = isVisible ? '' : 'none';
                    if (isVisible) {
                        anyGroupVisible = true;
                        anyVisible = true;
                    }
                });

                // Hide group label if no options match
                groupLabel.style.display = anyGroupVisible ? '' : 'none';
                // Hide entire group if nothing matches
                group.style.display = anyGroupVisible ? '' : 'none';
            }
        });

        // Show "no results" message if needed
        if (!anyVisible) {
            const options = this.shadowRoot.querySelector('.options');
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No matching options';

            // Only add if it doesn't already exist
            if (!this.shadowRoot.querySelector('.no-results')) {
                options.appendChild(noResults);
            }
        } else {
            // Remove any existing "no results" message
            const noResults = this.shadowRoot.querySelector('.no-results');
            if (noResults) noResults.remove();
        }
    }

    static get observedAttributes() {
        return ['value', 'placeholder', 'search'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && newValue !== oldValue) {
            if (newValue) {
                this._values = newValue.split(',').map(v => v.trim());
            } else {
                this._values = [];
            }
            this.updateView();
        }

        if (name === 'search') {
            this.hasSearch = this.hasAttribute('search');
            this.updateView();
        }

        if (name === 'placeholder') {
            this.updateView();
        }
    }
}

customElements.define('jalebi-tags', JalebiTags);

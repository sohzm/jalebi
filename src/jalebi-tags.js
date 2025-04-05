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

        // Add ARIA attributes for accessibility
        this.setAttribute('role', 'combobox');
        this.setAttribute('aria-haspopup', 'listbox');
        this.setAttribute('aria-expanded', 'false');
        this.setAttribute('aria-controls', `tags-dropdown-${this._uniqueId}`);
    }

    get _uniqueId() {
        if (!this.__uniqueId) {
            this.__uniqueId = Math.random().toString(36).substring(2, 10);
        }
        return this.__uniqueId;
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

        // Update ARIA attributes based on state
        this.setAttribute('aria-expanded', this.isOpen.toString());
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
                    <svg width="14px" height="14px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
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
                            return `<div class="option ${this._values.includes(opt.value) ? 'selected' : ''}" data-value="${opt.value}" role="option" id="option-${opt.value.replace(/\s+/g, '-')}" aria-selected="${this._values.includes(opt.value)}">
                                ${opt.textContent}
                                ${
                                    this._values.includes(opt.value)
                                        ? `<svg width="16px" height="16px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
                                    <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>`
                                        : ''
                                }
                            </div>`;
                        })
                        .join('');
                    return `<div class="optgroup" role="group" aria-label="${el.label}">
                            <div class="optgroup-label">${el.label}</div>
                            ${groupOptions}
                        </div>`;
                }
                return `<div class="option ${this._values.includes(el.value) ? 'selected' : ''}" data-value="${el.value}" role="option" id="option-${el.value.replace(/\s+/g, '-')}" aria-selected="${this._values.includes(el.value)}">
                        ${el.textContent}
                        ${
                            this._values.includes(el.value)
                                ? `<svg width="16px" height="16px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
                            <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>`
                                : ''
                        }
                    </div>`;
            })
            .join('');

        const tagsId = `tags-${this._uniqueId}`;
        const dropdownId = `tags-dropdown-${this._uniqueId}`;

        // Create the container element
        const container = document.createElement('div');
        container.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                }
                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-size: 12px;
                    font-family: var(--font);
                }
                .tags-container {
                    padding: var(--padding-w1);
                    border: 1px solid var(--border-1);
                    border-radius: var(--radius);
                    cursor: text;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: var(--gap-1);
                    outline: none;
                    background-color: var(--bg-1);
                    color: var(--fg-1);
                    transition: all 0.2s ease;
                }
                :host([aria-expanded="true"]) .tags-container {
                    border-color: var(--fg-accent);
                    background-color: var(--bg-1);
                }
                .tags-container:hover {
                    border-color: var(--fg-accent);
                    background-color: var(--bg-1);
                }
                .tags-container:focus-within {
                    border-color: var(--fg-accent);
                    outline: none;
                }
                .tag {
                    display: inline-flex;
                    align-items: center;
                    background: var(--bg-3);
                    color: var(--fg-1);
                    border-radius: var(--radius);
                    padding: var(--padding-w1);
                    gap: var(--gap-1);
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                :host([aria-expanded="true"]) .tag {
                    background-color: var(--bg-3);
                }
                .tags-container:hover .tag {
                    background-color: var(--bg-3);
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
                    width: 18px;
                    height: 18px;
                    transition: transform 0.2s ease;
                }
                .tag-remove:hover {
                    transform: scale(1.2);
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
                    padding: var(--padding-3);
                    color: var(--fg-1);
                }
                .toggle-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--fg-1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .dropdown {
                    position: absolute;
                    top: calc(100% + var(--padding-2));
                    left: 0;
                    width: 100%;
                    background: var(--bg-1);
                    border: 1px solid var(--fg-accent);
                    border-radius: var(--radius);
                    display: ${this.isOpen ? 'flex' : 'none'};
                    flex-direction: column;
                    z-index: 10;
                    animation: fadeIn 0.2s ease-out;
                    overflow: hidden;
                    box-shadow: var(--shadow-dropdown);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .option, .optgroup-label {
                    padding: var(--padding-w2);
                    cursor: pointer;
                    color: var(--fg-1);
                    transition: all 0.15s ease;
                }
                .option {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .option.selected {
                    color: var(--fg-1);
                    background-color: var(--bg-2);
                }
                .option:hover, .option.highlighted {
                    background: var(--bg-accent);
                }
                .optgroup-label {
                    font-weight: 700;
                    cursor: default;
                    text-transform: uppercase;
                    font-size: 10px;
                    letter-spacing: 0.5px;
                    color: var(--fg-2);
                    padding-top: var(--padding-4);
                    padding-bottom: var(--padding-3);
                }
                .optgroup:first-child .optgroup-label {
                    padding-top: var(--padding-3);
                }
                .search {
                    border-bottom: 1px solid var(--border-1);
                    padding: var(--padding-w2);
                    display: flex;
                    align-items: center;
                    gap: var(--gap-1);
                    background-color: var(--bg-2);
                    border-radius: var(--radius-large) var(--radius-large) 0 0;
                }
                .search input {
                    width: 100%;
                    border: none;
                    outline: none;
                    background: transparent;
                    color: var(--fg-1);
                    flex: 1;
                }
                ::placeholder {
                    color: var(--fg-2);
                }
                @media (hover: hover) {
                    .options::-webkit-scrollbar { width: 8px; }
                    .options::-webkit-scrollbar-track { background: var(--bg-1); }
                    .options::-webkit-scrollbar-thumb { 
                        background-color: var(--bg-3); 
                        border-radius: 20px; 
                        border: 2px solid var(--bg-1); 
                    }
                    .options::-webkit-scrollbar-thumb:hover { background-color: var(--fg-1); }
                }
                .options {
                    padding: var(--padding-1, 2px) 0;
                    overflow-y: auto;
                    max-height: 220px;
                }
                .no-results {
                    padding: var(--padding-w2);
                    color: var(--fg-2);
                    font-style: italic;
                    text-align: center;
                    background-color: var(--bg-2);
                    margin: var(--padding-3);
                    border-radius: var(--radius);
                }
            </style>
            <div id="${tagsId}" class="tags-container" tabindex="0" role="combobox" aria-haspopup="listbox" aria-expanded="${this.isOpen}" aria-controls="${dropdownId}">
                ${selectedTags}
                <div class="input-container">
                    <input 
                        type="text" 
                        class="input" 
                        placeholder="${this._values.length === 0 ? this.getAttribute('placeholder') || 'Select tags...' : ''}"
                        aria-label="Search and select tags"
                    >
                    <button class="toggle-button" aria-label="Toggle options">
                        <svg width="14px" height="14px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
                            <path d="${this.isOpen ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="${dropdownId}" class="dropdown" role="listbox" aria-labelledby="${tagsId}">
                ${
                    this.hasSearch
                        ? `<div class="search">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4" width=16>
                      <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" />
                    </svg>
                    <input type="text" aria-label="Search options" placeholder="Search...">
                </div>`
                        : ''
                }
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

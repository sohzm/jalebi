class JalebiMultiSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.opened = false;
        this.hasSearch = this.hasAttribute('search');
        this._values = [];
        this._eventsBound = false;
        this.highlightedIndex = -1;
        this.allOptions = [];
        this.visibleOptions = [];
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
        this.setAttribute('aria-controls', `multiselect-dropdown-${this._uniqueId}`);
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
        this.setAttribute('aria-expanded', this.opened.toString());

        // Cache option elements for keyboard navigation
        this.cacheOptionElements();
    }

    cacheOptionElements() {
        // Cache all option elements for easier keyboard navigation
        this.allOptions = Array.from(this.shadowRoot.querySelectorAll('.option'));
        this.visibleOptions = this.allOptions.filter(option => option.style.display !== 'none');

        // Set initial highlight index
        if (this.opened && this.visibleOptions.length > 0) {
            this.highlightedIndex = 0;
            this.updateHighlight();
        }
    }

    updateHighlight() {
        // Remove highlight from all options
        this.visibleOptions.forEach(option => {
            option.setAttribute('aria-selected', 'false');
            option.classList.remove('highlighted');
        });

        // Add highlight to the current option
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.visibleOptions.length) {
            const current = this.visibleOptions[this.highlightedIndex];
            current.setAttribute('aria-selected', 'true');
            current.classList.add('highlighted');

            // Ensure the highlighted option is visible in the dropdown
            if (this.opened) {
                const optionsContainer = this.shadowRoot.querySelector('.options');
                if (optionsContainer) {
                    const containerRect = optionsContainer.getBoundingClientRect();
                    const optionRect = current.getBoundingClientRect();

                    if (optionRect.bottom > containerRect.bottom) {
                        optionsContainer.scrollTop += optionRect.bottom - containerRect.bottom;
                    } else if (optionRect.top < containerRect.top) {
                        optionsContainer.scrollTop -= containerRect.top - optionRect.top;
                    }
                }
            }
        }
    }

    createView() {
        const options = Array.from(this.querySelectorAll(':scope > option, :scope > optgroup'))
            .map(el => {
                if (el.tagName === 'OPTGROUP') {
                    const groupOptions = Array.from(el.children)
                        .map(opt => {
                            return `<div class="option" role="option" id="option-${opt.value.replace(/\s+/g, '-')}" aria-selected="${this._values.includes(opt.value)}" data-value="${opt.value}">
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
                return `<div class="option" role="option" id="option-${el.value.replace(/\s+/g, '-')}" aria-selected="${this._values.includes(el.value)}" data-value="${el.value}">
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

        // Handle selected text display
        let selectedText = 'Select...';
        if (this._values.length > 0) {
            const selectedLabels = this._values.map(val => {
                const option = this.querySelector(`option[value="${val}"]`);
                return option ? option.textContent : val;
            });

            if (selectedLabels.length <= 2) {
                selectedText = selectedLabels.join(', ');
            } else {
                selectedText = `${selectedLabels.length} items selected`;
            }
        }

        const selectId = `multiselect-${this._uniqueId}`;
        const dropdownId = `multiselect-dropdown-${this._uniqueId}`;

        const template = document.createElement('div');
        template.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    width: 100%;
                }
                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-size: 12px;
                    font-family: var(--font);
                }
                .select {
                    padding: var(--padding-w2);
                    border: 2px solid transparent;
                    border-radius: var(--radius);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    outline: none;
                    background-color: var(--bg-3);
                    color: var(--fg-1);
                    transition: all 0.2s ease;
                }
                :host([aria-expanded="true"]) .select {
                    border-color: var(--fg-1);
                    background-color: var(--bg-1);
                }
                .select:hover {
                    border-color: var(--fg-1);
                    background-color: var(--bg-1);
                }
                .select:focus, .select:focus-visible {
                    border-color: var(--fg-1);
                    outline: none;
                }
                .selected-text {
                    font-weight: ;
                }
                .dropdown {
                    position: absolute;
                    top: calc(100% + var(--padding-2));
                    left: 0;
                    width: 100%;
                    background: var(--bg-1);
                    border: 2px solid var(--fg-1);
                    border-radius: var(--radius);
                    display: ${this.opened ? 'flex' : 'none'};
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
                .option[aria-selected="true"] {
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
                
                .chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--gap-1);
                    padding: var(--padding-2) 0;
                }
                
                .chip {
                    display: inline-flex;
                    align-items: center;
                    background-color: var(--bg-2);
                    padding: var(--padding-1) var(--padding-2);
                    border-radius: var(--radius);
                    margin: 2px;
                    white-space: nowrap;
                }
                
                .chip .close {
                    margin-left: var(--gap-1);
                    cursor: pointer;
                    color: var(--fg-2);
                }
                
                .chip .close:hover {
                    color: var(--fg-1);
                }
                
                .selected-count {
                    font-weight: 600;
                    color: var(--fg-1);
                }
            </style>
            <div id="${selectId}" class="select" tabindex="0" role="button" aria-haspopup="listbox" aria-expanded="${this.opened}" aria-controls="${dropdownId}">
                <span class="selected-text">${selectedText}</span>
                <svg width="14px" height="14px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
                    <path d="${this.opened ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div id="${dropdownId}" class="dropdown" role="listbox" aria-labelledby="${selectId}" aria-multiselectable="true">
                ${
                    this.hasSearch
                        ? `<div class="search">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
                      <path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" />
                    </svg>
                    <input type="text" aria-label="Search options" placeholder="Search...">
                </div>`
                        : ''
                }
                <div class="options">${options}</div>
            </div>
        `;
        return template;
    }

    bindEvents() {
        this.shadowRoot.addEventListener('click', e => {
            if (e.target.closest('.select')) {
                this.toggleDropdown();
            } else if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
                const value = option.getAttribute('data-value');

                if (this._values.includes(value)) {
                    this._values = this._values.filter(val => val !== value);
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
                this.updateView();
            }
        });

        this.shadowRoot.addEventListener('input', e => {
            if (e.target.matches('.search input')) {
                const filter = e.target.value.toLowerCase();
                const optionsContainer = this.shadowRoot.querySelector('.options');
                if (optionsContainer) {
                    // Remove any existing no-results message
                    const existingNoResults = optionsContainer.querySelector('.no-results');
                    if (existingNoResults) {
                        existingNoResults.remove();
                    }

                    const directOptions = Array.from(optionsContainer.querySelectorAll(':scope > .option'));
                    directOptions.forEach(opt => {
                        opt.style.display = opt.textContent.toLowerCase().includes(filter) ? '' : 'none';
                    });

                    const groups = Array.from(optionsContainer.querySelectorAll(':scope > .optgroup'));
                    groups.forEach(group => {
                        const groupLabel = group.querySelector('.optgroup-label');
                        const groupOptions = Array.from(group.querySelectorAll('.option'));
                        if (groupLabel.textContent.toLowerCase().includes(filter)) {
                            groupLabel.style.display = '';
                            groupOptions.forEach(opt => (opt.style.display = ''));
                        } else {
                            let anyVisible = false;
                            groupOptions.forEach(opt => {
                                const match = opt.textContent.toLowerCase().includes(filter);
                                opt.style.display = match ? '' : 'none';
                                if (match) anyVisible = true;
                            });
                            groupLabel.style.display = anyVisible ? '' : 'none';
                        }
                    });

                    // Check if there are any visible options
                    const visibleOptions = optionsContainer.querySelectorAll('.option[style="display: none;"]');
                    const hasVisibleOptions =
                        visibleOptions.length <
                        directOptions.length + groups.reduce((total, group) => total + group.querySelectorAll('.option').length, 0);

                    if (!hasVisibleOptions && filter.length > 0) {
                        const noResults = document.createElement('div');
                        noResults.className = 'no-results';
                        noResults.textContent = 'No matching options found';
                        optionsContainer.appendChild(noResults);
                    }

                    // Update option cache and highlight after filtering
                    this.cacheOptionElements();
                }
            }
        });

        // Click outside to close
        document.addEventListener('click', e => {
            if (!this.contains(e.target)) {
                if (this.opened) {
                    this.opened = false;
                    this.updateView();
                }
            }
        });

        // Keyboard navigation
        this.shadowRoot.addEventListener('keydown', e => {
            const select = this.shadowRoot.querySelector('.select');

            // Handle keyboard events when dropdown is closed
            if (!this.opened) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.toggleDropdown();
                    return;
                }
            }
            // Handle keyboard events when dropdown is open
            else {
                switch (e.key) {
                    case 'Escape':
                        e.preventDefault();
                        this.opened = false;
                        this.updateView();
                        select.focus();
                        break;

                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        if (this.highlightedIndex >= 0 && this.visibleOptions[this.highlightedIndex]) {
                            const option = this.visibleOptions[this.highlightedIndex];
                            const value = option.getAttribute('data-value');

                            if (this._values.includes(value)) {
                                this._values = this._values.filter(val => val !== value);
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
                            this.updateView();

                            // Keep dropdown open after selection for multiselect
                            setTimeout(() => {
                                const searchInput = this.shadowRoot.querySelector('.search input');
                                if (searchInput) {
                                    searchInput.focus();
                                }
                            }, 10);
                        }
                        break;

                    case 'ArrowDown':
                        e.preventDefault();
                        if (this.visibleOptions.length > 0) {
                            this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.visibleOptions.length - 1);
                            this.updateHighlight();
                        }
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        if (this.visibleOptions.length > 0) {
                            this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
                            this.updateHighlight();
                        }
                        break;

                    case 'Home':
                        e.preventDefault();
                        if (this.visibleOptions.length > 0) {
                            this.highlightedIndex = 0;
                            this.updateHighlight();
                        }
                        break;

                    case 'End':
                        e.preventDefault();
                        if (this.visibleOptions.length > 0) {
                            this.highlightedIndex = this.visibleOptions.length - 1;
                            this.updateHighlight();
                        }
                        break;

                    default:
                        // Handle typing to jump to matching option
                        if (/^[a-zA-Z0-9]$/.test(e.key)) {
                            const startsWith = new RegExp(`^${e.key}`, 'i');
                            const index = this.visibleOptions.findIndex(option => startsWith.test(option.textContent.trim()));

                            if (index >= 0) {
                                this.highlightedIndex = index;
                                this.updateHighlight();
                            }
                        }
                        break;
                }
            }
        });
    }

    toggleDropdown() {
        this.opened = !this.opened;
        this.updateView();

        if (this.opened) {
            // Focus the search input if available, otherwise focus the first option
            const searchInput = this.shadowRoot.querySelector('.search input');
            if (searchInput) {
                searchInput.focus();
            }
        } else {
            // Focus the select when closing
            const select = this.shadowRoot.querySelector('.select');
            if (select) {
                select.focus();
            }
        }
    }
}

customElements.define('jalebi-multiselect', JalebiMultiSelect);

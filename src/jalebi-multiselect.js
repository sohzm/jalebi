class JalebiMultiSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.hasSearch = this.hasAttribute('search');
        this._values = [];
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        if (this.hasAttribute('value')) {
            const attrValue = this.getAttribute('value');
            if (attrValue) {
                this.values = attrValue.split(',').map(v => v.trim());
            }
        }
    }

    get values() {
        return this._values;
    }

    set values(val) {
        this._values = val;
        const options = this.shadowRoot.querySelectorAll('.option');
        options.forEach(opt => {
            const checkbox = opt.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = this._values.includes(opt.getAttribute('data-value'));
            }
        });
        const selectedText = this.shadowRoot.querySelector('.selected-text');
        if (this._values.length === 0) {
            selectedText.textContent = 'Select...';
        } else {
            const selectedLabels = [];
            this.shadowRoot.querySelectorAll('.option').forEach(opt => {
                if (this._values.includes(opt.getAttribute('data-value'))) {
                    selectedLabels.push(opt.textContent.trim());
                }
            });
            selectedText.textContent = selectedLabels.join(', ');
        }
    }

    render() {
        const optionsHTML = Array.from(this.querySelectorAll(':scope > option, :scope > optgroup')).map(el => {
            if (el.tagName === 'OPTGROUP') {
                const groupOptions = Array.from(el.children)
                    .map(opt => `
                        <div class="option" data-value="${opt.value}">
                            <label>
                                <input type="checkbox" ${this._values.includes(opt.value) ? 'checked' : ''}>
                                ${opt.textContent}
                            </label>
                        </div>
                    `)
                    .join('');
                return `
                    <div class="optgroup">
                        <div class="optgroup-label">${el.label}</div>
                        ${groupOptions}
                    </div>
                `;
            }
            return `
                <div class="option" data-value="${el.value}">
                    <label>
                        <input type="checkbox" ${this._values.includes(el.value) ? 'checked' : ''}>
                        ${el.textContent}
                    </label>
                </div>
            `;
        }).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                }
                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-size: 14px;
                    font-family: var(--font, sans-serif);
                }
                .select {
                    padding: var(--padding-w1, 8px 16px);
                    border: 1px solid var(--border-1, #cccccc);
                    border-radius: var(--radius, 4px);
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    outline: none;
                }
                .dropdown {
                    position: absolute;
                    top: calc(100% + var(--padding-3, 8px));
                    left: 0;
                    width: 100%;
                    background: var(--bg-1, #ffffff);
                    border: 1px solid var(--border-1, #cccccc);
                    border-radius: var(--radius, 12px);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    display: none;
                    flex-direction: column;
                    max-height: 200px;
                    overflow: auto;
                    z-index: 10;
                }
                .dropdown.open {
                    display: flex;
                }
                .option, .optgroup-label {
                    padding: var(--padding-w2, 4px 8px);
                    cursor: pointer;
                    color: var(--fg-1, #333);
                }
                .option:hover {
                    background: var(--bg-accent, #f2eeff);
                }
                .optgroup-label {
                    font-weight: bold;
                    cursor: default;
                    text-align: center;
                }
                .search {
                    border-bottom: 1px solid var(--border-1, #ccc);
                    padding: var(--padding-w2);
                    display: flex;
                    align-items: center;
                    gap: var(--gap-2);
                }
                .search input {
                    width: 100%;
                    border: none;
                    outline: none;
                    background: var(--bg-1);
                    color: var(--fg-1);
                    flex: 1;
                }
                input[type="checkbox"] {
                    margin-right: 8px;
                }
                label {
                    display: flex;
                    align-items: center;
                }
                ::placeholder {
                    color: var(--fg-2);
                }

                @media (hover: hover) {
                    *::-webkit-scrollbar { width: 15px; }
                    *::-webkit-scrollbar-track { background: var(--bg-1); }
                    *::-webkit-scrollbar-thumb { background-color: var(--bg-3); border-radius: 20px; border: 4px solid var(--bg-1); }
                    *::-webkit-scrollbar-thumb:hover { background-color: var(--fg-1); }
                }
            </style>
            <div class="select" tabindex="0">
                <span class="selected-text">${this._values.length > 0 ? this._values.join(', ') : 'Select...'}</span>
<?xml version="1.0" encoding="UTF-8"?><svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)"><path d="M17 8L12 3L7 8" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 16L12 21L7 16" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            </div>
            <div class="dropdown">
                ${this.hasSearch ? '<div class="search"> <?xml version="1.0" encoding="UTF-8"?><svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M17 17L21 21" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> <input type="text" placeholder="Search..."></div>' : ''}
                <div class="options">${optionsHTML}</div>
            </div>
        `;
    }

    setupEvents() {
        const select = this.shadowRoot.querySelector('.select');
        const dropdown = this.shadowRoot.querySelector('.dropdown');
        const optionsContainer = this.shadowRoot.querySelector('.options');
        const searchInput = this.shadowRoot.querySelector('.search input');

        select.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isOpen = !this.isOpen;
            dropdown.classList.toggle('open', this.isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.isOpen = false;
                dropdown.classList.remove('open');
            }
        });

        // Listen for changes on any checkbox within the options container
        optionsContainer.addEventListener('change', (e) => {
            if (e.target && e.target.type === 'checkbox') {
                const optionDiv = e.target.closest('.option');
                const optionValue = optionDiv.getAttribute('data-value');
                if (e.target.checked) {
                    if (!this._values.includes(optionValue)) {
                        this._values.push(optionValue);
                    }
                } else {
                    this._values = this._values.filter(val => val !== optionValue);
                }
                this.values = this._values; // Update UI
                this.dispatchEvent(new CustomEvent('change', { 
                    detail: { values: this._values },
                    bubbles: true,
                    composed: true
                }));
            }
        });

        if (this.hasSearch && searchInput) {
            searchInput.addEventListener('input', () => {
                const filter = searchInput.value.toLowerCase();
                // Filter direct options
                const directOptions = Array.from(this.shadowRoot.querySelectorAll('.options > .option'));
                directOptions.forEach(opt => {
                    opt.style.display = opt.textContent.toLowerCase().includes(filter) ? '' : 'none';
                });
                // Filter optgroup options
                const groups = Array.from(this.shadowRoot.querySelectorAll('.options > .optgroup'));
                groups.forEach(group => {
                    const groupLabel = group.querySelector('.optgroup-label');
                    const groupOptions = Array.from(group.querySelectorAll('.option'));
                    if (groupLabel.textContent.toLowerCase().includes(filter)) {
                        groupLabel.style.display = '';
                        groupOptions.forEach(opt => opt.style.display = '');
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
            });
        }
    }
}

customElements.define('jalebi-multiselect', JalebiMultiSelect);

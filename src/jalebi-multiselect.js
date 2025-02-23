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
                    border-radius: var(--radius, 4px);
                    margin: 0 var(--padding-2, 8px);
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
                }
                .search input {
                    width: 100%;
                    padding: var(--padding-w2, 4px 8px);
                    border: none;
                    outline: none;
                }
                input[type="checkbox"] {
                    margin-right: 8px;
                }
                label {
                    display: flex;
                    align-items: center;
                }
            </style>
            <div class="select" tabindex="0">
                <span class="selected-text">${this._values.length > 0 ? this._values.join(', ') : 'Select...'}</span>
                <span class="arrow">▼</span>
            </div>
            <div class="dropdown">
                ${this.hasSearch ? '<div class="search"><input type="text" placeholder="Search..."></div>' : ''}
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

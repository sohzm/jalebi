class JalebiMultiSelect extends HTMLElement {
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
        const optionsHTML = Array.from(this.querySelectorAll(':scope > option, :scope > optgroup'))
            .map(el => {
                if (el.tagName === 'OPTGROUP') {
                    const groupOptions = Array.from(el.children)
                        .map(opt => {
                            return `<div class="option" data-value="${opt.value}">
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
                return `<div class="option" data-value="${el.value}">
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

        let selectedText = 'Select...';
        if (this._values.length > 0) {
            const selectedLabels = this._values.map(val => {
                const option = this.querySelector(`option[value="${val}"]`);
                return option ? option.textContent : val;
            });
            selectedText = selectedLabels.join(', ');
        }

        const container = document.createElement('div');
        container.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                }
                * {
                    box-sizing: border-box;
                    user-select: none;
                    font-size: 12px;
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
                    top: calc(100% + var(--padding-2, 8px));
                    left: 0;
                    width: 100%;
                    background: var(--bg-1, #ffffff);
                    border: 1px solid var(--border-1, #cccccc);
                    border-radius: var(--radius, 12px);
                    display: ${this.isOpen ? 'flex' : 'none'};
                    flex-direction: column;
                    max-height: 200px;
                    overflow: auto;
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
                <span class="selected-text">${selectedText}</span>
                <svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
                    <path d="M17 8L12 3L7 8" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M17 16L12 21L7 16" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="dropdown">
                ${
                    this.hasSearch
                        ? `<div class="search">
                    <svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
                        <path d="M17 17L21 21" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <input type="text" placeholder="Search...">
                </div>`
                        : ''
                }
                <div class="options">${optionsHTML}</div>
            </div>
        `;
        return container;
    }

    bindEvents() {
        // Click event for select and options
        this.shadowRoot.addEventListener('click', e => {
            const select = this.shadowRoot.querySelector('.select');
            const option = e.target.closest('.option');

            if (e.target.closest('.select')) {
                this.isOpen = !this.isOpen;
                this.updateView();
            }

            if (option) {
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

        // Outside click handler
        document.addEventListener('click', e => {
            if (!this.contains(e.target)) {
                if (this.isOpen) {
                    this.isOpen = false;
                    this.updateView();
                }
            }
        });

        // Search functionality
        if (this.hasSearch) {
            this.shadowRoot.addEventListener('input', e => {
                if (e.target.matches('.search input')) {
                    const filter = e.target.value.toLowerCase();
                    const directOptions = Array.from(this.shadowRoot.querySelectorAll('.options > .option'));
                    directOptions.forEach(opt => {
                        opt.style.display = opt.textContent.toLowerCase().includes(filter) ? '' : 'none';
                    });

                    const groups = Array.from(this.shadowRoot.querySelectorAll('.options > .optgroup'));
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
                }
            });
        }
    }
}

customElements.define('jalebi-multiselect', JalebiMultiSelect);

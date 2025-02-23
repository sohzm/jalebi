class JalebiSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.opened = false;
        this.hasSearch = this.hasAttribute('search');
        this._value = null;
    }
    connectedCallback() {
        this.value = this.getInitialValue();
        this.updateView();
        if (!this._eventsBound) {
            this.bindEvents();
            this._eventsBound = true;
        }
    }
    getInitialValue() {
        if (this.hasAttribute('value')) {
            const attrValue = this.getAttribute('value');
            if (attrValue === null || attrValue === "") {
                const firstOption = this.querySelector('option');
                if (firstOption) {
                    return firstOption.value;
                }
                return "";
            } else {
                const matchingOption = this.querySelector(`option[value="${attrValue}"]`);
                if (matchingOption) {
                    return matchingOption.value;
                }
                return "";
            }
        }
        return "";
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
        this.updateView();
    }
    updateView() {
        this.shadowRoot.innerHTML = "";
        const view = this.createView();
        this.shadowRoot.appendChild(view);
    }
    createView() {
        const options = Array.from(this.querySelectorAll(':scope > option, :scope > optgroup')).map(el => {
            if (el.tagName === 'OPTGROUP') {
                const groupOptions = Array.from(el.children).map(opt => {
                    return `<div class="option" data-value="${opt.value}">
                                ${opt.textContent}
                                ${this.value === opt.value ? `<svg width="16px" height="16px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-2)">
                                    <path d="M5 13L9 17L19 7" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>` : ''}
                            </div>`;
                }).join('');
                return `<div class="optgroup">
                            <div class="optgroup-label">${el.label}</div>
                            ${groupOptions}
                        </div>`;
            }
            return `<div class="option" data-value="${el.value}">
                        ${el.textContent}
                        ${this.value === el.value ? `<svg width="16px" height="16px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-2)">
                            <path d="M5 13L9 17L19 7" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>` : ''}
                    </div>`;
        }).join('');
        const template = document.createElement('div');
        template.innerHTML = `
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
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    display: ${this.opened ? 'flex' : 'none'};
                    flex-direction: column;
                    max-height: 200px;
                    overflow: auto;
                    z-index: 10;
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
                ::placeholder {
                    color: var(--fg-2);
                }
                @media (hover: hover) {
                    *::-webkit-scrollbar { width: 15px; }
                    *::-webkit-scrollbar-track { background: var(--bg-1); }
                    *::-webkit-scrollbar-thumb { background-color: var(--bg-3); border-radius: 20px; border: 4px solid var(--bg-1); }
                    *::-webkit-scrollbar-thumb:hover { background-color: var(--fg-1); }
                }
                .option {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            </style>
            <div class="select" tabindex="0">
                <span class="selected-text">${this._value ? this.querySelector(`option[value="${this._value}"]`).textContent : ''}</span>
                <svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="var(--fg-1)">
                    <path d="M17 8L12 3L7 8" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M17 16L12 21L7 16" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </div>
            <div class="dropdown">
                ${this.hasSearch ? `<div class="search">
                    <svg width="16px" height="16px" viewBox="0 0 24 24" stroke-width="2" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
                        <path d="M17 17L21 21" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z" stroke="var(--fg-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <input type="text" placeholder="Search...">
                </div>` : ''}
                <div class="options">${options}</div>
            </div>
        `;
        return template;
    }
    bindEvents() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.closest('.select')) {
                this.opened = !this.opened;
                this.updateView();
            } else if (e.target.closest('.option')) {
                const option = e.target.closest('.option');
                const value = option.getAttribute('data-value');
                this.value = value;
                this.dispatchEvent(new CustomEvent('change', {
                    detail: { value },
                    bubbles: true,
                    composed: true
                }));
                this.opened = false;
                this.updateView();
            }
        });
        this.shadowRoot.addEventListener('input', (e) => {
            if (e.target.matches('.search input')) {
                const filter = e.target.value.toLowerCase();
                const optionsContainer = this.shadowRoot.querySelector('.options');
                if (optionsContainer) {
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
                }
            }
        });
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                if (this.opened) {
                    this.opened = false;
                    this.updateView();
                }
            }
        });
    }
}
customElements.define('jalebi-select', JalebiSelect);

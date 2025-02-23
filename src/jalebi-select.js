class JalebiSelect extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isOpen = false;
        this.hasSearch = this.hasAttribute('search');
        this._value = null;
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        if (this.hasAttribute('value')) {
            const attrValue = this.getAttribute('value');
            if (attrValue === null || attrValue === "") {
                const firstOption = this.querySelector('option');
                if (firstOption) {
                    this.value = firstOption.value;
                } else {
                    this.value = "";
                }
            } else {
                const matchingOption = this.querySelector(`option[value="${attrValue}"]`);
                if (matchingOption) {
                    this.value = matchingOption.value;
                } else {
                    this.value = "";
                }
            }
        } else {
            this.value = "";
        }
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
        const selectedOption = this.shadowRoot.querySelector(`.option[data-value="${val}"]`);
        if (selectedOption) {
            this.shadowRoot.querySelector('.selected-text').textContent = selectedOption.textContent;
        }
    }

    render() {
        const options = Array.from(this.querySelectorAll(':scope > option, :scope > optgroup')).map(el => {
            if (el.tagName === 'OPTGROUP') {
                const groupOptions = Array.from(el.children)
                    .map(opt => `<div class="option" data-value="${opt.value}">${opt.textContent}</div>`)
                    .join('');
                return `<div class="optgroup"><div class="optgroup-label">${el.label}</div>${groupOptions}</div>`;
            }
            return `<div class="option" data-value="${el.value}">${el.textContent}</div>`;
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
            </style>
            <div class="select" tabindex="0">
                <span class="selected-text">${this._value ? this._value : 'Select...'}</span>
                <span class="arrow">▼</span>
            </div>
            <div class="dropdown">
                ${this.hasSearch ? '<div class="search"><input type="text" placeholder="Search..."></div>' : ''}
                <div class="options">${options}</div>
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
        optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('option')) {
                const value = e.target.getAttribute('data-value');
                this.value = value;
                this.dispatchEvent(new CustomEvent('change', { 
                    detail: { value },
                    bubbles: true,
                    composed: true
                }));
                this.isOpen = false;
                dropdown.classList.remove('open');
            }
        });
        if (this.hasSearch && searchInput) {
            searchInput.addEventListener('input', () => {
                const filter = searchInput.value.toLowerCase();
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

customElements.define('jalebi-select', JalebiSelect);

class JalebiTimepicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default values
        this._hour = 12;
        this._minute = 0;
        this._second = 0;
        this._isPM = false;
        this._isOpen = false;
        this._format = '12h'; // '12h' or '24h'
        this._placeholder = 'Select time';
        this._label = '';
        this._showSeconds = false;

        // Bind methods
        this._handleInputChange = this._handleInputChange.bind(this);
        this._handlePeriodChange = this._handlePeriodChange.bind(this);
        this._handleInputClick = this._handleInputClick.bind(this);
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handleTimeSelectorClick = this._handleTimeSelectorClick.bind(this);
    }

    static get observedAttributes() {
        return ['format', 'placeholder', 'value', 'label', 'show-seconds'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'format':
                this._format = newValue;
                break;
            case 'placeholder':
                this._placeholder = newValue;
                break;
            case 'value':
                this._setTimeFromString(newValue);
                break;
            case 'label':
                this._label = newValue;
                break;
            case 'show-seconds':
                this._showSeconds = newValue !== null;
                break;
        }

        if (this.shadowRoot.innerHTML !== '') {
            this._updateUI();
        }
    }

    connectedCallback() {
        this._format = this.getAttribute('format') || this._format;
        this._placeholder = this.getAttribute('placeholder') || this._placeholder;
        this._label = this.getAttribute('label') || this._label;
        this._showSeconds = this.hasAttribute('show-seconds');

        if (this.getAttribute('value')) {
            this._setTimeFromString(this.getAttribute('value'));
        }

        this._render();
        this._attachEventListeners();
    }

    disconnectedCallback() {
        this._detachEventListeners();
    }

    _setTimeFromString(timeStr) {
        if (!timeStr) {
            this._hour = 12;
            this._minute = 0;
            this._second = 0;
            this._isPM = false;
            return;
        }

        // Try to parse the time from the string
        const timeRegex12h = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
        const timeRegex24h = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

        let match;

        if ((match = timeStr.match(timeRegex12h)) !== null) {
            // 12-hour format with AM/PM (e.g., "3:30:00 PM")
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const second = match[3] ? parseInt(match[3], 10) : 0;
            const period = match[4].toUpperCase();

            // Store in 12-hour format
            this._hour = hour === 0 ? 12 : hour > 12 ? hour % 12 : hour;
            this._minute = minute;
            this._second = second;
            this._isPM = period === 'PM';
        } else if ((match = timeStr.match(timeRegex24h)) !== null) {
            // 24-hour format (e.g., "15:30:00")
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const second = match[3] ? parseInt(match[3], 10) : 0;

            // Convert to 12-hour format for internal storage
            const isPM = hour >= 12;
            hour = hour % 12;
            if (hour === 0) hour = 12;

            this._hour = hour;
            this._minute = minute;
            this._second = second;
            this._isPM = isPM;
        } else {
            // Invalid format, use defaults
            this._hour = 12;
            this._minute = 0;
            this._second = 0;
            this._isPM = false;
        }

        // Ensure values are in valid ranges
        this._hour = Math.max(this._format === '12h' ? 1 : 0, Math.min(this._format === '12h' ? 12 : 23, this._hour));
        this._minute = Math.max(0, Math.min(59, this._minute));
        this._second = Math.max(0, Math.min(59, this._second));
    }

    _attachEventListeners() {
        // Add event listener to the input display
        const inputDisplay = this.shadowRoot.querySelector('.timepicker-input');
        inputDisplay.addEventListener('click', this._handleInputClick);

        // Add event listeners to the input fields in the dropdown
        const hourInput = this.shadowRoot.querySelector('.timepicker-hour');
        const minuteInput = this.shadowRoot.querySelector('.timepicker-minute');
        const secondInput = this.shadowRoot.querySelector('.timepicker-second');
        const periodSelect = this.shadowRoot.querySelector('.timepicker-period');
        const timeSelector = this.shadowRoot.querySelector('.time-selector');

        if (hourInput) hourInput.addEventListener('change', this._handleInputChange);
        if (minuteInput) minuteInput.addEventListener('change', this._handleInputChange);
        if (secondInput) secondInput.addEventListener('change', this._handleInputChange);
        if (periodSelect) periodSelect.addEventListener('change', this._handlePeriodChange);
        if (timeSelector) timeSelector.addEventListener('click', this._handleTimeSelectorClick);

        // Add global click listener to close dropdown when clicking outside
        document.addEventListener('click', this._handleDocumentClick);
    }

    _detachEventListeners() {
        document.removeEventListener('click', this._handleDocumentClick);
    }

    _handleInputClick(e) {
        e.stopPropagation();
        this._toggleTimeSelector();
    }

    _handleTimeSelectorClick(e) {
        // Prevent clicks inside the time selector from propagating to document
        e.stopPropagation();
    }

    _handleDocumentClick(e) {
        if (this._isOpen) {
            this._closeTimeSelector();
        }
    }

    _toggleTimeSelector() {
        if (this._isOpen) {
            this._closeTimeSelector();
        } else {
            this._openTimeSelector();
        }
    }

    _openTimeSelector() {
        if (!this._isOpen) {
            this._isOpen = true;
            const timeSelector = this.shadowRoot.querySelector('.time-selector');
            timeSelector.style.display = 'flex';
            this._updateTimeSelectorInputs();
        }
    }

    _closeTimeSelector() {
        if (this._isOpen) {
            this._isOpen = false;
            const timeSelector = this.shadowRoot.querySelector('.time-selector');
            timeSelector.style.display = 'none';
        }
    }

    _handleInputChange(e) {
        const target = e.target;
        let value = parseInt(target.value, 10);

        if (target.classList.contains('timepicker-hour')) {
            const min = this._format === '12h' ? 1 : 0;
            const max = this._format === '12h' ? 12 : 23;
            this._hour = Math.max(min, Math.min(max, value));
            target.value = this._hour;
        } else if (target.classList.contains('timepicker-minute')) {
            this._minute = Math.max(0, Math.min(59, value));
            target.value = this._minute.toString().padStart(2, '0');
        } else if (target.classList.contains('timepicker-second')) {
            this._second = Math.max(0, Math.min(59, value));
            target.value = this._second.toString().padStart(2, '0');
        }

        this._updateUI();
    }

    _handlePeriodChange(e) {
        this._isPM = e.target.value === 'PM';
        this._updateUI();
    }

    _updateUI() {
        // Update the display input
        const displayInput = this.shadowRoot.querySelector('.timepicker-input');
        if (displayInput) {
            displayInput.value = this._formatTimeForDisplay();
        }

        // Update the dropdown inputs if they exist
        this._updateTimeSelectorInputs();

        // Dispatch change event
        this._dispatchChangeEvent();
    }

    _updateTimeSelectorInputs() {
        if (!this._isOpen) return;

        const hourInput = this.shadowRoot.querySelector('.timepicker-hour');
        const minuteInput = this.shadowRoot.querySelector('.timepicker-minute');
        const secondInput = this.shadowRoot.querySelector('.timepicker-second');
        const periodSelect = this.shadowRoot.querySelector('.timepicker-period');

        if (hourInput) hourInput.value = this._hour;
        if (minuteInput) minuteInput.value = this._minute.toString().padStart(2, '0');
        if (secondInput) secondInput.value = this._second.toString().padStart(2, '0');
        if (periodSelect) periodSelect.value = this._isPM ? 'PM' : 'AM';
    }

    _dispatchChangeEvent() {
        let timeValue = this._formatTime();

        this.dispatchEvent(
            new CustomEvent('change', {
                detail: {
                    hour: this._format === '24h' ? this._getHour24() : this._hour,
                    minute: this._minute,
                    second: this._second,
                    period: this._isPM ? 'PM' : 'AM',
                    value: timeValue,
                },
                bubbles: true,
            })
        );
    }

    // Helper method to get the current hour in 24h format
    _getHour24() {
        if (this._isPM) {
            return this._hour === 12 ? 12 : this._hour + 12;
        } else {
            return this._hour === 12 ? 0 : this._hour;
        }
    }

    _formatTime() {
        // Full format including seconds (used for the event)
        if (this._format === '12h') {
            const hour = this._hour.toString();
            const minute = this._minute.toString().padStart(2, '0');
            const second = this._second.toString().padStart(2, '0');
            const period = this._isPM ? 'PM' : 'AM';
            return `${hour}:${minute}:${second} ${period}`;
        } else {
            const hour24 = this._getHour24();
            const hour = hour24.toString().padStart(2, '0');
            const minute = this._minute.toString().padStart(2, '0');
            const second = this._second.toString().padStart(2, '0');
            return `${hour}:${minute}:${second}`;
        }
    }

    _formatTimeForDisplay() {
        // Format for display in the input field (may exclude seconds)
        if (this._format === '12h') {
            const hour = this._hour.toString();
            const minute = this._minute.toString().padStart(2, '0');
            const period = this._isPM ? 'PM' : 'AM';

            if (this._showSeconds) {
                const second = this._second.toString().padStart(2, '0');
                return `${hour}:${minute}:${second} ${period}`;
            } else {
                return `${hour}:${minute} ${period}`;
            }
        } else {
            const hour24 = this._getHour24();
            const hour = hour24.toString().padStart(2, '0');
            const minute = this._minute.toString().padStart(2, '0');

            if (this._showSeconds) {
                const second = this._second.toString().padStart(2, '0');
                return `${hour}:${minute}:${second}`;
            } else {
                return `${hour}:${minute}`;
            }
        }
    }

    _render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: var(--font, sans-serif);
                position: relative;
            }
            
            * {
                box-sizing: border-box;
                padding: 0;
                margin: 0;
                user-select: none;
            }
            
            .timepicker-container {
                position: relative;
                width: 100%;
            }
            
            .timepicker-label {
                display: block;
                margin-bottom: var(--padding-2, 5px);
                color: var(--fg-1, #333);
                font-size: 14px;
            }
            
            .timepicker-input-wrapper {
                position: relative;
                width: 100%;
            }
            
            .timepicker-input {
                width: 100%;
                padding: var(--padding-w2, 8px);
                background: var(--bg-1, #fff);
                border: 1px solid var(--border-1, #ccc);
                border-radius: var(--radius, 4px);
                color: var(--fg-1, #333);
                font-size: 14px;
                box-sizing: border-box;
                cursor: pointer;
            }
            
            .timepicker-input:focus {
                outline: none;
                border-color: var(--fg-accent, #3498db);
            }
            
            .clock-icon {
                position: absolute;
                right: var(--padding-3, 10px);
                top: 50%;
                transform: translateY(-50%);
                color: var(--fg-2, #666);
                pointer-events: none;
                display: flex;
            }
            
            .time-selector {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                z-index: 100;
                background: var(--bg-1, #fff);
                border: 1px solid var(--fg-accent, #3498db);
                border-radius: var(--radius, 4px);
                display: none;
                flex-direction: column;
                padding: var(--padding-4, 15px);
                filter: var(--drop-shadow);
            }
            
            .time-selector-inputs {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            
            .input-group {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .input-label {
                font-size: 12px;
                color: var(--fg-2, #666);
                margin-bottom: 3px;
            }
            
            .timepicker-input-field {
                padding: var(--padding-2);
                background: var(--bg-1, #fff);
                border: 1px solid var(--border-1, #ccc);
                border-radius: var(--radius, 4px);
                color: var(--fg-1, #333);
                font-size: 14px;
                text-align: center;
            }
            
            .timepicker-input-field:focus {
                outline: none;
                border-color: var(--fg-accent, #3498db);
            }
            
            .timepicker-separator {
                font-weight: bold;
                padding: 0 2px;
                color: var(--fg-2, #666);
                margin-top: 18px;
            }
            
            .timepicker-period {
                padding: var(--padding-2);
                background: var(--bg-1, #fff);
                border: 1px solid var(--border-1, #ccc);
                border-radius: var(--radius, 4px);
                color: var(--fg-1, #333);
                font-size: 14px;
                margin-top: 18px;
            }
            
            .time-selector-footer {
                display: flex;
                justify-content: flex-end;
                margin-top: var(--padding-3, 10px);
            }
            
            /* Hide number input spinners */
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            input[type="number"] {
                -moz-appearance: textfield;
            }
        </style>
        
        <div class="timepicker-container">
            ${this._label ? `<label class="timepicker-label">${this._label}</label>` : ''}
            <div class="timepicker-input-wrapper">
                <input type="text" 
                       class="timepicker-input" 
                       placeholder="${this._placeholder}" 
                       readonly 
                       value="${this._formatTimeForDisplay()}"
                       aria-haspopup="true"
                       aria-expanded="${this._isOpen}"
                       aria-label="${this._label || 'Time picker'}">
                <span class="clock-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </span>
            </div>
            
            <div class="time-selector" role="dialog" aria-modal="true" aria-label="Time picker">
                <div class="time-selector-inputs">
                    <div class="input-group">
                        <label class="input-label">H</label>
                        <input type="number" 
                               class="timepicker-input-field timepicker-hour" 
                               min="${this._format === '12h' ? 1 : 0}" 
                               max="${this._format === '12h' ? 12 : 23}" 
                               value="${this._hour}"
                               aria-label="Hour">
                    </div>
                    
                    <span class="timepicker-separator">:</span>
                    
                    <div class="input-group">
                        <label class="input-label">M</label>
                        <input type="number" 
                               class="timepicker-input-field timepicker-minute" 
                               min="0" 
                               max="59" 
                               value="${this._minute.toString().padStart(2, '0')}"
                               aria-label="Minute">
                    </div>
                    
                    ${
                        this._showSeconds
                            ? `
                    <span class="timepicker-separator">:</span>
                    
                    <div class="input-group">
                        <label class="input-label">S</label>
                        <input type="number" 
                               class="timepicker-input-field timepicker-second" 
                               min="0" 
                               max="59" 
                               value="${this._second.toString().padStart(2, '0')}"
                               aria-label="Second">
                    </div>
                    `
                            : ''
                    }
                    
                    ${
                        this._format === '12h'
                            ? `
                    <span class="timepicker-separator"></span>
                    <select class="timepicker-period" aria-label="Period">
                        <option value="AM" ${!this._isPM ? 'selected' : ''}>AM</option>
                        <option value="PM" ${this._isPM ? 'selected' : ''}>PM</option>
                    </select>
                    `
                            : ''
                    }
                </div>
            </div>
        </div>
        `;
    }
}

// Define the custom element
customElements.define('jalebi-timepicker', JalebiTimepicker);

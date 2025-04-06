class JalebiSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default properties
        this._min = 0;
        this._max = 100;
        this._value = 50;
        this._step = 1;
        this._interval = null; // For stepped intervals
        this._showLabels = true;
        this._showValue = true;

        // Render the component
        this.render();
    }

    // Component attributes
    static get observedAttributes() {
        return ['min', 'max', 'value', 'step', 'interval', 'hide-labels', 'hide-value'];
    }

    // Attribute changed callback
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'min':
                this._min = Number(newValue);
                break;
            case 'max':
                this._max = Number(newValue);
                break;
            case 'value':
                this._value = Number(newValue);
                break;
            case 'step':
                this._step = Number(newValue);
                break;
            case 'interval':
                this._interval = newValue ? Number(newValue) : null;
                break;
            case 'hide-labels':
                this._showLabels = newValue === null || newValue === 'false';
                break;
            case 'hide-value':
                this._showValue = newValue === null || newValue === 'false';
                break;
        }
        this.updateSlider();
    }

    // Getters and setters
    get min() {
        return this._min;
    }
    set min(val) {
        this._min = Number(val);
        this.setAttribute('min', val);
        this.updateSlider();
    }

    get max() {
        return this._max;
    }
    set max(val) {
        this._max = Number(val);
        this.setAttribute('max', val);
        this.updateSlider();
    }

    get value() {
        return this._value;
    }
    set value(val) {
        this._value = Number(val);
        this.setAttribute('value', val);
        this.updateSlider();
    }

    get step() {
        return this._step;
    }
    set step(val) {
        this._step = Number(val);
        this.setAttribute('step', val);
    }

    get interval() {
        return this._interval;
    }
    set interval(val) {
        this._interval = val ? Number(val) : null;
        if (val === null) {
            this.removeAttribute('interval');
        } else {
            this.setAttribute('interval', val);
        }
        this.renderIntervalMarkers();
    }

    // Getter and setter for showLabels
    get showLabels() {
        return this._showLabels;
    }
    set showLabels(val) {
        this._showLabels = val;
        if (val) {
            this.removeAttribute('hide-labels');
        } else {
            this.setAttribute('hide-labels', '');
        }
        this.updateLayout();
    }

    // Getter and setter for showValue
    get showValue() {
        return this._showValue;
    }
    set showValue(val) {
        this._showValue = val;
        if (val) {
            this.removeAttribute('hide-value');
        } else {
            this.setAttribute('hide-value', '');
        }
        this.updateLayout();
    }

    // Update container layout based on visibility settings
    updateLayout() {
        if (!this.shadowRoot) return;

        const container = this.shadowRoot.querySelector('.slider-container');
        const labelContainer = this.shadowRoot.querySelector('.slider-label-container');
        const valueDisplay = this.shadowRoot.querySelector('.slider-value');

        if (container) {
            container.style.paddingTop = this._showLabels ? '20px' : '0';
            container.style.paddingBottom = this._showValue ? '24px' : '0';
        }

        if (labelContainer) {
            labelContainer.style.display = this._showLabels ? 'flex' : 'none';
        }

        if (valueDisplay) {
            valueDisplay.style.display = this._showValue ? 'block' : 'none';
        }
    }

    // Initial rendering
    render() {
        // Create the styles
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                font-family: var(--font);
                margin: var(--padding-4) 0;
                width: 100%;
                max-width: 300px;
            }
            
            .slider-container {
                width: 100%;
                position: relative;
                padding-top: ${this._showLabels ? '20px' : '0'};
                padding-bottom: ${this._showValue ? '24px' : '0'};
            }
            
            .slider-label-container {
                display: ${this._showLabels ? 'flex' : 'none'};
                justify-content: space-between;
                color: var(--fg-2);
                font-size: 0.8rem;
                position: absolute;
                width: 100%;
                top: 0;
            }
            
            .slider-value {
                display: ${this._showValue ? 'block' : 'none'};
                color: var(--fg-1);
                font-weight: 500;
                text-align: center;
                position: absolute;
                bottom: 0;
                width: 100%;
                font-size: 0.9rem;
            }
            
            .slider-track {
                position: relative;
                height: 6px;
                background-color: var(--bg-3);
                border-radius: var(--radius);
                margin: 10px 0;
            }
            
            .slider-progress {
                position: absolute;
                height: 100%;
                background-color: var(--fg-accent);
                border-radius: var(--radius);
            }
            
            .slider-thumb {
                position: absolute;
                top: 50%;
                width: 16px;
                height: 16px;
                background-color: var(--fg-accent);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                cursor: pointer;
                transition: transform 0.1s ease;
            }
            
            .slider-thumb:hover {
                transform: translate(-50%, -50%) scale(1.1);
            }
            
            .slider-thumb:active {
                transform: translate(-50%, -50%) scale(1.2);
            }
            
            .interval-markers {
                position: absolute;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            
            .interval-marker {
                position: absolute;
                width: 2px;
                height: 8px;
                background-color: var(--fg-2);
                transform: translateX(-50%);
                top: -1px;
                opacity: 0.5;
            }
            
            /* Focus states for accessibility */
            input[type="range"] {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                cursor: pointer;
                margin: 0;
                z-index: 2;
            }
            
            input[type="range"]:focus + .slider-thumb {
                box-shadow: 0 0 0 3px var(--bg-accent);
            }
        `;

        // Create the structure
        const container = document.createElement('div');
        container.className = 'slider-container';

        // Labels
        const labelContainer = document.createElement('div');
        labelContainer.className = 'slider-label-container';
        labelContainer.style.display = this._showLabels ? 'flex' : 'none';

        const minLabel = document.createElement('span');
        minLabel.className = 'slider-min-label';
        minLabel.textContent = this._min;

        const maxLabel = document.createElement('span');
        maxLabel.className = 'slider-max-label';
        maxLabel.textContent = this._max;

        labelContainer.appendChild(minLabel);
        labelContainer.appendChild(maxLabel);

        // Value display
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'slider-value';
        valueDisplay.textContent = this._value;
        valueDisplay.style.display = this._showValue ? 'block' : 'none';

        // Track
        const track = document.createElement('div');
        track.className = 'slider-track';

        // Progress
        const progress = document.createElement('div');
        progress.className = 'slider-progress';

        // Interval markers container
        const intervalsContainer = document.createElement('div');
        intervalsContainer.className = 'interval-markers';

        // Input (for accessibility)
        const input = document.createElement('input');
        input.type = 'range';
        input.min = this._min;
        input.max = this._max;
        input.step = this._step;
        input.value = this._value;
        input.setAttribute('aria-label', 'Slider');

        // Thumb
        const thumb = document.createElement('div');
        thumb.className = 'slider-thumb';

        // Event listeners
        input.addEventListener('input', e => {
            this._value = Number(e.target.value);
            this.updateSlider();

            // Dispatch change event
            const event = new CustomEvent('change', {
                detail: { value: this._value },
                bubbles: true,
                composed: true,
            });
            this.dispatchEvent(event);
        });

        // Append elements
        track.appendChild(progress);
        track.appendChild(intervalsContainer);
        track.appendChild(input);
        track.appendChild(thumb);

        container.appendChild(labelContainer);
        container.appendChild(track);
        container.appendChild(valueDisplay);

        // Append to shadow DOM
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(container);

        // Save references to elements that need updates
        this._progressElement = progress;
        this._thumbElement = thumb;
        this._valueElement = valueDisplay;
        this._inputElement = input;
        this._minLabel = minLabel;
        this._maxLabel = maxLabel;
        this._intervalsContainer = intervalsContainer;
        this._labelContainer = labelContainer;
        this._container = container;

        // Initial update
        this.updateSlider();
        this.renderIntervalMarkers();
    }

    // Render interval markers if interval is set
    renderIntervalMarkers() {
        if (!this._intervalsContainer) return;

        // Clear existing markers
        this._intervalsContainer.innerHTML = '';

        // If interval is not set, do nothing
        if (!this._interval) return;

        const range = this._max - this._min;
        const numMarkers = Math.floor(range / this._interval);

        // Create markers
        for (let i = 1; i <= numMarkers; i++) {
            const value = this._min + i * this._interval;
            const percentage = ((value - this._min) / range) * 100;

            const marker = document.createElement('div');
            marker.className = 'interval-marker';
            marker.style.left = `${percentage}%`;

            this._intervalsContainer.appendChild(marker);
        }
    }

    // Update slider visuals
    updateSlider() {
        if (!this._progressElement || !this._thumbElement || !this._valueElement || !this._inputElement) {
            return;
        }

        // Calculate percentage
        const range = this._max - this._min;
        const percentage = ((this._value - this._min) / range) * 100;

        // Update progress bar width
        this._progressElement.style.width = `${percentage}%`;

        // Update thumb position
        this._thumbElement.style.left = `${percentage}%`;

        // Update value text
        this._valueElement.textContent = this._value;

        // Update input value
        this._inputElement.value = this._value;
        this._inputElement.min = this._min;
        this._inputElement.max = this._max;
        this._inputElement.step = this._step;

        // Update labels
        this._minLabel.textContent = this._min;
        this._maxLabel.textContent = this._max;

        // Update layout
        this.updateLayout();
    }
}

// Register the custom element
customElements.define('jalebi-slider', JalebiSlider);

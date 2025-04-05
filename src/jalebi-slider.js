class JalebiSlider extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default properties
        this._min = 0;
        this._max = 100;
        this._value = 50;
        this._step = 1;
        this._showLabels = true;
        this._showValue = true;

        // Render the component
        this.render();
    }

    // Component attributes
    static get observedAttributes() {
        return ['min', 'max', 'value', 'step', 'show-labels', 'show-value'];
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
            case 'show-labels':
                this._showLabels = newValue !== 'false';
                break;
            case 'show-value':
                this._showValue = newValue !== 'false';
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

    // Initial rendering
    render() {
        // Create the styles
        const style = document.createElement('style');
        style.textContent = `
      :host {
        display: block;
        font-family: var(--font);
        margin: var(--padding-4) 0;
        width: 220px;
      }
      
      .slider-container {
        width: 100%;
        position: relative;
      }
      
      .slider-label-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--padding-2);
        color: var(--fg-2);
        font-size: 0.9rem;
        position: absolute;
        width: 100%;
      }
      
      .slider-value {
        color: var(--fg-accent);
        font-weight: bold;
        text-align: center;
        margin-bottom: var(--padding-2);
      }
      
      .slider-track {
        position: relative;
        height: 6px;
        background-color: var(--bg-3);
        border-radius: var(--radius);
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
      }
      
      .slider-thumb:hover, .slider-thumb:active {
        background-color: var(--fg-accent);
      }
      
      input[type="range"] {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        margin: 0;
      }
    `;

        // Create the structure
        const container = document.createElement('div');
        container.className = 'slider-container';

        // Labels
        const labelContainer = document.createElement('div');
        labelContainer.className = 'slider-label-container';

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

        // Track
        const track = document.createElement('div');
        track.className = 'slider-track';

        // Progress
        const progress = document.createElement('div');
        progress.className = 'slider-progress';

        // Thumb
        const thumb = document.createElement('div');
        thumb.className = 'slider-thumb';

        // Input (for accessibility)
        const input = document.createElement('input');
        input.type = 'range';
        input.min = this._min;
        input.max = this._max;
        input.step = this._step;
        input.value = this._value;
        input.setAttribute('aria-label', 'Slider');

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
        track.appendChild(thumb);
        track.appendChild(input);

        if (this._showLabels) {
            container.appendChild(labelContainer);
        }

        if (this._showValue) {
            container.appendChild(valueDisplay);
        }

        container.appendChild(track);

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

        // Initial update
        this.updateSlider();
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
    }
}

// Register the custom element
customElements.define('jalebi-slider', JalebiSlider);

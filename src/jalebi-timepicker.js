class JalebiTimepicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default values
        this._hour = 12;
        this._minute = 0;
        this._isPM = false;
        this._isOpen = false;
        this._inputValue = '';
        this._format = '12h'; // '12h' or '24h'
        this._placeholder = 'Select time';
        this._label = '';

        // For rotation and animation
        this._hourRotation = 0;
        this._minuteRotation = 0;
        this._periodRotation = 0;

        // For scrolling and dragging
        this._hourScrolling = false;
        this._minuteScrolling = false;
        this._periodScrolling = false;
        this._startY = 0;
        this._currentY = 0;
        this._dragDistance = 0;
        this._lastDragTime = 0;
        this._dragSpeed = 0;
        this._animationInProgress = false;

        // Scroll limits
        this._hourMin = this._format === '12h' ? 1 : 0;
        this._hourMax = this._format === '12h' ? 12 : 23;
        this._minuteMin = 0;
        this._minuteMax = 59;

        // Animation frame
        this._animationFrame = null;

        // Bind methods
        this._handleInputClick = this._handleInputClick.bind(this);
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handleTimeSelectorClick = this._handleTimeSelectorClick.bind(this);
        this._handleHourScroll = this._handleHourScroll.bind(this);
        this._handleMinuteScroll = this._handleMinuteScroll.bind(this);
        this._handlePeriodScroll = this._handlePeriodScroll.bind(this);
        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._animateMomentum = this._animateMomentum.bind(this);
    }

    static get observedAttributes() {
        return ['format', 'placeholder', 'value', 'label'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'format':
                this._format = newValue;
                this._hourMin = this._format === '12h' ? 1 : 0;
                this._hourMax = this._format === '12h' ? 12 : 23;
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
        }

        if (this.shadowRoot.innerHTML !== '') {
            this._updateUI();
        }
    }

    connectedCallback() {
        this._format = this.getAttribute('format') || this._format;
        this._placeholder = this.getAttribute('placeholder') || this._placeholder;
        this._label = this.getAttribute('label') || this._label;

        // Update hour min/max based on format
        this._hourMin = this._format === '12h' ? 1 : 0;
        this._hourMax = this._format === '12h' ? 12 : 23;

        if (this.getAttribute('value')) {
            this._setTimeFromString(this.getAttribute('value'));
        }

        this._render();
        this._attachEventListeners();
    }

    disconnectedCallback() {
        this._detachEventListeners();
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
        }
    }

    _setTimeFromString(timeStr) {
        if (!timeStr) {
            this._hour = 12;
            this._minute = 0;
            this._isPM = false;
            this._inputValue = '';
            return;
        }

        // Try to parse the time from the string
        const timeRegex12h = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
        const timeRegex24h = /^(\d{1,2}):(\d{2})$/;

        let match;

        if ((match = timeStr.match(timeRegex12h)) !== null) {
            // 12-hour format with AM/PM (e.g., "3:30 PM")
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);
            const period = match[3].toUpperCase();

            // Store in 12-hour format
            this._hour = hour === 0 ? 12 : hour > 12 ? hour % 12 : hour;
            this._minute = minute;
            this._isPM = period === 'PM';
        } else if ((match = timeStr.match(timeRegex24h)) !== null) {
            // 24-hour format (e.g., "15:30")
            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);

            // Convert to 12-hour format for internal storage
            const isPM = hour >= 12;
            hour = hour % 12;
            if (hour === 0) hour = 12;

            this._hour = hour;
            this._minute = minute;
            this._isPM = isPM;
        } else {
            // Invalid format, use defaults
            this._hour = 12;
            this._minute = 0;
            this._isPM = false;
        }

        // Ensure values are in valid ranges
        this._hour = Math.max(1, Math.min(12, this._hour));
        this._minute = Math.max(0, Math.min(59, this._minute));

        // Update input value
        this._inputValue = this._formatTime();
    }

    _attachEventListeners() {
        const input = this.shadowRoot.querySelector('.timepicker-input');
        input.addEventListener('click', this._handleInputClick);
        input.addEventListener('keydown', this._handleKeyDown);

        const timeSelector = this.shadowRoot.querySelector('.time-selector');
        if (timeSelector) {
            timeSelector.addEventListener('click', this._handleTimeSelectorClick);
        }

        // Add scroll and drag event listeners to hour, minute, and period columns
        const hourColumn = this.shadowRoot.querySelector('.hour-column');
        const minuteColumn = this.shadowRoot.querySelector('.minute-column');
        const periodColumn = this.shadowRoot.querySelector('.period-column');

        if (hourColumn) {
            hourColumn.addEventListener('wheel', this._handleHourScroll);
            hourColumn.addEventListener('mousedown', e => this._handleMouseDown(e, 'hour'));
            hourColumn.addEventListener('touchstart', e => this._handleTouchStart(e, 'hour'), { passive: false });
        }

        if (minuteColumn) {
            minuteColumn.addEventListener('wheel', this._handleMinuteScroll);
            minuteColumn.addEventListener('mousedown', e => this._handleMouseDown(e, 'minute'));
            minuteColumn.addEventListener('touchstart', e => this._handleTouchStart(e, 'minute'), { passive: false });
        }

        if (periodColumn) {
            periodColumn.addEventListener('wheel', this._handlePeriodScroll);
            periodColumn.addEventListener('mousedown', e => this._handleMouseDown(e, 'period'));
            periodColumn.addEventListener('touchstart', e => this._handleTouchStart(e, 'period'), { passive: false });
        }

        // Add mouse and touch event listeners to document for drag handling
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
        document.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        document.addEventListener('touchend', this._handleTouchEnd);
        document.addEventListener('click', this._handleDocumentClick);
    }

    _detachEventListeners() {
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
        document.removeEventListener('touchmove', this._handleTouchMove);
        document.removeEventListener('touchend', this._handleTouchEnd);
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
        // Close the time selector if clicking outside of it and the input
        const inputWrapper = this.shadowRoot.querySelector('.timepicker-input-wrapper');
        const timeSelector = this.shadowRoot.querySelector('.time-selector');

        if (this._isOpen && !inputWrapper.contains(e.target) && !timeSelector.contains(e.target)) {
            this._closeTimeSelector();
        }
    }

    _handleHourScroll(e) {
        e.preventDefault();
        if (this._animationInProgress) return;

        const delta = Math.sign(e.deltaY);

        // Check if we've reached scroll limits
        if (this._format === '24h') {
            const hour24 = this._getHour24();
            if ((hour24 <= 0 && delta > 0) || (hour24 >= 23 && delta < 0)) {
                // Bounce effect at limits
                this._bounceAnimation('.hour-column', delta);
                return;
            }
        } else {
            if ((this._hour <= 1 && delta > 0) || (this._hour >= 12 && delta < 0)) {
                // Bounce effect at limits
                this._bounceAnimation('.hour-column', delta);
                return;
            }
        }

        this._updateHour(delta);
        this._rotateAnimation('.hour-column-items', delta, 25);
    }

    _handleMinuteScroll(e) {
        e.preventDefault();
        if (this._animationInProgress) return;

        const delta = Math.sign(e.deltaY);

        // Check if we've reached scroll limits
        if ((this._minute <= 0 && delta > 0) || (this._minute >= 59 && delta < 0)) {
            // Bounce effect at limits
            this._bounceAnimation('.minute-column', delta);
            return;
        }

        this._updateMinute(delta);
        this._rotateAnimation('.minute-column-items', delta, 25);
    }

    _handlePeriodScroll(e) {
        e.preventDefault();
        if (this._animationInProgress) return;

        this._togglePeriod();
        this._rotateAnimation('.period-column-items', 1, 180);
    }

    _bounceAnimation(columnSelector, direction) {
        const column = this.shadowRoot.querySelector(columnSelector);
        if (!column) return;

        // Add bounce class
        column.classList.add(direction > 0 ? 'bounce-down' : 'bounce-up');

        // Remove class after animation completes
        setTimeout(() => {
            column.classList.remove('bounce-down');
            column.classList.remove('bounce-up');
        }, 300);
    }

    _rotateAnimation(columnSelector, direction, degrees) {
        const columnItems = this.shadowRoot.querySelector(columnSelector);
        if (!columnItems) return;

        this._animationInProgress = true;

        // Get current rotation
        let currentRotation = 0;
        const transform = columnItems.style.transform;
        if (transform && transform.includes('rotateX')) {
            const match = transform.match(/rotateX\(([^)]+)deg\)/);
            if (match) {
                currentRotation = parseFloat(match[1]);
            }
        }

        // Calculate target rotation
        const targetRotation = currentRotation + direction * degrees;

        // Animation timing variables
        const startTime = performance.now();
        const duration = 300; // ms

        const animateStep = timestamp => {
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / duration, 1);

            // Apply easing for smoother animation
            progress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            const newRotation = currentRotation + progress * direction * degrees;
            columnItems.style.transform = `rotateX(${newRotation}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animateStep);
            } else {
                // Reset rotation when finished to avoid accumulating large values
                columnItems.style.transform = 'rotateX(0deg)';
                this._animationInProgress = false;
            }
        };

        requestAnimationFrame(animateStep);
    }

    _handleMouseDown(e, type) {
        e.preventDefault();
        if (this._animationInProgress) return;

        this._startY = e.clientY;
        this._currentY = e.clientY;
        this._dragDistance = 0;
        this._lastDragTime = performance.now();
        this._dragSpeed = 0;

        if (type === 'hour') {
            this._hourScrolling = true;
        } else if (type === 'minute') {
            this._minuteScrolling = true;
        } else if (type === 'period') {
            this._periodScrolling = true;
        }
    }

    _handleMouseMove(e) {
        if (!this._hourScrolling && !this._minuteScrolling && !this._periodScrolling) return;
        if (this._animationInProgress) return;

        const now = performance.now();
        const deltaY = e.clientY - this._currentY;
        const deltaTime = now - this._lastDragTime;

        this._currentY = e.clientY;
        this._dragDistance += deltaY;
        this._lastDragTime = now;

        // Calculate drag speed for momentum
        if (deltaTime > 0) {
            this._dragSpeed = deltaY / deltaTime;
        }

        if (Math.abs(deltaY) < 1) return; // Threshold to prevent tiny movements

        const direction = Math.sign(deltaY);
        const rotationAmount = Math.min(Math.abs(deltaY), 20) * direction;

        if (this._hourScrolling) {
            // Check if we've reached scroll limits
            if (this._format === '24h') {
                const hour24 = this._getHour24();
                if ((hour24 <= 0 && direction > 0) || (hour24 >= 23 && direction < 0)) {
                    // Apply resistance at limits (reduced rotation)
                    this._applyColumnRotation('.hour-column-items', rotationAmount * 0.2);
                    return;
                }
            } else {
                if ((this._hour <= 1 && direction > 0) || (this._hour >= 12 && direction < 0)) {
                    // Apply resistance at limits (reduced rotation)
                    this._applyColumnRotation('.hour-column-items', rotationAmount * 0.2);
                    return;
                }
            }

            // If not at limits, allow normal rotation and update value
            this._applyColumnRotation('.hour-column-items', rotationAmount);

            // Only update the actual hour value after sufficient movement
            if (Math.abs(this._dragDistance) >= 20) {
                this._updateHour(direction);
                this._dragDistance = 0;
            }
        } else if (this._minuteScrolling) {
            // Check if we've reached scroll limits
            if ((this._minute <= 0 && direction > 0) || (this._minute >= 59 && direction < 0)) {
                // Apply resistance at limits (reduced rotation)
                this._applyColumnRotation('.minute-column-items', rotationAmount * 0.2);
                return;
            }

            // If not at limits, allow normal rotation and update value
            this._applyColumnRotation('.minute-column-items', rotationAmount);

            // Only update the actual minute value after sufficient movement
            if (Math.abs(this._dragDistance) >= 20) {
                this._updateMinute(direction);
                this._dragDistance = 0;
            }
        } else if (this._periodScrolling) {
            // For period, we just want to toggle after sufficient drag
            this._applyColumnRotation('.period-column-items', rotationAmount);

            if (Math.abs(this._dragDistance) >= 50 && !this._periodToggleDebounce) {
                this._togglePeriod();
                this._dragDistance = 0;

                // Debounce period toggle to prevent rapid toggling
                this._periodToggleDebounce = true;
                setTimeout(() => {
                    this._periodToggleDebounce = false;
                }, 300);
            }
        }
    }

    _applyColumnRotation(columnSelector, rotationAmount) {
        const columnItems = this.shadowRoot.querySelector(columnSelector);
        if (!columnItems) return;

        let currentRotation = 0;
        const transform = columnItems.style.transform;
        if (transform && transform.includes('rotateX')) {
            const match = transform.match(/rotateX\(([^)]+)deg\)/);
            if (match) {
                currentRotation = parseFloat(match[1]);
            }
        }

        // Apply rotation with some damping to avoid jumpy behavior
        columnItems.style.transform = `rotateX(${currentRotation + rotationAmount * 0.8}deg)`;
    }

    _animateMomentum(type, startSpeed) {
        // If there's already an animation in progress, don't start a new one
        if (this._animationInProgress) return;

        this._animationInProgress = true;

        // Determine which column to animate
        let columnSelector;
        let isAtLimit = false;
        let limitDirection = 0;

        if (type === 'hour') {
            columnSelector = '.hour-column-items';

            if (this._format === '24h') {
                const hour24 = this._getHour24();
                if (hour24 <= 0 && startSpeed > 0) {
                    isAtLimit = true;
                    limitDirection = 1;
                } else if (hour24 >= 23 && startSpeed < 0) {
                    isAtLimit = true;
                    limitDirection = -1;
                }
            } else {
                if (this._hour <= 1 && startSpeed > 0) {
                    isAtLimit = true;
                    limitDirection = 1;
                } else if (this._hour >= 12 && startSpeed < 0) {
                    isAtLimit = true;
                    limitDirection = -1;
                }
            }
        } else if (type === 'minute') {
            columnSelector = '.minute-column-items';

            if (this._minute <= 0 && startSpeed > 0) {
                isAtLimit = true;
                limitDirection = 1;
            } else if (this._minute >= 59 && startSpeed < 0) {
                isAtLimit = true;
                limitDirection = -1;
            }
        } else if (type === 'period') {
            // For period, we don't apply momentum
            this._resetColumnRotation('.period-column-items');
            this._animationInProgress = false;
            return;
        }

        const column = this.shadowRoot.querySelector(columnSelector);
        if (!column) {
            this._animationInProgress = false;
            return;
        }

        // If at a limit, apply a bounce effect instead of momentum
        if (isAtLimit) {
            this._bounceAnimationAtLimit(columnSelector, limitDirection);
            return;
        }

        // Apply momentum animation
        let speed = startSpeed * 100; // Scale up for more dramatic effect
        let lastTimestamp = performance.now();
        let stepsWithoutUpdate = 0;

        const applyMomentum = timestamp => {
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            // Apply friction to slow down
            speed *= 0.95;

            // Apply rotation based on current speed
            const rotationAmount = (speed * deltaTime) / 16; // Normalize to 60fps

            // Check if we should update the value
            if (Math.abs(rotationAmount) >= 1) {
                this._applyColumnRotation(columnSelector, rotationAmount);

                // Accumulate rotation and update value when threshold reached
                stepsWithoutUpdate++;
                if (stepsWithoutUpdate >= 3) {
                    if (type === 'hour') {
                        this._updateHour(Math.sign(-speed));
                    } else if (type === 'minute') {
                        this._updateMinute(Math.sign(-speed));
                    }
                    stepsWithoutUpdate = 0;
                }
            }

            // Continue animation until speed is negligible
            if (Math.abs(speed) > 0.1) {
                this._animationFrame = requestAnimationFrame(applyMomentum);
            } else {
                // Reset rotation to 0 when finished
                this._resetColumnRotation(columnSelector);
                this._animationInProgress = false;
            }
        };

        this._animationFrame = requestAnimationFrame(applyMomentum);
    }

    _bounceAnimationAtLimit(columnSelector, direction) {
        const column = this.shadowRoot.querySelector(columnSelector);
        if (!column) {
            this._animationInProgress = false;
            return;
        }

        // Reset to 0 rotation first
        column.style.transform = 'rotateX(0deg)';

        // Bounce variables
        const maxBounce = 15; // degrees
        const duration = 400; // ms
        const startTime = performance.now();

        const animateBounce = timestamp => {
            const elapsed = timestamp - startTime;
            let progress = elapsed / duration;

            if (progress < 1) {
                // Create a bounce effect using a damped sine wave
                const bounce = Math.sin(progress * Math.PI * 3) * Math.exp(-progress * 3) * maxBounce;
                column.style.transform = `rotateX(${bounce * direction}deg)`;
                this._animationFrame = requestAnimationFrame(animateBounce);
            } else {
                // Reset to 0 when finished
                column.style.transform = 'rotateX(0deg)';
                this._animationInProgress = false;
            }
        };

        this._animationFrame = requestAnimationFrame(animateBounce);
    }

    _resetColumnRotation(columnSelector) {
        const column = this.shadowRoot.querySelector(columnSelector);
        if (column) {
            column.style.transform = 'rotateX(0deg)';
        }
    }

    _handleMouseUp() {
        if (this._hourScrolling) {
            // Apply momentum animation based on drag speed
            this._animateMomentum('hour', this._dragSpeed);
            this._hourScrolling = false;
        } else if (this._minuteScrolling) {
            this._animateMomentum('minute', this._dragSpeed);
            this._minuteScrolling = false;
        } else if (this._periodScrolling) {
            this._resetColumnRotation('.period-column-items');
            this._periodScrolling = false;
        }

        this._dragDistance = 0;
    }

    _handleTouchStart(e, type) {
        e.preventDefault();
        if (this._animationInProgress) return;

        const touch = e.touches[0];
        this._startY = touch.clientY;
        this._currentY = touch.clientY;
        this._dragDistance = 0;
        this._lastDragTime = performance.now();
        this._dragSpeed = 0;

        if (type === 'hour') {
            this._hourScrolling = true;
        } else if (type === 'minute') {
            this._minuteScrolling = true;
        } else if (type === 'period') {
            this._periodScrolling = true;
        }
    }

    _handleTouchMove(e) {
        if (!this._hourScrolling && !this._minuteScrolling && !this._periodScrolling) return;
        if (this._animationInProgress) return;

        e.preventDefault();

        const now = performance.now();
        const touch = e.touches[0];
        const deltaY = touch.clientY - this._currentY;
        const deltaTime = now - this._lastDragTime;

        this._currentY = touch.clientY;
        this._dragDistance += deltaY;
        this._lastDragTime = now;

        // Calculate drag speed for momentum
        if (deltaTime > 0) {
            this._dragSpeed = deltaY / deltaTime;
        }

        if (Math.abs(deltaY) < 1) return; // Threshold to prevent tiny movements

        const direction = Math.sign(deltaY);
        const rotationAmount = Math.min(Math.abs(deltaY), 20) * direction;

        if (this._hourScrolling) {
            // Check if we've reached scroll limits
            if (this._format === '24h') {
                const hour24 = this._getHour24();
                if ((hour24 <= 0 && direction > 0) || (hour24 >= 23 && direction < 0)) {
                    // Apply resistance at limits (reduced rotation)
                    this._applyColumnRotation('.hour-column-items', rotationAmount * 0.2);
                    return;
                }
            } else {
                if ((this._hour <= 1 && direction > 0) || (this._hour >= 12 && direction < 0)) {
                    // Apply resistance at limits (reduced rotation)
                    this._applyColumnRotation('.hour-column-items', rotationAmount * 0.2);
                    return;
                }
            }

            // If not at limits, allow normal rotation and update value
            this._applyColumnRotation('.hour-column-items', rotationAmount);

            // Only update the actual hour value after sufficient movement
            if (Math.abs(this._dragDistance) >= 20) {
                this._updateHour(direction);
                this._dragDistance = 0;
            }
        } else if (this._minuteScrolling) {
            // Check if we've reached scroll limits
            if ((this._minute <= 0 && direction > 0) || (this._minute >= 59 && direction < 0)) {
                // Apply resistance at limits (reduced rotation)
                this._applyColumnRotation('.minute-column-items', rotationAmount * 0.2);
                return;
            }

            // If not at limits, allow normal rotation and update value
            this._applyColumnRotation('.minute-column-items', rotationAmount);

            // Only update the actual minute value after sufficient movement
            if (Math.abs(this._dragDistance) >= 20) {
                this._updateMinute(direction);
                this._dragDistance = 0;
            }
        } else if (this._periodScrolling) {
            // For period, we just want to toggle after sufficient drag
            this._applyColumnRotation('.period-column-items', rotationAmount);

            if (Math.abs(this._dragDistance) >= 50 && !this._periodToggleDebounce) {
                this._togglePeriod();
                this._dragDistance = 0;

                // Debounce period toggle to prevent rapid toggling
                this._periodToggleDebounce = true;
                setTimeout(() => {
                    this._periodToggleDebounce = false;
                }, 300);
            }
        }
    }

    _handleTouchEnd() {
        if (this._hourScrolling) {
            // Apply momentum animation based on drag speed
            this._animateMomentum('hour', this._dragSpeed);
            this._hourScrolling = false;
        } else if (this._minuteScrolling) {
            this._animateMomentum('minute', this._dragSpeed);
            this._minuteScrolling = false;
        } else if (this._periodScrolling) {
            this._resetColumnRotation('.period-column-items');
            this._periodScrolling = false;
        }

        this._dragDistance = 0;
    }

    _handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._toggleTimeSelector();
        } else if (e.key === 'Escape' && this._isOpen) {
            this._closeTimeSelector();
        } else if (e.key === 'Tab' && this._isOpen) {
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
            this._updateTimeSelectorDisplay();
        }
    }

    _closeTimeSelector() {
        if (this._isOpen) {
            this._isOpen = false;
            const timeSelector = this.shadowRoot.querySelector('.time-selector');
            timeSelector.style.display = 'none';
        }
    }

    _updateHour(direction) {
        if (this._format === '12h') {
            // In 12h format, cycle between 1-12 with limits
            if (direction > 0) {
                // Scroll down, decrease hour
                if (this._hour > 1) {
                    this._hour -= 1;
                }
            } else {
                // Scroll up, increase hour
                if (this._hour < 12) {
                    this._hour += 1;
                }
            }
        } else {
            // In 24h format, we need to consider AM/PM and handle 0-23 hour range
            let hour24 = this._getHour24();

            if (direction > 0) {
                // Scroll down, decrease hour
                if (hour24 > 0) {
                    hour24 -= 1;
                }
            } else {
                // Scroll up, increase hour
                if (hour24 < 23) {
                    hour24 += 1;
                }
            }

            // Convert back to internal 12h format
            this._isPM = hour24 >= 12;
            this._hour = hour24 % 12;
            if (this._hour === 0) this._hour = 12;
        }

        this._updateUI();
    }

    _updateMinute(direction) {
        if (direction > 0) {
            // Scroll down, decrease minute with limit
            if (this._minute > 0) {
                this._minute -= 1;
            }
        } else {
            // Scroll up, increase minute with limit
            if (this._minute < 59) {
                this._minute += 1;
            }
        }

        this._updateUI();
    }

    _togglePeriod() {
        this._isPM = !this._isPM;
        this._updateUI();
    }

    // Helper method to get the current hour in 24h format
    _getHour24() {
        if (this._isPM) {
            return this._hour === 12 ? 12 : this._hour + 12;
        } else {
            return this._hour === 12 ? 0 : this._hour;
        }
    }

    _updateUI() {
        // Update input value
        this._inputValue = this._formatTime();
        const input = this.shadowRoot.querySelector('.timepicker-input');
        if (input) {
            input.value = this._inputValue;
        }

        // Update time selector display
        this._updateTimeSelectorDisplay();

        // Dispatch change event
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: {
                    hour: this._format === '24h' ? this._getHour24() : this._hour,
                    minute: this._minute,
                    period: this._isPM ? 'PM' : 'AM',
                    value: this._inputValue,
                },
                bubbles: true,
            })
        );
    }

    _updateTimeSelectorDisplay() {
        if (!this._isOpen) return;

        // Update hour column
        this._updateScrollColumn('hour');

        // Update minute column
        this._updateScrollColumn('minute');

        // Update period column (only in 12h format)
        if (this._format === '12h') {
            this._updateScrollColumn('period');
        }
    }

    // Fixed: Proper display of hours in both 12h and 24h formats
    _updateScrollColumn(type) {
        let values = [];
        let currentValue;
        let columnClass;

        if (type === 'hour') {
            if (this._format === '12h') {
                // In 12h format, show hours 1-12
                currentValue = this._hour;

                // Get 2 hours before and 2 hours after the current hour
                for (let i = -2; i <= 2; i++) {
                    let hourValue = currentValue + i;

                    // Clamp values to limits
                    if (hourValue < 1) hourValue = 1;
                    if (hourValue > 12) hourValue = 12;

                    values.push({
                        value: hourValue,
                        display: hourValue.toString(),
                    });
                }
            } else {
                // In 24h format, show hours 0-23
                const hour24 = this._getHour24();

                // Get 2 hours before and 2 hours after the current hour
                for (let i = -2; i <= 2; i++) {
                    let hourValue = hour24 + i;

                    // Clamp values to limits
                    if (hourValue < 0) hourValue = 0;
                    if (hourValue > 23) hourValue = 23;

                    values.push({
                        value: hourValue,
                        display: hourValue.toString().padStart(2, '0'),
                    });
                }
            }

            columnClass = '.hour-column';
        } else if (type === 'minute') {
            currentValue = this._minute;

            // Get 2 minutes before and 2 minutes after the current minute
            for (let i = -2; i <= 2; i++) {
                let minuteValue = currentValue + i;

                // Clamp values to limits
                if (minuteValue < 0) minuteValue = 0;
                if (minuteValue > 59) minuteValue = 59;

                values.push({
                    value: minuteValue,
                    display: minuteValue.toString().padStart(2, '0'),
                });
            }

            columnClass = '.minute-column';
        } else if (type === 'period' && this._format === '12h') {
            // For period, we just show AM/PM
            const periods = ['AM', 'PM'];
            const currentPeriod = this._isPM ? 'PM' : 'AM';
            const otherPeriod = this._isPM ? 'AM' : 'PM';

            values = [
                { value: !this._isPM, display: otherPeriod },
                { value: !this._isPM, display: otherPeriod },
                { value: this._isPM, display: currentPeriod },
                { value: this._isPM, display: currentPeriod },
                { value: !this._isPM, display: otherPeriod },
            ];

            columnClass = '.period-column';
        } else {
            return; // Invalid type or 24h format for period
        }

        // Update the column in the DOM
        const column = this.shadowRoot.querySelector(columnClass);
        if (!column) return;

        const items = column.querySelectorAll('.time-item');

        values.forEach((value, index) => {
            if (items[index]) {
                items[index].textContent = value.display;
                items[index].className = 'time-item';

                // Add position-based classes
                if (index === 0) items[index].classList.add('far-above');
                if (index === 1) items[index].classList.add('above');
                if (index === 2) items[index].classList.add('current');
                if (index === 3) items[index].classList.add('below');
                if (index === 4) items[index].classList.add('far-below');
            }
        });
    }

    _formatTime() {
        if (this._format === '12h') {
            // In 12h format, we always show 1-12 with AM/PM
            const hour = this._hour.toString();
            const minute = this._minute.toString().padStart(2, '0');
            const period = this._isPM ? 'PM' : 'AM';
            return `${hour}:${minute} ${period}`;
        } else {
            // In 24h format - convert from internal 12h format to 24h display
            const hour24 = this._getHour24();
            const hour = hour24.toString().padStart(2, '0');
            const minute = this._minute.toString().padStart(2, '0');
            return `${hour}:${minute}`;
        }
    }

    _render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: var(--font);
                position: relative;
            }
            
            * {
                box-sizing: border-box;
                padding: 0;
                margin: 0;
                user-select: none;
            }
            
            :root {
                --bg-rgb-1: 255, 255, 255;
            }
            
            .timepicker-container {
                position: relative;
                width: 100%;
            }
            
            .timepicker-label {
                display: block;
                margin-bottom: var(--padding-2);
                color: var(--fg-1);
                font-size: 14px;
            }
            
            .timepicker-input-wrapper {
                position: relative;
                width: 100%;
            }
            
            .timepicker-input {
                width: 100%;
                padding: var(--padding-w2);
                background: var(--bg-1);
                border: 1px solid var(--border-1);
                border-radius: var(--radius);
                color: var(--fg-1);
                font-size: 14px;
                box-sizing: border-box;
                cursor: pointer;
            }
            
            .timepicker-input:focus {
                outline: none;
                border-color: var(--fg-accent);
            }
            
            .clock-icon {
                position: absolute;
                right: var(--padding-3);
                top: 50%;
                transform: translateY(-50%);
                color: var(--fg-2);
                pointer-events: none;
                display: flex;
            }
            
            .time-selector {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                z-index: 100;
                background: var(--bg-1);
                border: 1px solid var(--fg-accent);
                border-radius: var(--radius);
                width: 280px;
                display: none;
                flex-direction: column;
                padding: var(--padding-4);
            }
            
            .time-selector-header {
                display: none;
                justify-content: center;
                margin-bottom: var(--padding-3);
                color: var(--fg-1);
                font-weight: 500;
            }
            
            .time-columns {
                display: flex;
                justify-content: center;
                align-items: stretch;
                height: 200px;
                perspective: 1000px;
            }
            
            .time-column {
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                flex: 1;
                overflow: hidden;
                color: var(--fg-1);
                border-radius: var(--radius);
                cursor: ns-resize;
                perspective: 800px;
                transform-style: preserve-3d;
            }
            
            .time-column-divider {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 15px;
                padding: 0 var(--padding-2);
                font-weight: 700;
                color: var(--fg-2);
            }
            
            .time-column-title {
                font-size: 12px;
                color: var(--fg-2);
                margin-bottom: var(--padding-2);
                text-align: center;
                display: none;
            }
            
            .time-column-items {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex: 1;
                width: 100%;
                overflow: hidden;
                transform-style: preserve-3d;
                transition: transform 0.2s ease;
            }
            
            .time-item {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                height: 40px;
                width: 100%;
                text-align: center;
                transition: transform 0.3s ease, opacity 0.3s ease;
                transform-style: preserve-3d;
                backface-visibility: hidden;
            }
            
            .time-item.current {
                transform: translateY(0) translateZ(40px);
                opacity: 1;
                font-weight: 600;
                font-size: 22px;
                color: var(--fg-accent);
            }
            
            .time-item.above {
                transform: translateY(-40px) translateZ(20px) rotateX(25deg);
                opacity: 0.8;
            }
            
            .time-item.below {
                transform: translateY(40px) translateZ(20px) rotateX(-25deg);
                opacity: 0.8;
            }
            
            .time-item.far-above {
                transform: translateY(-70px) translateZ(-10px) rotateX(45deg);
                opacity: 0.4;
                font-size: 16px;
            }
            
            .time-item.far-below {
                transform: translateY(70px) translateZ(-10px) rotateX(-45deg);
                opacity: 0.4;
                font-size: 16px;
            }
            
            .time-column:hover {
                background: var(--bg-2);
            }
            
            .time-column.bounce-up {
                animation: bounceUp 0.3s ease;
            }
            
            .time-column.bounce-down {
                animation: bounceDown 0.3s ease;
            }
            
            @keyframes bounceUp {
                0% { transform: translateY(0); }
                40% { transform: translateY(-8px); }
                70% { transform: translateY(4px); }
                100% { transform: translateY(0); }
            }
            
            @keyframes bounceDown {
                0% { transform: translateY(0); }
                40% { transform: translateY(8px); }
                70% { transform: translateY(-4px); }
                100% { transform: translateY(0); }
            }
            
            .select-line {
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 40px;
                transform: translateY(-50%);
                border-top: 1px solid var(--border-1);
                border-bottom: 1px solid var(--border-1);
                background-color: var(--bg-accent);
                opacity: 0.15;
                pointer-events: none;
                box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.1);
                border-radius: 3px;
            }
            
            .time-column::after {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                height: 40%;
                background: linear-gradient(to bottom, rgba(var(--bg-rgb-1), 0.9), rgba(var(--bg-rgb-1), 0));
                pointer-events: none;
                z-index: 2;
            }
            
            .time-column::before {
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 40%;
                background: linear-gradient(to top, rgba(var(--bg-rgb-1), 0.9), rgba(var(--bg-rgb-1), 0));
                pointer-events: none;
                z-index: 2;
            }
            
            .time-selector-footer {
                display: flex;
                justify-content: flex-end;
                margin-top: var(--padding-4);
            }
            
            .time-selector-done-btn {
                padding: var(--padding-w2);
                background: var(--bg-accent);
                color: var(--fg-accent);
                border: none;
                border-radius: var(--radius);
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                width: 100%;
            }
            
            .time-selector-done-btn:hover {
                opacity: 0.9;
            }
        </style>
        
        <div class="timepicker-container">
            <label class="timepicker-label" style="display: ${this._label ? 'block' : 'none'};">${this._label}</label>
            <div class="timepicker-input-wrapper">
                <input type="text" 
                       class="timepicker-input" 
                       placeholder="${this._placeholder}" 
                       readonly 
                       value="${this._inputValue}"
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
                <div class="time-selector-header">
                    Select Time
                </div>
                
                <div class="time-columns">
                    <div class="time-column hour-column">
                        <div class="time-column-title">Hour</div>
                        <div class="time-column-items">
                            <div class="select-line"></div>
                            <div class="time-item far-above"></div>
                            <div class="time-item above"></div>
                            <div class="time-item current"></div>
                            <div class="time-item below"></div>
                            <div class="time-item far-below"></div>
                        </div>
                    </div>
                    
                    <div class="time-column-divider">:</div>
                    
                    <div class="time-column minute-column">
                        <div class="time-column-title">Minute</div>
                        <div class="time-column-items">
                            <div class="select-line"></div>
                            <div class="time-item far-above"></div>
                            <div class="time-item above"></div>
                            <div class="time-item current"></div>
                            <div class="time-item below"></div>
                            <div class="time-item far-below"></div>
                        </div>
                    </div>
                    
                    ${
                        this._format === '12h'
                            ? `
                    <div class="time-column-divider"></div>
                    
                    <div class="time-column period-column">
                        <div class="time-column-title">Period</div>
                        <div class="time-column-items">
                            <div class="select-line"></div>
                            <div class="time-item far-above"></div>
                            <div class="time-item above"></div>
                            <div class="time-item current"></div>
                            <div class="time-item below"></div>
                            <div class="time-item far-below"></div>
                        </div>
                    </div>
                    `
                            : ''
                    }
                </div>
                
                <div class="time-selector-footer">
                    <button class="time-selector-done-btn" aria-label="Done">Done</button>
                </div>
            </div>
        </div>
        `;

        // Add event listener for the done button
        const doneButton = this.shadowRoot.querySelector('.time-selector-done-btn');
        if (doneButton) {
            doneButton.addEventListener('click', () => {
                this._closeTimeSelector();
            });
        }

        this._updateTimeSelectorDisplay();
    }
}

// Define the custom element
customElements.define('jalebi-timepicker', JalebiTimepicker);

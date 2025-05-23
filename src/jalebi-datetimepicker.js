class JalebiDatetimepicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default values
        this._selectedDateTime = null;
        this._currentMonth = new Date();
        this._hour = 12;
        this._minute = 0;
        this._second = 0;
        this._isPM = false;
        this._isOpen = false;
        this._format = 'yyyy-mm-dd hh:mm'; // Combined format
        this._timeFormat = '12h'; // '12h' or '24h'
        this._placeholder = 'Select date and time';
        this._label = '';
        this._showSeconds = false;
        this._viewMode = 'days'; // 'days', 'months', or 'years'

        // Bind methods
        this._handleInputClick = this._handleInputClick.bind(this);
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handlePrevMonthClick = this._handlePrevMonthClick.bind(this);
        this._handleNextMonthClick = this._handleNextMonthClick.bind(this);
        this._handleDateClick = this._handleDateClick.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleMonthYearClick = this._handleMonthYearClick.bind(this);
        this._handleMonthClick = this._handleMonthClick.bind(this);
        this._handleYearClick = this._handleYearClick.bind(this);
        this._handlePrevYearsClick = this._handlePrevYearsClick.bind(this);
        this._handleNextYearsClick = this._handleNextYearsClick.bind(this);
        this._handleInputChange = this._handleInputChange.bind(this);
        this._handlePeriodChange = this._handlePeriodChange.bind(this);
        this._handlePickerClick = this._handlePickerClick.bind(this);
    }

    static get observedAttributes() {
        return ['format', 'time-format', 'placeholder', 'value', 'label', 'show-seconds'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'format':
                this._format = newValue;
                break;
            case 'time-format':
                this._timeFormat = newValue;
                break;
            case 'placeholder':
                this._placeholder = newValue;
                break;
            case 'value':
                this._setDateTimeFromString(newValue);
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
        this._timeFormat = this.getAttribute('time-format') || this._timeFormat;
        this._placeholder = this.getAttribute('placeholder') || this._placeholder;
        this._label = this.getAttribute('label') || this._label;
        this._showSeconds = this.hasAttribute('show-seconds');

        if (this.getAttribute('value')) {
            this._setDateTimeFromString(this.getAttribute('value'));
        }

        this._render();
        this._attachEventListeners();
    }

    disconnectedCallback() {
        this._detachEventListeners();
    }

    _setDateTimeFromString(value) {
        if (!value) {
            this._selectedDateTime = null;
            this._hour = 12;
            this._minute = 0;
            this._second = 0;
            this._isPM = false;
            return;
        }

        // Parse date and time
        const dateTime = new Date(value);
        if (!isNaN(dateTime.getTime())) {
            this._selectedDateTime = dateTime;
            this._currentMonth = new Date(dateTime);
            this._hour = this._timeFormat === '12h' ? dateTime.getHours() % 12 || 12 : dateTime.getHours();
            this._minute = dateTime.getMinutes();
            this._second = dateTime.getSeconds();
            this._isPM = dateTime.getHours() >= 12;
        } else {
            // Try parsing date and time separately
            const parts = value.split(' ');
            const dateStr = parts[0];
            const timeStr = parts.slice(1).join(' ');

            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                this._selectedDateTime = date;
                this._currentMonth = new Date(date);
            }

            const timeRegex12h = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
            const timeRegex24h = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
            let match;

            if ((match = timeStr.match(timeRegex12h))) {
                let hour = parseInt(match[1], 10);
                const minute = parseInt(match[2], 10);
                const second = match[3] ? parseInt(match[3], 10) : 0;
                const period = match[4].toUpperCase();
                this._hour = hour === 0 ? 12 : hour > 12 ? hour % 12 : hour;
                this._minute = minute;
                this._second = second;
                this._isPM = period === 'PM';
            } else if ((match = timeStr.match(timeRegex24h))) {
                let hour = parseInt(match[1], 10);
                const minute = parseInt(match[2], 10);
                const second = match[3] ? parseInt(match[3], 10) : 0;
                const isPM = hour >= 12;
                hour = this._timeFormat === '12h' ? hour % 12 || 12 : hour;
                this._hour = hour;
                this._minute = minute;
                this._second = second;
                this._isPM = isPM;
            }
        }

        // Validate ranges
        this._hour = Math.max(this._timeFormat === '12h' ? 1 : 0, Math.min(this._timeFormat === '12h' ? 12 : 23, this._hour));
        this._minute = Math.max(0, Math.min(59, this._minute));
        this._second = Math.max(0, Math.min(59, this._second));
    }

    _attachEventListeners() {
        const input = this.shadowRoot.querySelector('.datetimepicker-input');
        input.addEventListener('click', this._handleInputClick);
        input.addEventListener('keydown', this._handleKeyDown);

        const picker = this.shadowRoot.querySelector('.datetimepicker-dropdown');
        if (picker) {
            picker.addEventListener('click', this._handlePickerClick);
        }

        const prevMonthBtn = this.shadowRoot.querySelector('.prev-month');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', this._handlePrevMonthClick);
        }

        const nextMonthBtn = this.shadowRoot.querySelector('.next-month');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', this._handleNextMonthClick);
        }

        const monthYearLabel = this.shadowRoot.querySelector('.current-month-year');
        if (monthYearLabel) {
            monthYearLabel.addEventListener('click', this._handleMonthYearClick);
        }

        const prevYearsBtn = this.shadowRoot.querySelector('.prev-years');
        if (prevYearsBtn) {
            prevYearsBtn.addEventListener('click', this._handlePrevYearsClick);
        }

        const nextYearsBtn = this.shadowRoot.querySelector('.next-years');
        if (nextYearsBtn) {
            nextYearsBtn.addEventListener('click', this._handleNextYearsClick);
        }

        const hourInput = this.shadowRoot.querySelector('.timepicker-hour');
        const minuteInput = this.shadowRoot.querySelector('.timepicker-minute');
        const secondInput = this.shadowRoot.querySelector('.timepicker-second');
        const periodSelect = this.shadowRoot.querySelector('.timepicker-period');

        if (hourInput) hourInput.addEventListener('change', this._handleInputChange);
        if (minuteInput) minuteInput.addEventListener('change', this._handleInputChange);
        if (secondInput) secondInput.addEventListener('change', this._handleInputChange);
        if (periodSelect) periodSelect.addEventListener('change', this._handlePeriodChange);

        document.addEventListener('click', this._handleDocumentClick);
    }

    _detachEventListeners() {
        document.removeEventListener('click', this._handleDocumentClick);
    }

    _handleInputClick(e) {
        e.stopPropagation();
        this._togglePicker();
    }

    _handlePickerClick(e) {
        e.stopPropagation();
    }

    _handleDocumentClick(e) {
        if (this._isOpen) {
            const inputWrapper = this.shadowRoot.querySelector('.datetimepicker-input-wrapper');
            const picker = this.shadowRoot.querySelector('.datetimepicker-dropdown');
            if (!inputWrapper.contains(e.target) && !picker.contains(e.target)) {
                this._closePicker();
            }
        }
    }

    _handlePrevMonthClick(e) {
        e.stopPropagation();
        this._currentMonth.setMonth(this._currentMonth.getMonth() - 1);
        this._updateCalendar();
    }

    _handleNextMonthClick(e) {
        e.stopPropagation();
        this._currentMonth.setMonth(this._currentMonth.getMonth() + 1);
        this._updateCalendar();
    }

    _handleMonthYearClick(e) {
        e.stopPropagation();
        if (this._viewMode === 'days') {
            this._viewMode = 'months';
        } else if (this._viewMode === 'months') {
            this._viewMode = 'years';
        }
        this._updateCalendar();
    }

    _handleMonthClick(e) {
        e.stopPropagation();
        const monthIndex = parseInt(e.target.dataset.month, 10);
        this._currentMonth.setMonth(monthIndex);
        this._viewMode = 'days';
        this._updateCalendar();
    }

    _handleYearClick(e) {
        e.stopPropagation();
        const year = parseInt(e.target.dataset.year, 10);
        this._currentMonth.setFullYear(year);
        this._viewMode = 'months';
        this._updateCalendar();
    }

    _handlePrevYearsClick(e) {
        e.stopPropagation();
        this._currentMonth.setFullYear(this._currentMonth.getFullYear() - 12);
        this._updateCalendar();
    }

    _handleNextYearsClick(e) {
        e.stopPropagation();
        this._currentMonth.setFullYear(this._currentMonth.getFullYear() + 12);
        this._updateCalendar();
    }

    _handleDateClick(e) {
        e.stopPropagation();
        const day = parseInt(e.target.textContent, 10);
        const newDate = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth(), day);
        if (this._selectedDateTime) {
            newDate.setHours(this._selectedDateTime.getHours(), this._selectedDateTime.getMinutes(), this._selectedDateTime.getSeconds());
        } else {
            newDate.setHours(this._getHour24(), this._minute, this._second);
        }
        this._selectedDateTime = newDate;
        this._updateUI();
        this._dispatchChangeEvent();
    }

    _handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._togglePicker();
        } else if (e.key === 'Escape' && this._isOpen) {
            this._closePicker();
        } else if (e.key === 'Tab' && this._isOpen) {
            this._closePicker();
        }
    }

    _handleInputChange(e) {
        const target = e.target;
        let value = parseInt(target.value, 10);

        if (target.classList.contains('timepicker-hour')) {
            const min = this._timeFormat === '12h' ? 1 : 0;
            const max = this._timeFormat === '12h' ? 12 : 23;
            this._hour = Math.max(min, Math.min(max, value));
            target.value = this._hour;
        } else if (target.classList.contains('timepicker-minute')) {
            this._minute = Math.max(0, Math.min(59, value));
            target.value = this._minute.toString().padStart(2, '0');
        } else if (target.classList.contains('timepicker-second')) {
            this._second = Math.max(0, Math.min(59, value));
            target.value = this._second.toString().padStart(2, '0');
        }

        if (this._selectedDateTime) {
            this._selectedDateTime.setHours(this._getHour24(), this._minute, this._second);
        }
        this._updateUI();
        this._dispatchChangeEvent();
    }

    _handlePeriodChange(e) {
        this._isPM = e.target.value === 'PM';
        if (this._selectedDateTime) {
            this._selectedDateTime.setHours(this._getHour24());
        }
        this._updateUI();
        this._dispatchChangeEvent();
    }

    _togglePicker() {
        if (this._isOpen) {
            this._closePicker();
        } else {
            this._openPicker();
        }
    }

    _openPicker() {
        if (!this._isOpen) {
            this._isOpen = true;
            this._viewMode = 'days';
            this._updateCalendar();
            const picker = this.shadowRoot.querySelector('.datetimepicker-dropdown');
            picker.style.display = 'block';
            this._updateTimeSelectorInputs();
        }
    }

    _closePicker() {
        if (this._isOpen) {
            this._isOpen = false;
            const picker = this.shadowRoot.querySelector('.datetimepicker-dropdown');
            picker.style.display = 'none';
        }
    }

    _updateUI() {
        const input = this.shadowRoot.querySelector('.datetimepicker-input');
        input.value = this._formatDateTimeForDisplay();
        input.setAttribute('aria-expanded', this._isOpen);
        this._updateCalendar();
        this._updateTimeSelectorInputs();
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

    _updateCalendar() {
        const calendarBody = this.shadowRoot.querySelector('.calendar-body');
        const monthYearHeader = this.shadowRoot.querySelector('.current-month-year');
        if (!calendarBody || !monthYearHeader) return;

        const prevBtn = this.shadowRoot.querySelector('.nav-btn:first-child');
        const nextBtn = this.shadowRoot.querySelector('.nav-btn:last-child');

        if (this._viewMode === 'years') {
            prevBtn.className = 'nav-btn prev-years';
            prevBtn.setAttribute('aria-label', 'Previous decade');
            nextBtn.className = 'nav-btn next-years';
            nextBtn.setAttribute('aria-label', 'Next decade');
        } else {
            prevBtn.className = 'nav-btn prev-month';
            prevBtn.setAttribute('aria-label', 'Previous month');
            nextBtn.className = 'nav-btn next-month';
            nextBtn.setAttribute('aria-label', 'Next month');
        }

        if (this._viewMode === 'years') {
            const currentYear = this._currentMonth.getFullYear();
            const startYear = currentYear - (currentYear % 12);
            monthYearHeader.textContent = `${startYear} - ${startYear + 11}`;
        } else {
            monthYearHeader.textContent = this._formatMonthYear(this._currentMonth);
        }

        calendarBody.innerHTML = '';

        if (this._viewMode === 'days') {
            this._renderDaysView(calendarBody);
        } else if (this._viewMode === 'months') {
            this._renderMonthsView(calendarBody);
        } else if (this._viewMode === 'years') {
            this._renderYearsView(calendarBody);
        }

        this._attachEventListeners();
    }

    _renderDaysView(calendarBody) {
        const days = this._generateCalendarDays(this._currentMonth);
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-row weekdays';
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'weekday';
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });
        calendarBody.appendChild(headerRow);

        let row = document.createElement('div');
        row.className = 'calendar-row';

        days.forEach((day, index) => {
            if (index > 0 && index % 7 === 0) {
                calendarBody.appendChild(row);
                row = document.createElement('div');
                row.className = 'calendar-row';
            }

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            if (day.empty) {
                dayElement.classList.add('empty');
            } else {
                dayElement.textContent = day.day;
                if (day.isToday) dayElement.classList.add('today');
                if (day.isSelected) dayElement.classList.add('selected');
                dayElement.addEventListener('click', this._handleDateClick);
            }
            row.appendChild(dayElement);
        });

        if (row.children.length > 0) {
            calendarBody.appendChild(row);
        }
    }

    _renderMonthsView(calendarBody) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonth = this._currentMonth.getMonth();

        for (let i = 0; i < 4; i++) {
            const row = document.createElement('div');
            row.className = 'calendar-row months-row';
            for (let j = 0; j < 3; j++) {
                const monthIndex = i * 3 + j;
                const monthElement = document.createElement('div');
                monthElement.className = 'month-item';
                monthElement.textContent = monthNames[monthIndex].substring(0, 3);
                monthElement.dataset.month = monthIndex;
                if (monthIndex === currentMonth) {
                    monthElement.classList.add('selected');
                }
                monthElement.addEventListener('click', this._handleMonthClick);
                row.appendChild(monthElement);
            }
            calendarBody.appendChild(row);
        }
    }

    _renderYearsView(calendarBody) {
        const currentYear = this._currentMonth.getFullYear();
        const startYear = currentYear - (currentYear % 12);
        const endYear = startYear + 12;

        let row;
        let cellCount = 0;

        for (let year = startYear; year < endYear; year++) {
            if (cellCount % 3 === 0) {
                row = document.createElement('div');
                row.className = 'calendar-row years-row';
                calendarBody.appendChild(row);
            }

            const yearElement = document.createElement('div');
            yearElement.className = 'year-item';
            yearElement.textContent = year;
            yearElement.dataset.year = year;
            if (year === currentYear) {
                yearElement.classList.add('selected');
            }
            yearElement.addEventListener('click', this._handleYearClick);
            row.appendChild(yearElement);
            cellCount++;
        }
    }

    _generateCalendarDays(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const days = [];

        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ empty: true });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);
            days.push({
                day,
                isToday: currentDate.getTime() === today.getTime(),
                isSelected:
                    this._selectedDateTime &&
                    currentDate.getTime() ===
                        new Date(this._selectedDateTime.getFullYear(), this._selectedDateTime.getMonth(), this._selectedDateTime.getDate()).getTime(),
                empty: false,
            });
        }

        return days;
    }

    _formatMonthYear(date) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }

    _getHour24() {
        if (this._timeFormat === '24h') return this._hour;
        return this._isPM ? (this._hour === 12 ? 12 : this._hour + 12) : this._hour === 12 ? 0 : this._hour;
    }

    _formatDateTimeForDisplay() {
        if (!this._selectedDateTime) {
            return '';
        }

        const year = this._selectedDateTime.getFullYear();
        const month = String(this._selectedDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(this._selectedDateTime.getDate()).padStart(2, '0');
        let hour = this._timeFormat === '12h' ? this._hour : this._getHour24();
        const minute = this._minute.toString().padStart(2, '0');
        const second = this._second.toString().padStart(2, '0');
        const period = this._isPM ? 'PM' : 'AM';

        let formatted = this._format;
        formatted = formatted.replace('yyyy', year);
        formatted = formatted.replace('mm', month);
        formatted = formatted.replace('dd', day);
        formatted = formatted.replace('hh', hour.toString().padStart(2, '0'));
        formatted = formatted.replace('mm', minute);
        if (this._showSeconds) {
            formatted = formatted.replace('ss', second);
        }
        if (this._timeFormat === '12h') {
            formatted += ` ${period}`;
        }

        return formatted;
    }

    _dispatchChangeEvent() {
        const value = this._formatDateTimeForDisplay();
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: {
                    date: this._selectedDateTime,
                    hour: this._timeFormat === '24h' ? this._getHour24() : this._hour,
                    minute: this._minute,
                    second: this._second,
                    period: this._isPM ? 'PM' : 'AM',
                    value: value,
                },
                bubbles: true,
            })
        );
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
            
            .datetimepicker-container {
                position: relative;
                width: 100%;
            }
            
            .datetimepicker-label {
                display: block;
                margin-bottom: var(--padding-2, 5px);
                color: var(--fg-1, #333);
                font-size: 14px;
            }
            
            .datetimepicker-input-wrapper {
                position: relative;
                width: 100%;
            }
            
            .datetimepicker-input {
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
            
            .datetimepicker-input:focus {
                outline: none;
                border-color: var(--fg-accent, #3498db);
            }
            
            .calendar-icon {
                position: absolute;
                right: var(--padding-3, 10px);
                top: 50%;
                transform: translateY(-50%);
                color: var(--fg-2, #666);
                pointer-events: none;
                display: flex;
            }
            
            .datetimepicker-dropdown {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                z-index: 100;
                background: var(--bg-1, #fff);
                border: 1px solid var(--fg-accent, #3498db);
                border-radius: var(--radius, 4px);
                width: 280px;
                display: none;
            }
            
            .calendar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--padding-3, 10px);
                border-bottom: 1px solid var(--border-1, #ccc);
            }
            
            .month-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
            }
            
            .nav-btn {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--fg-1, #333);
                padding: var(--padding-2, 5px);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius, 4px);
            }
            
            .nav-btn:hover {
                background: var(--bg-2, #f5f5f5);
            }
            
            .current-month-year {
                margin: 0 var(--padding-3, 10px);
                font-weight: 500;
                color: var(--fg-1, #333);
                cursor: pointer;
                padding: var(--padding-2, 5px);
                border-radius: var(--radius, 4px);
            }
            
            .current-month-year:hover {
                background: var(--bg-2, #f5f5f5);
            }
            
            .calendar-body {
                padding: var(--padding-3, 10px);
            }
            
            .calendar-row {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 2px;
            }
            
            .weekdays {
                margin-bottom: var(--padding-2, 5px);
            }
            
            .weekday {
                text-align: center;
                font-size: 12px;
                color: var(--fg-2, #666);
                padding: var(--padding-1, 4px) 0;
            }
            
            .calendar-day {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 32px;
                border-radius: var(--radius, 4px);
                font-size: 14px;
                cursor: pointer;
                color: var(--fg-1, #333);
            }
            
            .calendar-day:not(.empty):hover {
                background: var(--bg-2, #f5f5f5);
            }
            
            .calendar-day.empty {
                cursor: default;
            }
            
            .calendar-day.today {
                color: var(--fg-accent, #3498db);
                font-weight: 500;
            }
            
            .calendar-day.selected {
                background: var(--bg-accent, #3498db);
                color: var(--fg-accent);
                font-weight: 500;
            }
            
            .month-item, .year-item {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 50px;
                border-radius: var(--radius, 4px);
                font-size: 14px;
                cursor: pointer;
                color: var(--fg-1, #333);
            }
            
            .month-item:hover, .year-item:hover {
                background: var(--bg-2, #f5f5f5);
            }
            
            .month-item.selected, .year-item.selected {
                background: var(--bg-accent, #3498db);
                color: var(--fg-accent);
                font-weight: 500;
            }
            
            .months-row, .years-row {
                margin-bottom: var(--gap-2, 5px);
                grid-template-columns: repeat(3, 1fr);
            }
            
            .time-selector {
                padding: var(--padding-4, 15px);
                border-top: 1px solid var(--border-1, #ccc);
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
                padding: var(--padding-2, 5px);
                background: var(--bg-1, #fff);
                border: 1px solid var(--border-1, #ccc);
                border-radius: var(--radius, 4px);
                color: var(--fg-1, #333);
                font-size: 14px;
                text-align: center;
                width: 50px;
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
                padding: var(--padding-2, 5px);
                background: var(--bg-1, #fff);
                border: 1px solid var(--border-1, #ccc);
                border-radius: var(--radius, 4px);
                color: var(--fg-1, #333);
                font-size: 14px;
                margin-top: 18px;
            }
            
            input[type="number"]::-webkit-inner-spin-button,
            input[type="number"]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            
            input[type="number"] {
                -moz-appearance: textfield;
            }
        </style>
        
        <div class="datetimepicker-container">
            ${this._label ? `<label class="datetimepicker-label">${this._label}</label>` : ''}
            <div class="datetimepicker-input-wrapper">
                <input type="text" 
                       class="datetimepicker-input" 
                       placeholder="${this._placeholder}" 
                       readonly 
                       value="${this._formatDateTimeForDisplay()}"
                       aria-haspopup="true"
                       aria-expanded="${this._isOpen}"
                       aria-label="${this._label || 'Date and time picker'}">
                <span class="calendar-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </span>
            </div>
            
            <div class="datetimepicker-dropdown" role="dialog" aria-modal="true" aria-label="Date and time picker">
                <div class="calendar-header">
                    <div class="month-nav">
                        <button class="nav-btn ${this._viewMode === 'years' ? 'prev-years' : 'prev-month'}" 
                                aria-label="${this._viewMode === 'years' ? 'Previous decade' : 'Previous month'}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <span class="current-month-year" role="button" tabindex="0" aria-label="Select view"></span>
                        <button class="nav-btn ${this._viewMode === 'years' ? 'next-years' : 'next-month'}" 
                                aria-label="${this._viewMode === 'years' ? 'Next decade' : 'Next month'}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="calendar-body"></div>
                
                <div class="time-selector">
                    <div class="time-selector-inputs">
                        <div class="input-group">
                            <label class="input-label">H</label>
                            <input type="number" 
                                   class="timepicker-input-field timepicker-hour" 
                                   min="${this._timeFormat === '12h' ? 1 : 0}" 
                                   max="${this._timeFormat === '12h' ? 12 : 23}" 
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
                            this._timeFormat === '12h'
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
        </div>
        `;
    }
}

customElements.define('jalebi-datetimepicker', JalebiDatetimepicker);

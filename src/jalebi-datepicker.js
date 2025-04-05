class JalebiDatepicker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._selectedDate = null;
        this._currentMonth = new Date();
        this._isOpen = false;
        this._inputValue = '';
        this._format = 'yyyy-mm-dd';
        this._placeholder = 'Select date';
        this._label = '';
        this._viewMode = 'days'; // Can be 'days', 'months', or 'years'
        this._yearRange = 12; // Number of years to display in year selection (use 12 for better grid layout)

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
        this._handleCalendarClick = this._handleCalendarClick.bind(this);
    }

    static get observedAttributes() {
        return ['format', 'placeholder', 'value', 'label'];
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
                this._setDateFromString(newValue);
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

        if (this.getAttribute('value')) {
            this._setDateFromString(this.getAttribute('value'));
        }

        this._render();
        this._attachEventListeners();
    }

    disconnectedCallback() {
        this._detachEventListeners();
    }

    _setDateFromString(dateStr) {
        if (!dateStr) {
            this._selectedDate = null;
            this._inputValue = '';
            return;
        }

        // Try to parse the date from the string
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            this._selectedDate = date;
            this._currentMonth = new Date(date);
            this._inputValue = this._formatDate(date);
        }
    }

    _attachEventListeners() {
        const input = this.shadowRoot.querySelector('.datepicker-input');
        input.addEventListener('click', this._handleInputClick);
        input.addEventListener('keydown', this._handleKeyDown);

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

        const months = this.shadowRoot.querySelectorAll('.month-item');
        months.forEach(month => {
            month.addEventListener('click', this._handleMonthClick);
        });

        const years = this.shadowRoot.querySelectorAll('.year-item');
        years.forEach(year => {
            year.addEventListener('click', this._handleYearClick);
        });

        const dates = this.shadowRoot.querySelectorAll('.calendar-day');
        dates.forEach(dateEl => {
            if (!dateEl.classList.contains('empty') && !dateEl.classList.contains('disabled')) {
                dateEl.addEventListener('click', this._handleDateClick);
            }
        });

        // Add click handler for the calendar dropdown
        const calendarDropdown = this.shadowRoot.querySelector('.calendar-dropdown');
        if (calendarDropdown) {
            calendarDropdown.addEventListener('click', this._handleCalendarClick);
        }

        document.addEventListener('click', this._handleDocumentClick);
    }

    _detachEventListeners() {
        document.removeEventListener('click', this._handleDocumentClick);

        const calendarDropdown = this.shadowRoot.querySelector('.calendar-dropdown');
        if (calendarDropdown) {
            calendarDropdown.removeEventListener('click', this._handleCalendarClick);
        }
    }

    _handleInputClick(e) {
        e.stopPropagation();
        this._toggleCalendar();
    }

    _handleCalendarClick(e) {
        // Prevent clicks inside the calendar dropdown from propagating to document
        e.stopPropagation();
    }

    _handleDocumentClick(e) {
        // Only close if clicking outside both the dropdown and the input
        const inputWrapper = this.shadowRoot.querySelector('.datepicker-input-wrapper');
        const calendarDropdown = this.shadowRoot.querySelector('.calendar-dropdown');

        if (this._isOpen && !inputWrapper.contains(e.target) && !calendarDropdown.contains(e.target)) {
            this._closeCalendar();
        }
    }

    _handleMonthYearClick(e) {
        e.stopPropagation();
        if (this._viewMode === 'days') {
            this._viewMode = 'months';
        } else if (this._viewMode === 'months') {
            this._viewMode = 'years';
        } else {
            return; // Already in years view
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
        const currentYear = this._currentMonth.getFullYear();
        this._currentMonth.setFullYear(currentYear - this._yearRange);
        this._updateCalendar();
    }

    _handleNextYearsClick(e) {
        e.stopPropagation();
        const currentYear = this._currentMonth.getFullYear();
        this._currentMonth.setFullYear(currentYear + this._yearRange);
        this._updateCalendar();
    }

    _handlePrevMonthClick(e) {
        e.stopPropagation(); // Prevent closing the calendar
        this._currentMonth.setMonth(this._currentMonth.getMonth() - 1);
        this._updateCalendar();
    }

    _handleNextMonthClick(e) {
        e.stopPropagation(); // Prevent closing the calendar
        this._currentMonth.setMonth(this._currentMonth.getMonth() + 1);
        this._updateCalendar();
    }

    _handleDateClick(e) {
        const day = parseInt(e.target.textContent, 10);
        const newDate = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth(), day);

        this._selectedDate = newDate;
        this._inputValue = this._formatDate(newDate);
        this._updateUI();
        this._closeCalendar();

        // Dispatch change event
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: {
                    date: newDate,
                    value: this._inputValue,
                },
                bubbles: true,
            })
        );
    }

    _handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._toggleCalendar();
        } else if (e.key === 'Escape' && this._isOpen) {
            this._closeCalendar();
        } else if (e.key === 'Tab' && this._isOpen) {
            this._closeCalendar();
        }
    }

    _toggleCalendar() {
        if (this._isOpen) {
            this._closeCalendar();
        } else {
            this._openCalendar();
        }
    }

    _openCalendar() {
        if (!this._isOpen) {
            this._isOpen = true;
            this._viewMode = 'days'; // Reset to days view when opening
            this._updateCalendar();
            const calendar = this.shadowRoot.querySelector('.calendar-dropdown');
            calendar.style.display = 'block';
        }
    }

    _closeCalendar() {
        if (this._isOpen) {
            this._isOpen = false;
            const calendar = this.shadowRoot.querySelector('.calendar-dropdown');
            calendar.style.display = 'none';
        }
    }

    _updateUI() {
        const input = this.shadowRoot.querySelector('.datepicker-input');
        input.value = this._inputValue;

        this._updateCalendar();
    }

    _updateCalendar() {
        const calendarBody = this.shadowRoot.querySelector('.calendar-body');
        const monthYearHeader = this.shadowRoot.querySelector('.current-month-year');
        if (!calendarBody || !monthYearHeader) return;

        // Update navigation buttons based on view mode
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

        // Update header text
        if (this._viewMode === 'years') {
            const currentYear = this._currentMonth.getFullYear();
            const startYear = currentYear - (currentYear % this._yearRange);
            monthYearHeader.textContent = `${startYear} - ${startYear + this._yearRange - 1}`;
        } else {
            monthYearHeader.textContent = this._formatMonthYear(this._currentMonth);
        }

        // Clear existing calendar content
        calendarBody.innerHTML = '';

        // Display the appropriate view based on the current mode
        if (this._viewMode === 'days') {
            this._renderDaysView(calendarBody);
        } else if (this._viewMode === 'months') {
            this._renderMonthsView(calendarBody);
        } else if (this._viewMode === 'years') {
            this._renderYearsView(calendarBody);
        }

        // Re-attach event listeners for the new elements
        this._attachEventListeners();
    }

    _renderDaysView(calendarBody) {
        // Generate the grid of days
        const days = this._generateCalendarDays(this._currentMonth);

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Create the header row with weekday names
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-row weekdays';

        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'weekday';
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });

        calendarBody.appendChild(headerRow);

        // Create weekly rows
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

                if (day.isToday) {
                    dayElement.classList.add('today');
                }

                if (day.isSelected) {
                    dayElement.classList.add('selected');
                }

                dayElement.addEventListener('click', this._handleDateClick);
            }

            row.appendChild(dayElement);
        });

        // Append the last row
        if (row.children.length > 0) {
            calendarBody.appendChild(row);
        }
    }

    _renderMonthsView(calendarBody) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const currentYear = this._currentMonth.getFullYear();
        const currentMonth = this._currentMonth.getMonth();

        // Create grid of months (3x4)
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

                row.appendChild(monthElement);
            }

            calendarBody.appendChild(row);
        }
    }

    _renderYearsView(calendarBody) {
        const currentYear = this._currentMonth.getFullYear();
        const startYear = currentYear - (currentYear % this._yearRange);
        const endYear = startYear + this._yearRange;

        // Update the header to show the year range
        const monthYearHeader = this.shadowRoot.querySelector('.current-month-year');
        monthYearHeader.textContent = `${startYear} - ${endYear - 1}`;

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

            row.appendChild(yearElement);
            cellCount++;
        }
    }

    _generateCalendarDays(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Day of the week for the first day (0-6, where 0 is Sunday)
        const firstDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty slots for days before the first day of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ empty: true });
        }

        // Today's date for highlighting
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);

            days.push({
                day,
                isToday: currentDate.getTime() === today.getTime(),
                isSelected:
                    this._selectedDate &&
                    currentDate.getTime() ===
                        new Date(this._selectedDate.getFullYear(), this._selectedDate.getMonth(), this._selectedDate.getDate()).getTime(),
                empty: false,
            });
        }

        return days;
    }

    _formatMonthYear(date) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }

    _formatDate(date) {
        if (!date) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        let formatted = this._format;
        formatted = formatted.replace('yyyy', year);
        formatted = formatted.replace('mm', month);
        formatted = formatted.replace('dd', day);

        return formatted;
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
        
        .datepicker-container {
          position: relative;
          width: 100%;
        }
        
        .datepicker-label {
          display: block;
          margin-bottom: var(--padding-2);
          color: var(--fg-1);
          font-size: 14px;
        }
        
        .datepicker-input-wrapper {
          position: relative;
          width: 100%;
        }
        
        .datepicker-input {
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
        
        .datepicker-input:focus {
          outline: none;
          border-color: var(--fg-accent);
        }
        
        .calendar-icon {
          position: absolute;
          right: var(--padding-3);
          top: 50%;
          transform: translateY(-50%);
          color: var(--fg-2);
          pointer-events: none;
          display: flex;
        }
        
        .calendar-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          z-index: 100;
          background: var(--bg-1);
          border: 1px solid var(--fg-accent);
          border-radius: var(--radius);
          width: 280px;
          display: none;
        }
        
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--padding-3);
          border-bottom: 1px solid var(--border-1);
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
          color: var(--fg-1);
          padding: var(--padding-2);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
        }
        
        .nav-btn:hover {
          background: var(--bg-2);
        }
        
        .current-month-year {
          margin: 0 var(--padding-3);
          font-weight: 500;
          color: var(--fg-1);
          cursor: pointer;
          padding: var(--padding-2);
          border-radius: var(--radius);
        }
        
        .current-month-year:hover {
          background: var(--bg-2);
        }
        
        .calendar-body {
          padding: var(--padding-3);
        }
        
        .calendar-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 2px;
        }
        
        .weekdays {
          margin-bottom: var(--padding-2);
        }
        
        .weekday {
          text-align: center;
          font-size: 12px;
          color: var(--fg-2);
          padding: var(--padding-1) 0;
        }
        
        .calendar-day {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          border-radius: var(--radius);
          font-size: 14px;
          cursor: pointer;
          color: var(--fg-1);
        }
        
        .calendar-day:not(.empty):hover {
          background: var(--bg-2);
        }
        
        .calendar-day.empty {
          cursor: default;
        }
        
        .calendar-day.today {
          color: var(--fg-accent);
          font-weight: 500;
        }
        
        .calendar-day.selected {
          background: var(--bg-accent);
          color: var(--fg-accent);
          font-weight: 500;
        }
        
        .calendar-day.disabled {
          color: var(--fg-2);
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .month-item, .year-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 50px;
          border-radius: var(--radius);
          font-size: 14px;
          cursor: pointer;
          color: var(--fg-1);
        }
        
        .month-item:hover, .year-item:hover {
          background: var(--bg-2);
        }
        
        .month-item.selected, .year-item.selected {
          background: var(--bg-accent);
          color: var(--fg-accent);
          font-weight: 500;
        }
        
        .year-item.muted {
          color: var(--fg-2);
        }
        
        .months-row, .years-row {
          margin-bottom: var(--gap-2);
          grid-template-columns: repeat(3, 1fr);
        }
      </style>
      
      <div class="datepicker-container">
        <label class="datepicker-label" style="display: ${this._label ? 'block' : 'none'};" for="datepicker">${this._label}</label>
        <div class="datepicker-input-wrapper">
          <input type="text" 
                 class="datepicker-input" 
                 placeholder="${this._placeholder}" 
                 readonly 
                 value="${this._inputValue}"
                 aria-haspopup="true"
                 aria-expanded="${this._isOpen}"
                 aria-label="${this._label}">
          <span class="calendar-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
        </div>
        
        <div class="calendar-dropdown" role="dialog" aria-modal="true" aria-label="Date picker">
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
        </div>
      </div>
    `;

        this._updateCalendar();
    }
}

// Define the custom element
customElements.define('jalebi-datepicker', JalebiDatepicker);

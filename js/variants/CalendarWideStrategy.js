/**
 * Strategia dla wariantu calendar_wide.
 * Odpowiada za wszystkie aspekty wyświetlania i zachowania szerokiego kalendarza.
 */
export default class CalendarWideStrategy {
  constructor(datepicker) {
    this.datepicker = datepicker;
    this.initialized = false;
    this._handlers = {};
    this.eventData = this.datepicker.config.eventData || [];
  }

  initialize() {
    if (this.initialized) return;

    const pickerElement = this.datepicker.picker.element;
    if (!pickerElement) return;

    this._hideStandardCalendarElements(pickerElement);
    this._createCalendarStructure(pickerElement);
    this._loadSavedState();
    this._setupEventListeners();
    this.initialized = true;
  }

  _loadSavedState() {
    let yearToUse = new Date().getFullYear();
    let monthToUse = new Date().getMonth();

    try {
      const savedStateJson = sessionStorage.getItem("datepicker_state");
      if (savedStateJson) {
        const savedState = JSON.parse(savedStateJson);
        if (Date.now() - savedState.timestamp < 10000) {
          yearToUse = savedState.year;
          monthToUse = savedState.month;
        }
      }
    } catch (e) {
      console.error("Error loading calendar state:", e);
    }

    this._renderCalendar(monthToUse, yearToUse);
  }

  saveState() {
    const pickerElement = this.datepicker.picker.element;
    if (!pickerElement) return;

    const yearDisplay = pickerElement.querySelector(".year-display");
    const activeMonthCell = pickerElement.querySelector(".month-cell.active");

    if (!yearDisplay || !activeMonthCell) return;

    const state = {
      year: parseInt(yearDisplay.textContent, 10),
      month: parseInt(activeMonthCell.dataset.month, 10),
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem("datepicker_state", JSON.stringify(state));
    } catch (e) {
      console.error("Error saving calendar state:", e);
    }
  }

  _createCalendarStructure(container) {
    let datepickerMain =
      container.querySelector(".datepicker-main") ||
      container.querySelector(".datepicker-picker");
    if (!datepickerMain) return;

    datepickerMain.appendChild(this._createYearNavigation());
    datepickerMain.appendChild(this._createMonthsGrid());
    datepickerMain.appendChild(this._createDaysContainer());
  }

  _createYearNavigation() {
    const yearNavigation = document.createElement("div");
    yearNavigation.className =
      "flex items-center justify-between mb-2 year-navigation";

    const prevYearBtn = document.createElement("button");
    prevYearBtn.className =
      "bg-white dark:bg-gray-700 rounded-lg text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white text-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 prev-year-btn size-11 grid place-items-center";
    prevYearBtn.type = "button";
    prevYearBtn.innerHTML =
      '<svg class="w-4 h-4 rtl:rotate-180 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H1m0 0 4 4M1 5l4-4"></path></svg>';

    const yearDisplay = document.createElement("span");
    yearDisplay.className =
      "text-base font-medium text-gray-900 year-display dark:text-white";
    yearDisplay.textContent = new Date().getFullYear();

    const nextYearBtn = document.createElement("button");
    nextYearBtn.className =
      "bg-white dark:bg-gray-700 rounded-lg text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white text-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-gray-200 next-year-btn size-11 grid place-items-center";
    nextYearBtn.type = "button";
    nextYearBtn.innerHTML =
      '<svg class="size-4 rtl:rotate-180 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"></path></svg>';

    yearNavigation.appendChild(prevYearBtn);
    yearNavigation.appendChild(yearDisplay);
    yearNavigation.appendChild(nextYearBtn);

    return yearNavigation;
  }

  _createMonthsGrid() {
    const monthsGrid = document.createElement("div");
    monthsGrid.className =
      "grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12 months-grid";

    for (let i = 0; i < 12; i++) {
      const monthCell = document.createElement("button");
      monthCell.className =
        "p-2 font-medium text-center text-gray-900 transition-colors rounded-lg month-cell dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600";
      monthCell.type = "button";
      monthCell.setAttribute("data-month", i);
      monthCell.textContent = `Miesiąc ${i + 1}`;
      monthsGrid.appendChild(monthCell);
    }

    return monthsGrid;
  }

  _createDaysContainer() {
    const daysContainer = document.createElement("div");
    daysContainer.className =
      "w-full pt-8 mt-8 border-t border-gray-200 calendar-wide-days-container dark:border-gray-700";
    return daysContainer;
  }

  _refreshMonthNames() {
    const pickerElement = this.datepicker.picker.element;
    const monthsGrid = pickerElement.querySelector(".months-grid");
    if (!monthsGrid) return;

    const monthNames = this._getLocalizedMonthNames();
    const monthCells = monthsGrid.querySelectorAll(".month-cell");

    monthCells.forEach((cell, index) => {
      // Protect against missing month names
      cell.textContent = monthNames[index] || "";
      cell.setAttribute("data-month", index);
    });

    // Specify which month should be active
    const yearDisplay = pickerElement.querySelector(".year-display");
    const yearToShow = yearDisplay
      ? parseInt(yearDisplay.textContent, 10)
      : new Date().getFullYear();
    const currentDate = this.datepicker.getDate();

    // Specify the month to be highlighted
    let monthToHighlight;

    // If we have a date selected and its year matches the displayed year, highlight its month
    if (currentDate && currentDate.getFullYear() === yearToShow) {
      monthToHighlight = currentDate.getMonth();
    }
    // Otherwise use the currently displayed month
    else {
      monthToHighlight = this._getDisplayedMonth();
    }

    this._highlightMonth(monthCells, monthToHighlight);
  }

  _getLocalizedMonthNames() {
    const localeKey = this.datepicker.config.language || "en";
    const Datepicker = this.datepicker.constructor;

    if (Datepicker.locales && Datepicker.locales[localeKey]) {
      const locale = Datepicker.locales[localeKey];

      // We use abbreviated names where available
      if (locale.monthsShort && locale.monthsShort.length === 12) {
        return locale.monthsShort;
      }
      // Alternatively, we abbreviate the full names
      else if (locale.months && locale.months.length === 12) {
        return locale.months.map((month) => month.substring(0, 3));
      }
    }
  }

  _highlightMonth(monthCells, monthIndex) {
    const baseClasses =
      "p-2 font-medium text-center rounded-lg month-cell transition-colors";
    const activeClasses =
      "active bg-blue-700 !bg-primary-700 text-white dark:bg-blue-600 dark:!bg-primary-600 dark:text-white";
    const inactiveClasses =
      "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600";

    monthCells.forEach((cell, index) => {
      cell.className = baseClasses;

      if (index === monthIndex) {
        cell.className += ` ${activeClasses}`;
      } else {
        cell.className += ` ${inactiveClasses}`;
      }
    });
  }

  _clearMonthHighlight(monthCells) {
    const baseClasses =
      "p-2 font-medium text-center rounded-lg month-cell transition-colors";
    const inactiveClasses =
      "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600";

    monthCells.forEach((cell) => {
      cell.className = `${baseClasses} ${inactiveClasses}`;
    });
  }

  _getDisplayedMonth() {
    try {
      const savedStateJson = sessionStorage.getItem("datepicker_state");
      if (savedStateJson) {
        const savedState = JSON.parse(savedStateJson);
        if (Date.now() - savedState.timestamp < 1000) {
          // valid for one second
          return savedState.month;
        }
      }
    } catch (e) {
      console.error("Error reading month from session storage:", e);
    }

    const firstDayCell = this.datepicker.picker.element.querySelector(
      ".calendar-wide-day[data-date]"
    );
    if (firstDayCell) {
      const dateStr = firstDayCell.getAttribute("data-date");
      if (dateStr) {
        const dateParts = dateStr.split("-");
        if (dateParts.length === 3) {
          return parseInt(dateParts[1], 10) - 1; // Subtract 1, as months are indexed from 0
        }
      }
    }

    return new Date().getMonth();
  }

  _setupEventListeners() {
    const pickerElement = this.datepicker.picker.element;
    if (!pickerElement) return;

    this._setupMonthClickHandler(pickerElement);
    this._setupYearNavigationHandlers(pickerElement);
    this._setupDayClickHandler(pickerElement);
  }

  _setupMonthClickHandler(pickerElement) {
    const monthsGrid = pickerElement.querySelector(".months-grid");
    if (!monthsGrid) return;

    // Delete previous handler
    if (this._handlers.monthClick) {
      monthsGrid.removeEventListener("click", this._handlers.monthClick);
    }

    // Add a new handler
    this._handlers.monthClick = (e) => {
      const monthCell = e.target.closest(".month-cell");
      if (!monthCell) return;

      e.preventDefault();
      e.stopPropagation();

      const monthIndex = parseInt(monthCell.dataset.month, 10);
      if (isNaN(monthIndex)) return;

      const yearDisplay = pickerElement.querySelector(".year-display");
      const currentYear = yearDisplay
        ? parseInt(yearDisplay.textContent, 10)
        : new Date().getFullYear();

      // Update view
      this._renderDaysForSelectedMonth(monthIndex, currentYear);
      this._highlightMonth(
        monthsGrid.querySelectorAll(".month-cell"),
        monthIndex
      );
      this.saveState();
    };

    monthsGrid.addEventListener("click", this._handlers.monthClick);
  }

  _setupYearNavigationHandlers(pickerElement) {
    const prevYearBtn = pickerElement.querySelector(".prev-year-btn");
    const nextYearBtn = pickerElement.querySelector(".next-year-btn");
    const yearDisplay = pickerElement.querySelector(".year-display");
    const monthsGrid = pickerElement.querySelector(".months-grid");

    if (!prevYearBtn || !nextYearBtn || !yearDisplay || !monthsGrid) return;

    // Remove previous handlers
    if (this._handlers.prevYear) {
      prevYearBtn.removeEventListener("click", this._handlers.prevYear);
    }
    if (this._handlers.nextYear) {
      nextYearBtn.removeEventListener("click", this._handlers.nextYear);
    }

    // Handler for the previous year
    this._handlers.prevYear = () => {
      const currentYear = parseInt(yearDisplay.textContent, 10);
      const activeMonthCell = monthsGrid.querySelector(".month-cell.active");
      const monthIndex = activeMonthCell
        ? parseInt(activeMonthCell.dataset.month, 10)
        : new Date().getMonth();

      this._renderCalendar(monthIndex, currentYear - 1);
    };

    // Handler for the following year
    this._handlers.nextYear = () => {
      const currentYear = parseInt(yearDisplay.textContent, 10);
      const activeMonthCell = monthsGrid.querySelector(".month-cell.active");
      const monthIndex = activeMonthCell
        ? parseInt(activeMonthCell.dataset.month, 10)
        : new Date().getMonth();

      this._renderCalendar(monthIndex, currentYear + 1);
    };

    prevYearBtn.addEventListener("click", this._handlers.prevYear);
    nextYearBtn.addEventListener("click", this._handlers.nextYear);
  }

  _setupDayClickHandler(pickerElement) {
    const daysContainer = pickerElement.querySelector(
      ".calendar-wide-days-container"
    );
    if (!daysContainer) return;

    // Delete previous handler
    if (this._handlers.dayClick) {
      daysContainer.removeEventListener("click", this._handlers.dayClick);
    }

    // Add a new handler
    this._handlers.dayClick = (e) => {
      const dayCell = e.target.closest(
        ".calendar-wide-day[data-day]:not(.disabled)"
      );
      if (!dayCell) return;

      try {
        this.saveState();

        const dayValue = parseInt(dayCell.dataset.day, 10);
        const clickedDate = new Date(dayValue);

        if (isNaN(clickedDate.getTime())) {
          return;
        }

        // Check if this day is already selected
        const currentDate = this.datepicker.getDate();
        const isDateSelected =
          currentDate &&
          currentDate.getDate() === clickedDate.getDate() &&
          currentDate.getMonth() === clickedDate.getMonth() &&
          currentDate.getFullYear() === clickedDate.getFullYear();

        if (isDateSelected) {
          // Deselect the date
          this.datepicker.setDate({ clear: true });

          // Refresh the calendar
          this._refreshMonthNames();
          const yearDisplay = pickerElement.querySelector(".year-display");
          if (yearDisplay) {
            const year = parseInt(yearDisplay.textContent, 10);
            const monthIndex = this._getCurrentlyDisplayedMonth();
            if (monthIndex !== null) {
              this._renderDaysForSelectedMonth(monthIndex, year);
            }
          }
        } else {
          // Set a new date
          this.datepicker.setDate(clickedDate);

          // Refresh the calendar
            this._refreshMonthNames();
            this._renderDaysForSelectedMonth(
              clickedDate.getMonth(),
              clickedDate.getFullYear()
            );
        }
      } catch (err) {
        console.error("Błąd podczas obsługi kliknięcia kalendarza:", err);
      }
    };

    daysContainer.addEventListener("click", this._handlers.dayClick);
  }

  _renderCalendar(month, year) {
    const yearDisplay =
      this.datepicker.picker.element.querySelector(".year-display");
    if (yearDisplay) {
      yearDisplay.textContent = year.toString();
    }

    this._refreshMonthNames();
    this._renderDaysForSelectedMonth(month, year);
  }

  _hideStandardCalendarElements(pickerElement) {
    if (!pickerElement) return;

    // Hide standard calendar items
    pickerElement
      .querySelectorAll(".days, .days-of-week, .view-switch")
      .forEach((el) => {
        el.style.display = "none";
      });

    // Hide element with navigation months
    const viewSwitch = pickerElement.querySelector(".view-switch");
    if (viewSwitch && viewSwitch.parentElement) {
      viewSwitch.parentElement.style.display = "none";
    }

    // Clear the datepicker controls
    const datePickerControls = pickerElement.querySelector(
      ".datepicker-controls"
    );
    if (datePickerControls) {
      datePickerControls.style.display = "none";
    }
  }

  _renderDaysForSelectedMonth(month, year) {
    const pickerElement = this.datepicker.picker.element;
    const daysContainer = pickerElement.querySelector(
      ".calendar-wide-days-container"
    );
    if (!daysContainer) return;

    // Prepare data for the days view
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Calculate the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.).
    // We will adjust this to start the week from Monday (0 = Monday)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Conversion from 0=Sunday to 0=Monday

    // Get the currently selected date and today's date
    const today = new Date();
    const currentDate = this.datepicker.getDate();

    // Adding support for minDate and maxDate
    const minDate = this.datepicker.config.minDate
      ? new Date(this.datepicker.config.minDate)
      : null;
    const maxDate = this.datepicker.config.maxDate
      ? new Date(this.datepicker.config.maxDate)
      : null;

    // Get event data from the datepicker configuration
    const eventData = this.datepicker.config.eventData || [];

    const daysHTML = [];

    // Add blank cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysHTML.push(`<div class="calendar-wide-day empty md:hidden"></div>`);
    }

    // Rendering of the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayValue = date.getTime();
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      // Check the statuses of the day
      const isSelected = this._isDaySelected(date, currentDate);
      const isToday = this._isToday(date, today);
      const isDisabled = this._isDayDisabled(date, minDate, maxDate);

      let cellClass =
        "calendar-wide-day datepicker-cell flex flex-col items-center flex-1 border-0 cursor-pointer text-center font-medium text-base day";

      if (isDisabled) {
        cellClass += " disabled cursor-not-allowed";
      }
      if (isSelected) {
        cellClass += " selected";
      }
      if (isToday) {
        cellClass += " today";
      }

      let dayNumberClass =
        "day-number size-[2.625rem] leading-10 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-900 dark:text-white";

      if (isToday && !isSelected) {
        dayNumberClass +=
          " text-blue-700 !text-primary-700 dark:text-blue-600 dark:!text-primary-600";
      }

      if (isDisabled) {
        dayNumberClass += " text-gray-400 dark:text-gray-500";
        dayNumberClass = dayNumberClass.replace(
          "hover:bg-gray-100 dark:hover:bg-gray-600",
          ""
        );
        dayNumberClass = dayNumberClass.replace(
          "text-gray-900 dark:text-white",
          ""
        );
      }

      if (isSelected) {
        dayNumberClass +=
          " bg-blue-700 !bg-primary-700 text-white dark:bg-blue-600 dark:!bg-primary-600 dark:text-white";
        dayNumberClass = dayNumberClass.replace("text-gray-900", "");
        dayNumberClass = dayNumberClass.replace("hover:bg-gray-100", "");
        dayNumberClass = dayNumberClass.replace("dark:text-white", "");
        dayNumberClass = dayNumberClass.replace("dark:hover:bg-gray-600", "");
      }

      let eventsHTML =
        '<span class="day-events opacity-60 gap-0.5 flex flex-row justify-center items-end h-2.5">';

      if (eventData && eventData.length > 0) {
        // Filter events for the current day - using dateStr as key
        const dayEvents = eventData.filter((event) => {
          // Check the different date formats that can be used
          return (
            event.date === dateStr || // format yyyy-mm-dd
            event.date === dayValue || // timestamp
            event.date === dayValue.toString() // timestamp as string
          );
        });

        // Create a unique list of colors (maximum 5)
        const uniqueColors = new Set();
        dayEvents.forEach((event) => {
          if (uniqueColors.size < 5) {
            uniqueColors.add(event.color);
          }
        });

        // Generate HTML for event tags
        if (uniqueColors.size > 0) {
          Array.from(uniqueColors).forEach((color) => {
            eventsHTML += `<span class="w-1.5 h-1.5 rounded-3xl bg-${color}-800 dark:bg-${color}-600"></span>`;
          });
        }
      }

      eventsHTML += "</span>";

      daysHTML.push(`<div
    class="${cellClass}"
    data-date="${dateStr}"
    data-day="${dayValue}"
    ${isDisabled ? "disabled" : 'role="button"'}>
    <span class="${dayNumberClass}">${day}</span>
    ${eventsHTML}
  </div>`);
    }

    // We specify the number of columns in the grid
    const gridCols = window.innerWidth >= 768 ? 16 : 7; // 16 columns on larger screens, 7 on smaller screens

    // We calculate how many additional empty cells we need at the end
    const totalCellsDisplayed = firstDayOfWeek + daysInMonth;
    const remainingCells =
      Math.ceil(totalCellsDisplayed / gridCols) * gridCols -
      totalCellsDisplayed;

    // Add empty cells at the end to fill the grid
    for (let i = 0; i < remainingCells; i++) {
      daysHTML.push(`<div class="calendar-wide-day empty"></div>`);
    }

    daysContainer.innerHTML = `<div class="calendar-wide-days grid gap-y-3 grid-cols-[repeat(7,1fr)] md:grid-cols-[repeat(16,1fr)]">${daysHTML.join(
      ""
    )}</div>`;
  }

  _isDaySelected(date, currentDate) {
    return (
      currentDate instanceof Date &&
      !isNaN(currentDate.getTime()) &&
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  }

  _isToday(date, today) {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  _isDayDisabled(date, minDate, maxDate) {
    return (minDate && date < minDate) || (maxDate && date > maxDate);
  }

  _getDayCellClasses(isToday, isSelected, isDisabled) {
    let cellClass =
      "datepicker-cell flex flex-col items-center flex-1 border-0 cursor-pointer text-center font-medium text-base day";

    if (isToday) cellClass += " today";
    if (isSelected) cellClass += " selected";
    if (isDisabled) {
      cellClass += " disabled cursor-not-allowed";
      cellClass = cellClass.replace("cursor-pointer", "");
    }

    return cellClass;
  }

  _getCurrentlyDisplayedMonth() {
    // Check the active month in the interface
    const activeMonthCell =
      this.datepicker.picker.element.querySelector(".month-cell.active");
    if (activeMonthCell) {
      return parseInt(activeMonthCell.dataset.month, 10);
    }

    // As a last resort, use the current month
    return new Date().getMonth();
  }
}

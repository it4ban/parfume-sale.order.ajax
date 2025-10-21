// SERVICES
function handleCalendarButton(e, calendarNode) {
	e.preventDefault();
	e.stopPropagation();

	const btn = e.currentTarget;
	const isOpen = calendarNode.classList.contains('is-open');

	if (isOpen) {
		calendarNode.classList.remove('is-open');
		btn.classList.remove('is-active');
	} else {
		calendarNode.classList.add('is-open');
		btn.classList.add('is-active');
	}
}

function calcDiffDays(date) {
	const firstDate = document.querySelector('.order__accordion-form-day-label strong');
	if (!firstDate) {
		console.error('firstDate is not found');
		return;
	}

	const currentDay = parseInt(firstDate.textContent.trim(), 10);
	const selectedDay = date.getDate();

	console.log('Текущий день:', currentDay);
	console.log('Выбранный день:', selectedDay);

	return selectedDay - currentDay;
}

async function handleSelectDataClick(date, button) {
	if (button && button.tagName === 'BUTTON') {
		button.type = 'button';
	}

	const dayDiff = calcDiffDays(date);
	const selectedDay = date.getDate();

	if (dayDiff >= 6 || dayDiff < 0) {
		try {
			const tileDays = document.querySelector('.order__accordion-form-day');
			const isoDate = new Date(date).toISOString().split('T')[0];

			const response = await fetch(`/ajax/get_delivery_days.php?date=${isoDate}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Error receiving data');
			}

			const html = await response.text();

			if (tileDays) {
				const oldDays = tileDays.querySelectorAll('.order__accordion-form-day-label');
				oldDays.forEach((day) => day.remove());
				tileDays.insertAdjacentHTML('afterbegin', html);

				handleInitTiles(this);
				handleInitInputPoints();
			} else {
				console.error('tileDays not found');
			}
		} catch (err) {
			console.error('Error receiving data:', err);
		}
	}

	setActiveTile(selectedDay);
	setOrderDate(date);
	toggleTimeBlocksByDay(date);
}

function setOrderDate(date) {
	const dateInput = document.getElementById('ms_date_putn');
	if (dateInput) {
		const formattedDate = date.toLocaleDateString('ru-RU');
		dateInput.value = formattedDate;
		dateInput.dataset.date = formattedDate;
	} else {
		console.error('DateInput is not found');
	}
}

function setActiveTile(selectedDay) {
	const dayLabels = document.querySelectorAll('.order__accordion-form-day-label');
	if (!dayLabels) {
		console.error('dayLabels is not found');
		return;
	}

	dayLabels.forEach((label) => {
		const strong = label.querySelector('strong');
		if (!strong) return;

		const dayNum = parseInt(strong.textContent.trim(), 10);

		if (dayNum === selectedDay) {
			label.classList.add('is-active');
		} else {
			label.classList.remove('is-active');
		}
	});
}

function handleTileClick(tileNode) {
	const currentDate = this.getSelectedDate();
	if (!currentDate) {
		console.error('Failed to get current calendar date');
		return;
	}

	const numberNode = tileNode.querySelector('strong');
	const number = parseInt(numberNode.textContent.trim(), 10);

	if (isNaN(number)) {
		console.error('Incorrect day value:', numberNode?.textContent);
		return;
	}

	const newDate = new Date(currentDate);
	newDate.setDate(number);

	this.setSelectedDate(newDate);
	setOrderDate(newDate);
	toggleTimeBlocksByDay(newDate);
}

function initEventsDate() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const startOfTime = new Date(today);
	startOfTime.setFullYear(today.getFullYear() - 1);

	return [
		{
			start: startOfTime.toISOString().split('T')[0],
			end: today.toISOString().split('T')[0],
			color: '#1E292F',
		},
	];
}

function handleTimeClick(label) {
	const timeNode = label.querySelector('p');
	if (!timeNode) {
		console.error('Time label <p> not found');
		return;
	}

	// Разделяем текст на min и max
	const timeText = timeNode.textContent.trim();
	const [minTime, maxTime] = timeText.split('-').map((s) => s.trim());

	if (!minTime || !maxTime) {
		console.error('Incorrect time format:', timeText);
		return;
	}

	const selectMin = document.getElementById('ms_time_min');
	const selectMax = document.getElementById('ms_time_max');

	if (selectMin) selectMin.value = minTime;
	if (selectMax) selectMax.value = maxTime;
}

function handleDisableBlock(block) {
	const labels = block.querySelectorAll('.order__accordion-form-time-label');
	labels.forEach((label) => {
		label.classList.add('disabled');
		label.setAttribute('disabled', 'disabled');
	});
	block.classList.add('is-disabled');
}

function handleEnableBlock(block) {
	const labels = block.querySelectorAll('.order__accordion-form-time-label');
	labels.forEach((label) => {
		label.classList.remove('disabled');
		label.removeAttribute('disabled');
	});
	block.classList.remove('is-disabled');
}

function toggleTimeBlocksByDay(date) {
	const dayOfWeek = date.getDay();
	const weakBlock = document.querySelector('.order__accordion-form-time--weak');
	const weakendBlock = document.querySelector('.order__accordion-form-time--weakend');

	if (!weakBlock || !weakendBlock) return;

	let activeBlock;
	if (dayOfWeek === 0 || dayOfWeek === 6) {
		handleDisableBlock(weakBlock);
		handleEnableBlock(weakendBlock);
		activeBlock = weakendBlock;
	} else {
		handleEnableBlock(weakBlock);
		handleDisableBlock(weakendBlock);
		activeBlock = weakBlock;
	}

	const today = new Date();
	if (date.toDateString() === today.toDateString()) {
		const nowHours = today.getHours();
		const nowMinutes = today.getMinutes();
		const nowTotalMinutes = nowHours * 60 + nowMinutes;

		const timeLabels = activeBlock.querySelectorAll('.order__accordion-form-time-label');

		timeLabels.forEach((label) => {
			const text = label.textContent.trim(); // "09:00 - 13:00"
			const [start, end] = text.split('-').map((s) => s.trim());
			if (!start || !end) return;

			const [endH, endM] = end.split(':').map(Number);

			const endTotal = endH * 60 + endM;

			if (nowTotalMinutes >= endTotal) {
				label.classList.add('disabled');
				label.setAttribute('disabled', 'disabled');
			} else {
				label.classList.remove('disabled');
				label.removeAttribute('disabled');
			}
		});
	}
}

// *********************************

// INIT FUNCTION

function handleInitCalendar() {
	try {
		const calendarBtn = document.querySelector('.order__accordion-form-day-button');
		const calendarNode = document.getElementById('calendar');

		const eventsData = initEventsDate();

		const calendar = new Calendar({
			container: () => calendarNode,
			calendarSize: 'small',
			dropShadow: '',
			border: '1px solid #000',
			customWeekdayValues: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
			customMonthValues: [
				'Январь',
				'Февраль',
				'Март',
				'Апрель',
				'Май',
				'Июнь',
				'Июль',
				'Август',
				'Сентябрь',
				'Октябрь',
				'Ноябрь',
				'Декабрь',
			],
			fontFamilyHeader: 'Evolventa',
			fontFamilyWeekdays: 'Evolventa',
			fontFamilyBody: 'Evolventa',
			eventsData,

			onSelectedDateClick: (date, button) => handleSelectDataClick.call(calendar, date, button),
			onMonthChange: () => {
				const buttons = calendarNode.querySelectorAll('button');
				buttons.forEach((btn) => (btn.type = 'button'));
			},
		});

		calendarBtn.addEventListener('click', (e) => handleCalendarButton(e, calendarNode));

		return calendar;
	} catch (err) {
		throw new Error(err);
	}
}

function handleInitTiles(calendar) {
	if (!calendar) {
		console.error('calendarInstance is not defined');
	}

	const dateTiles = document.querySelectorAll('.order__accordion-form-day-label');
	dateTiles.forEach((tile) => {
		tile.addEventListener('click', () => handleTileClick.call(calendar, tile));
	});
}

function handleInitTimeTiles(calendar) {
	const timeLabels = document.querySelectorAll('.order__accordion-form-time-label');
	timeLabels.forEach((label) => {
		label.addEventListener('click', () => handleTimeClick(label));
	});
}

function handleInitAddressSuggestions() {
	const token = '72a2cc8f7ce97a6d1acbf5c572a5bfd49d857e07';

	const fields = [
		{
			id: 'soa-property-38',
			type: 'address',
			full: true,
			ulClass: 'suggestions-list',
		},
		{
			id: 'soa-property-115',
			type: 'address',
			full: false,
			ulClass: 'suggestions-list',
		},
	];

	fields.forEach((field) => {
		const input = document.getElementById(field.id);
		if (!input) return;

		let container = input.parentNode.querySelector(`.${field.ulClass}`);
		if (!container) {
			container = document.createElement('ul');
			container.className = field.ulClass;
			input.parentNode.appendChild(container);
		}

		input.addEventListener('input', async () => {
			const query = input.value.trim();
			if (!query) {
				container.innerHTML = '';
				container.style.display = 'none';
				return;
			}

			let fullQuery = query;
			if (field.id === 'street') {
				const cityInput = document.getElementById('soa-property-38');
				const cityValue = cityInput ? cityInput.value.trim() : '';
				if (cityValue) {
					fullQuery = `${cityValue}, ${query}`;
				}
			}

			try {
				const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Token ' + token,
					},
					body: JSON.stringify({
						query: fullQuery,
						count: 5,
					}),
				});

				const data = await response.json();
				container.innerHTML = '';

				data.suggestions.forEach((suggestion) => {
					let suggestionText;
					if (field.full) {
						suggestionText = suggestion.value;
					} else {
						const city = suggestion.data.city_with_type || suggestion.data.settlement_with_type || '';
						const street = suggestion.data.street_with_type || '';
						const house = suggestion.data.house ? `, ${suggestion.data.house}` : '';
						suggestionText = `${city} ${street}${house}`.trim();
					}

					const li = document.createElement('li');
					li.textContent = suggestionText;
					li.dataset.suggestion = JSON.stringify(suggestion);
					container.appendChild(li);
				});

				container.style.display = data.suggestions.length ? 'block' : 'none';
			} catch (err) {
				console.error(err);
			}
		});

		container.addEventListener('click', (event) => {
			if (event.target.tagName !== 'LI') return;
			const suggestion = JSON.parse(event.target.dataset.suggestion);

			const populatedAreaInput = document.getElementById('soa-property-38');
			const streetInput = document.getElementById('soa-property-115');
			const flatInput = document.getElementById('soa-property-118');

			if (populatedAreaInput) {
				populatedAreaInput.value = suggestion.value || '';
			}

			if (streetInput) {
				const streetValue = `${suggestion.data.street_with_type || ''} ${suggestion.data.house || ''}`.trim();
				streetInput.value = streetValue;
			}

			if (flatInput) {
				flatInput.value = suggestion.data.flat || '';
			}

			container.innerHTML = '';
			container.style.display = 'none';
		});

		document.addEventListener('click', (e) => {
			if (!input.contains(e.target) && !container.contains(e.target)) {
				container.innerHTML = '';
				container.style.display = 'none';
			}
		});
	});
}

function handleInitInputPoints() {
	const inputs = document.querySelectorAll('input');
	const textArea = document.querySelectorAll('textarea');
	if (!inputs) return;

	inputs.forEach((element) => {
		element.onfocus = () => {
			element.parentElement.classList.add('is-focus');
		};
		element.onblur = () => {
			element.parentElement.classList.remove('is-focus');
		};
	});

	if (!textArea) return;

	textArea.forEach((element) => {
		element.onfocus = () => {
			element.parentElement.classList.add('is-focus');
		};

		element.onblur = () => {
			setTimeout(() => {
				element.parentElement.classList.remove('is-focus');
			}, 2000);
		};
	});

	if (document.querySelector('.order__accordion-delivery-label')) {
		const orderLabel = document.querySelectorAll('.order__accordion-delivery-label');

		orderLabel.forEach((label) => {
			label.addEventListener('click', () => {
				orderLabel.forEach((lb) => {
					lb.classList.remove('is-active');
				});

				label.classList.add('is-active');
			});
		});
	}

	if (document.querySelector('.order__accordion-form-day-label')) {
		const orderLabel = document.querySelectorAll('.order__accordion-form-day-label');

		orderLabel.forEach((label) => {
			label.addEventListener('click', () => {
				orderLabel.forEach((lb) => {
					lb.classList.remove('is-active');
				});

				label.classList.add('is-active');
			});
		});
	}

	if (document.querySelector('.order__accordion-form-time-label')) {
		const orderLabel = document.querySelectorAll('.order__accordion-form-time-label');

		orderLabel.forEach((label) => {
			label.addEventListener('click', () => {
				orderLabel.forEach((lb) => {
					lb.classList.remove('is-active');
				});

				label.classList.add('is-active');
			});
		});
	}

	if (document.querySelector('.order__pay-slide')) {
		const orderLabel = document.querySelectorAll('.order__pay-slide');

		orderLabel.forEach((label) => {
			label.addEventListener('click', () => {
				orderLabel.forEach((lb) => {
					lb.classList.remove('is-active');
				});

				label.classList.add('is-active');
			});
		});
	}
}

// *********************************

function handleInit() {
	const calendarInstance = handleInitCalendar();

	handleInitInputPoints();
	handleInitTiles(calendarInstance);
	handleInitTimeTiles(calendarInstance);
	handleInitAddressSuggestions();
}

document.addEventListener('DOMContentLoaded', () => {
	handleInit();
});

BX.addCustomEvent('onAjaxSuccess', () => {
	handleInit();
});

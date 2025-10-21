class YandexMap {
	constructor({ location, apiKey }) {
		this.map = undefined;
		this.marker = undefined;
		this.locationCoords = undefined;
		this.locationString = undefined;
		this.apiKey = apiKey;

		this.#convertStringToCords(location)
			.then((coords) => {
				this.locationCoords = coords;
				this.#initMap();
			})
			.catch((e) => console.error(e));
	}

	async #initMap() {
		await ymaps3.ready;
		const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener } = ymaps3;

		this.map = new YMap(
			document.querySelector('#courierMap'),
			{
				location: {
					center: this.locationCoords,
					zoom: 10,
				},
			},
			[new YMapDefaultSchemeLayer({}), new YMapDefaultFeaturesLayer({})],
		);

		this.marker = new YMapMarker(
			{
				coordinates: this.locationCoords,
			},
			this.#createMarker(),
		);
		this.map.addChild(this.marker);

		// Слушаем клики по карте
		const listener = new YMapListener({
			onClick: (obj, event) => this.#handleMapClick(obj, event),
		});
		this.map.addChild(listener);
	}

	#handleMapClick(obj, event) {
		const coords = event.coordinates; // географические координаты клика
		if (!coords) return;

		this.#clearMarker();
		this.#addMarker(coords);

		this.#convertCoordsToString(coords)
			.then((coordString) => {
				this.locationString = coordString;
				console.log(this.locationString);
			})
			.catch((e) => console.error(e));
	}

	#clearMarker() {
		if (this.marker) {
			this.map.removeChild(this.marker);
			this.marker = undefined;
		}
	}

	#addMarker(coords) {
		this.marker = new ymaps3.YMapMarker(
			{
				coordinates: coords,
			},
			this.#createMarker(),
		);

		this.map.addChild(this.marker);
	}

	#createMarker() {
		const markerEl = document.createElement('div');
		markerEl.style.width = '20px';
		markerEl.style.height = '20px';
		markerEl.style.background = 'red';
		markerEl.style.borderRadius = '50%';
		markerEl.style.transform = 'translate(-50%, -50%)';
		markerEl.style.border = '2px solid white';
		return markerEl;
	}

	async #convertStringToCords(location) {
		try {
			const geoResponse = await fetch(
				`https://geocode-maps.yandex.ru/v1/?apikey=${this.apiKey}&geocode=${encodeURIComponent(location)}&format=json`,
			).then((res) => res.json());

			const coordsStr = geoResponse?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
			if (!coordsStr) return [37.62, 55.75];
			return coordsStr.split(' ').map(Number);
		} catch (error) {
			console.error(error);
			return [37.62, 55.75];
		}
	}

	async #convertCoordsToString(coords) {
		try {
			const query = `${coords[0]},${coords[1]}`;

			// const geoResponse = await fetch(
			// 	`https://geocode-maps.yandex.ru/v1/?apikey=${this.apiKey}&geocode=${query}&format=json`,
			// ).then((res) => res.json());

			// const geoObject = geoResponse?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

			// if (!geoObject) return null;

			// const fullAddress = geoObject.metaDataProperty.GeocoderMetaData.text;

			// const components = geoObject.metaDataProperty.GeocoderMetaData.Address.Components;

			// const city = components.find((c) => c.kind === 'locality')?.name || null;
			// const street = components.find((c) => c.kind === 'street')?.name || null;
			// const house = components.find((c) => c.kind === 'house')?.name || null;

			return {};

			// return {
			// 	city,
			// 	fullAddress,
			// 	streetAndHouse: [street, house].filter(Boolean).join(', '),
			// };
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}

// ===============================
// Где Бензовоз
// Часть 1
// ===============================

// Координаты Челябинска
const CHELYABINSK = [55.1644, 61.4368];

// Создаем карту
const map = L.map('map', {
    zoomControl: true
}).setView(CHELYABINSK, 12);

// Карта OpenStreetMap
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap'
    }
).addTo(map);

// Элементы страницы
const loading = document.getElementById("loading");
const card = document.getElementById("stationInfo");

const stationName = document.getElementById("stationName");
const stationAddress = document.getElementById("stationAddress");
const stationHours = document.getElementById("stationHours");

const closeCard = document.getElementById("closeCard");

// Закрытие карточки
closeCard.onclick = () => {
    card.classList.add("hidden");
};

// Слой для АЗС
const gasStations = L.layerGroup().addTo(map);

// Запрос к Overpass API
const overpassQuery = `
[out:json][timeout:25];

(
node["amenity"="fuel"](54.95,61.15,55.38,61.72);
way["amenity"="fuel"](54.95,61.15,55.38,61.72);
relation["amenity"="fuel"](54.95,61.15,55.38,61.72);
);

out center tags;
`;

// Функция загрузки АЗС
async function loadStations() {
    try {
        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    data: overpassQuery
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        loading.style.display = "none";

        gasStations.clearLayers();

        data.elements.forEach(addStation);

    } catch (e) {
        loading.innerHTML = `
            <h2>Не удалось загрузить АЗС</h2>
            <p>Проверь интернет или попробуй обновить страницу.</p>
            <p>${e.message}</p>
        `;

        console.error("Ошибка Overpass:", e);
    }
}
// ===============================
// Часть 2
// ===============================

// Добавление одной АЗС на карту
function addStation(item) {

    let lat;
    let lon;

    if (item.type === "node") {
        lat = item.lat;
        lon = item.lon;
    } else {
        if (!item.center) return;
        lat = item.center.lat;
        lon = item.center.lon;
    }

    const tags = item.tags || {};

    const name =
        tags.name ||
        tags.brand ||
        "АЗС";

    // Собираем адрес
    const address = [
        tags["addr:street"],
        tags["addr:housenumber"]
    ]
    .filter(Boolean)
    .join(", ") || "Адрес неизвестен";

    const hours =
        tags.opening_hours ||
        "Время работы неизвестно";

    // Маркер
    const marker = L.marker([lat, lon]);

    marker.addTo(gasStations);

    // Маленькое всплывающее окно
    marker.bindPopup(`
        <b>⛽ ${name}</b><br>
        ${address}
    `);

    // Большая карточка справа
    marker.on("click", () => {

        stationName.textContent = "⛽ " + name;

        stationAddress.textContent =
            "📍 " + address;

        stationHours.textContent =
            "🕒 " + hours;

        card.classList.remove("hidden");

    });

}
// ===============================
// Часть 3
// ===============================

// После загрузки всех АЗС подгоняем масштаб карты
function fitMapToStations() {

    const layers = gasStations.getLayers();

    if (layers.length === 0) {
        return;
    }

    const group = L.featureGroup(layers);

    map.fitBounds(group.getBounds(), {
        padding: [40, 40]
    });

}

// Загружаем АЗС
loadStations().then(() => {

    setTimeout(() => {
        fitMapToStations();
    }, 500);

});

// Обновление данных каждые 5 минут
setInterval(async () => {

    gasStations.clearLayers();

    await loadStations();

    fitMapToStations();

}, 300000);

// Закрытие карточки по клавише Esc
document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        card.classList.add("hidden");
    }

});

// Закрытие карточки по клику на карту
map.on("click", () => {

    card.classList.add("hidden");

});
// ===============================
// Часть 4
// ===============================

// Если карта загрузилась без АЗС,
// возвращаемся в центр Челябинска

setTimeout(() => {

    if (gasStations.getLayers().length === 0) {

        map.setView([55.1644, 61.4368], 12);

    }

}, 4000);

// Информация в консоли
console.log("Где Бензовоз запущен");

// Скрываем карточку при старте
card.classList.add("hidden");

// Двойной клик увеличивает карту
map.doubleClickZoom.enable();

// Анимация карты
map.options.zoomAnimation = true;

// Включаем плавность
map.options.fadeAnimation = true;

map.options.markerZoomAnimation = true;

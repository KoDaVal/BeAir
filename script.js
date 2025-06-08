// Paso 1: Configuración
const API_KEY_OPENWEATHER = '16aee657388cba6f70ee7a9b59fb5fc6'; // ¡TU CLAVE DE OPENWEATHERMAP INSERTADA AQUÍ!

// Elementos del clima principal
const cityNameElement = document.querySelector('.city-name');
const tempValueElement = document.querySelector('.temp-value');
const tempUnitElement = document.querySelector('.temp-unit');
const weatherConditionElement = document.querySelector('.weather-condition');
const humidityLowTempElement = document.querySelector('.humidity-low-temp');

// Referencias para CALIDAD DEL AIRE Y CONTAMINANTES
const airQualityStatusElement = document.querySelector('.air-quality-status');
const aqiProgressBarFill = document.querySelector('.aqi-progress');
const aqiLegendElement = document.querySelector('.aqi-legend'); // Nueva referencia para la leyenda AQI

const no2ValueElement = document.querySelector('.no2-value');
const no2StatusElement = document.querySelector('.no2-status');
const no2ProgressBarFill = document.querySelector('.nitrogen-progress');

const coValueElement = document.querySelector('.co-value');
const coStatusElement = document.querySelector('.co-status');
const coProgressBarFill = document.querySelector('.carbon-progress');

const o3ValueElement = document.querySelector('.o3-value');
const o3StatusElement = document.querySelector('.o3-status');
const o3ProgressBarFill = document.querySelector('.ozone-progress');


// Función principal para obtener el clima (intenta por geolocalización)
function getWeatherData() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log(`Ubicación obtenida: Lat ${lat}, Lon ${lon}`);
                fetchOpenWeatherDataByCoordinates(lat, lon);
            },
            error => {
                console.error("Error al obtener la ubicación:", error.message, error.code);
                displayError("Por favor, permite el acceso a tu ubicación para ver el clima.");
            }
        );
    } else {
        console.error("Geolocation no es soportada por este navegador.");
        displayError("Tu navegador no soporta la geolocalización.");
    }
}

// Función para mostrar errores en la UI
function displayError(message) {
    cityNameElement.textContent = "Error";
    tempValueElement.textContent = "N/A";
    tempUnitElement.textContent = "";
    weatherConditionElement.textContent = message;
    humidityLowTempElement.textContent = "";

    airQualityStatusElement.textContent = "Error";
    aqiProgressBarFill.style.width = '0%';
    aqiLegendElement.textContent = ""; // Limpiar leyenda en error

    no2ValueElement.textContent = "--";
    no2StatusElement.textContent = "";
    no2ProgressBarFill.style.width = '0%';

    coValueElement.textContent = "--";
    coStatusElement.textContent = "";
    coProgressBarFill.style.width = '0%';

    o3ValueElement.textContent = "--";
    o3StatusElement.textContent = "";
    o3ProgressBarFill.style.width = '0%';
}

// FUNCIÓN para llamar a la API de OpenWeatherMap
async function fetchOpenWeatherDataByCoordinates(lat, lon) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY_OPENWEATHER}&units=metric&lang=es`;
    const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY_OPENWEATHER}`;

    try {
        const [weatherResponse, airQualityResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(airQualityUrl)
        ]);

        if (!weatherResponse.ok) {
            throw new Error(`Error HTTP Clima: ${weatherResponse.status}`);
        }
        if (!airQualityResponse.ok) {
            throw new Error(`Error HTTP Calidad del Aire: ${airQualityResponse.status}`);
        }

        const weatherData = await weatherResponse.json();
        const airQualityData = await airQualityResponse.json();

        console.log("Datos del Clima (OpenWeatherMap):", weatherData);
        console.log("Datos de Calidad del Aire (OpenWeatherMap):", airQualityData);

        updateUIWithOpenWeatherData(weatherData, airQualityData);

    } catch (error) {
        console.error("Error al obtener datos de OpenWeatherMap:", error);
        displayError(`No se pudieron cargar los datos del clima: ${error.message}`);
    }
}

// Función de ayuda: Para determinar el estado de la calidad del aire (Índice de Calidad del Aire Europeo - EEA)
function getAqiStatusOpenWeather(aqiValue) {
    // Los valores AQI de OpenWeatherMap (EEA) van de 1 a 5
    if (aqiValue === 1) return { status: 'Muy Bueno', color: '#6EE7B7' }; // Verde claro
    if (aqiValue === 2) return { status: 'Bueno', color: '#3B82F6' };    // Azul
    if (aqiValue === 3) return { status: 'Regular', color: '#FCD34D' }; // Amarillo
    if (aqiValue === 4) return { status: 'Pobre', color: '#EF4444' };   // Rojo
    if (aqiValue === 5) return { status: 'Muy Pobre', color: '#9333EA' };// Púrpura
    return { status: 'Desconocido', color: '#CCCCCC' };
}

// FUNCIÓN DE AYUDA: Para determinar el estado de los contaminantes (ajustada para OpenWeatherMap)
function getContaminantStatusOpenWeather(value, pollutantName) {
    let status = '';
    let thresholdBueno = 0; // Umbral para 'Bien'
    let thresholdModerado = 0; // Umbral para 'Moderado'
    let unit = '';

    // Los umbrales aquí son ejemplos y se pueden ajustar.
    // Usaremos valores en µg/m³ o ppm/ppb según OpenWeatherMap
    // O3 en µg/m³, NO2 en µg/m³, CO en mg/m³
    switch (pollutantName) {
        case 'no2': // Dióxido de Nitrógeno (µg/m³)
            // Basado en OMS: 40 µg/m³ promedio anual. Para corto plazo, se podría usar 200 µg/m³ por hora.
            // Ajustamos los umbrales para que la barra se vea bien.
            thresholdBueno = 40;
            thresholdModerado = 80;
            unit = 'µg/m³';
            break;
        case 'co': // Monóxido de Carbono (mg/m³)
            // Basado en OMS: 4 mg/m³ (1 hora).
            thresholdBueno = 4.0;
            thresholdModerado = 8.0;
            unit = 'mg/m³';
            break;
        case 'o3': // Ozono (µg/m³)
            // Basado en OMS: 100 µg/m³ (8 horas).
            thresholdBueno = 100;
            thresholdModerado = 160;
            unit = 'µg/m³';
            break;
        default:
            return { status: '', unit: '' };
    }

    if (value <= thresholdBueno) {
        status = 'Bien';
    } else if (value > thresholdBueno && value <= thresholdModerado) {
        status = 'Moderado';
    } else {
        status = 'Alto';
    }
    return { status: status, unit: unit };
}


// FUNCIÓN para actualizar la interfaz de usuario con datos de OpenWeatherMap
function updateUIWithOpenWeatherData(weatherData, airQualityData) {
    // Datos del clima principal
    const city = weatherData.name;
    const temp = Math.round(weatherData.main.temp); // Temperatura en Celsius
    const condition = weatherData.weather[0].description; // Descripción del clima
    const humidity = weatherData.main.humidity;
    const feelsLikeTemp = Math.round(weatherData.main.feels_like);

    cityNameElement.textContent = city.toUpperCase();
    tempValueElement.textContent = temp;
    tempUnitElement.textContent = '°';
    weatherConditionElement.textContent = condition.charAt(0).toUpperCase() + condition.slice(1);
    humidityLowTempElement.textContent = `Humedad: ${humidity}% / Sensación: ${feelsLikeTemp}°`;

    // POBLAR TARJETA DE CALIDAD DEL AIRE
    const aqi = airQualityData.list[0].main.aqi; // AQI de OpenWeatherMap (1-5)
    if (aqi !== undefined) {
        const { status, color } = getAqiStatusOpenWeather(aqi);
        airQualityStatusElement.textContent = `${aqi} - ${status}`;
        // Para la barra de progreso, mapear AQI 1-5 a porcentaje (ej. 1=0%, 5=100% sobre el rango 1-5)
        const aqiProgressPercentage = ((aqi - 1) / 4) * 100; // AQI 1=0%, 2=25%, 3=50%, 4=75%, 5=100%
        aqiProgressBarFill.style.width = `${aqiProgressPercentage}%`;
        // La leyenda de AQI (1 a 5) ya está fija en el HTML, no es necesario actualizarla aquí.
    } else {
        airQualityStatusElement.textContent = "No disponible";
        aqiProgressBarFill.style.width = '0%';
    }

    // POBLAR TARJETA DE CONTAMINANTES (NO2, CO, O3)
    const components = airQualityData.list[0].components;

    // Dióxido de Nitrógeno (NO2)
    const no2 = components.no2; // Viene en µg/m³
    const { status: no2Status, unit: no2Unit } = getContaminantStatusOpenWeather(no2, 'no2');
    no2ValueElement.textContent = `${no2.toFixed(1)}`; // Redondear a 1 decimal
    no2StatusElement.textContent = `${no2Unit} - ${no2Status}`; // Unidad y estado
    // Para la barra de progreso de NO2, escala entre 0 y 100 µg/m³ (ejemplo de umbral máximo)
    const no2ProgressPercentage = Math.min(100, (no2 / 100) * 100);
    no2ProgressBarFill.style.width = `${no2ProgressPercentage}%`;

    // Monóxido de Carbono (CO)
    const co = components.co; // Viene en µg/m³, convertir a mg/m³ para comparar con OMS (divide por 1000)
    const co_mg_m3 = co / 1000;
    const { status: coStatus, unit: coUnit } = getContaminantStatusOpenWeather(co_mg_m3, 'co');
    coValueElement.textContent = `${co_mg_m3.toFixed(1)}`; // Redondear a 1 decimal
    coStatusElement.textContent = `${coUnit} - ${coStatus}`; // Unidad y estado
    // Para la barra de progreso de CO, escala entre 0 y 10 mg/m³ (ejemplo de umbral máximo)
    const coProgressPercentage = Math.min(100, (co_mg_m3 / 10) * 100);
    coProgressBarFill.style.width = `${coProgressPercentage}%`;


    // Ozono (O3)
    const o3 = components.o3; // Viene en µg/m³
    const { status: o3Status, unit: o3Unit } = getContaminantStatusOpenWeather(o3, 'o3');
    o3ValueElement.textContent = `${o3.toFixed(1)}`; // Redondear a 1 decimal
    o3StatusElement.textContent = `${o3Unit} - ${o3Status}`; // Unidad y estado
    // Para la barra de progreso de O3, escala entre 0 y 200 µg/m³ (ejemplo de umbral máximo)
    const o3ProgressPercentage = Math.min(100, (o3 / 200) * 100);
    o3ProgressBarFill.style.width = `${o3ProgressPercentage}%`;
}


// Ejecutar la función cuando la página se carga
document.addEventListener('DOMContentLoaded', getWeatherData);
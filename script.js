// Paso 1: Configuración
const API_KEY = '6616fa3f824e4235b2f232939250706'; // ¡CAMBIA ESTO CON TU CLAVE REAL DE WEATHERAPI.COM!

// Elementos del clima principal
const cityNameElement = document.querySelector('.city-name');
const tempValueElement = document.querySelector('.temp-value');
const tempUnitElement = document.querySelector('.temp-unit');
const weatherConditionElement = document.querySelector('.weather-condition');
const humidityLowTempElement = document.querySelector('.humidity-low-temp');

// Referencias para CALIDAD DEL AIRE Y CONTAMINANTES (EXISTENTES)
const airQualityStatusElement = document.querySelector('.air-quality-status');
const aqiProgressBarFill = document.querySelector('.aqi-progress');

const no2ValueElement = document.querySelector('.no2-value');
const no2StatusElement = document.querySelector('.no2-status');
const no2ProgressBarFill = document.querySelector('.nitrogen-progress');

const coValueElement = document.querySelector('.co-value');
const coStatusElement = document.querySelector('.co-status');
const coProgressBarFill = document.querySelector('.carbon-progress');

// ***** NUEVAS REFERENCIAS PARA OZONO *****
const o3ValueElement = document.querySelector('.o3-value');
const o3StatusElement = document.querySelector('.o3-status');
const o3ProgressBarFill = document.querySelector('.ozone-progress');
// *****************************************


// Función principal para obtener el clima (sin cambios)
function getWeatherData() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                console.log(`Ubicación obtenida: Lat ${lat}, Lon ${lon}`);
                fetchWeatherByCoordinates(lat, lon);
            },
            error => {
                console.error("Error al obtener la ubicación:", error.message);
                displayError("Por favor, permite el acceso a tu ubicación para ver el clima.");
            }
        );
    } else {
        console.error("Geolocation no es soportada por este navegador.");
        displayError("Tu navegador no soporta la geolocalización.");
    }
}

// Función para mostrar errores en la UI (actualizada para nuevos elementos)
function displayError(message) {
    cityNameElement.textContent = "Error";
    tempValueElement.textContent = "N/A";
    tempUnitElement.textContent = "";
    weatherConditionElement.textContent = message;
    humidityLowTempElement.textContent = "";

    airQualityStatusElement.textContent = "Error";
    aqiProgressBarFill.style.width = '0%';

    no2ValueElement.textContent = "--";
    no2StatusElement.textContent = "";
    no2ProgressBarFill.style.width = '0%';

    coValueElement.textContent = "--";
    coStatusElement.textContent = "";
    coProgressBarFill.style.width = '0%';

    // ***** Limpiar también el ozono en caso de error *****
    o3ValueElement.textContent = "--";
    o3StatusElement.textContent = "";
    o3ProgressBarFill.style.width = '0%';
}

// Función para llamar a la API de WeatherAPI.com (sin cambios, ya tiene aqi=yes)
async function fetchWeatherByCoordinates(lat, lon) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${lat},${lon}&lang=es&aqi=yes`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error HTTP: ${response.status} - ${errorData.error.message || 'Error desconocido'}`);
        }
        const data = await response.json();
        console.log("Datos del clima (WeatherAPI con AQI):", data);
        updateWeatherUI(data);
    } catch (error) {
        console.error("Error al obtener los datos del clima de WeatherAPI:", error);
        displayError(`No se pudieron cargar los datos: ${error.message}`);
    }
}

// Función de ayuda: Para determinar el estado de la calidad del aire (sin cambios)
function getAqiStatus(aqiValue) {
    if (aqiValue >= 0 && aqiValue <= 50) return { status: 'Bueno', color: '#6EE7B7' };
    if (aqiValue > 50 && aqiValue <= 100) return { status: 'Moderado', color: '#3B82F6' };
    if (aqiValue > 100 && aqiValue <= 150) return { status: 'Poco Saludable para Grupos Sensibles', color: '#FCD34D' };
    if (aqiValue > 150 && aqiValue <= 200) return { status: 'Poco Saludable', color: '#EF4444' };
    if (aqiValue > 200 && aqiValue <= 300) return { status: 'Muy Poco Saludable', color: '#9333EA' };
    if (aqiValue > 300) return { status: 'Peligroso', color: '#7F1D1D' };
    return { status: 'Desconocido', color: '#CCCCCC' };
}

// ***** FUNCIÓN DE AYUDA: Para determinar el estado de los contaminantes (AGREGAR CASE PARA O3) *****
function getContaminantStatus(value, pollutantName) {
    let status = '';
    let threshold = 0;
    let unit = '';

    switch (pollutantName) {
        case 'no2': // Dióxido de Nitrógeno
            threshold = 20; // Ejemplo: en ppb
            unit = 'ppb';
            break;
        case 'co': // Monóxido de Carbono
            threshold = 5; // Ejemplo: en ppm
            unit = 'ppm';
            break;
        case 'o3': // Ozono (O3)
            threshold = 70; // Ejemplo: en ppb (umbral de 8 horas de la EPA)
            unit = 'ppb';
            break;
        default:
            return { status: '', color: '', unit: '' };
    }

    if (value <= threshold) {
        status = 'Bien';
    } else if (value > threshold && value <= threshold * 1.5) { // Umbral un poco más flexible para "Moderado"
        status = 'Moderado';
    } else {
        status = 'Alto';
    }
    return { status: status, unit: unit };
}


// Función para actualizar la interfaz de usuario con todos los datos del clima y AQI
function updateWeatherUI(data) {
    // Datos del clima principal (sin cambios)
    const city = data.location.name;
    const temp = Math.round(data.current.temp_c);
    const condition = data.current.condition.text;
    const humidity = data.current.humidity;
    const temp_feelslike_c = Math.round(data.current.feelslike_c);

    // Lógica para Tonalá con acento (si la mantuviste)
    // if (city.toUpperCase() === 'TONALA') {
    //     city = 'TONALÁ';
    // }

    cityNameElement.textContent = city.toUpperCase();
    tempValueElement.textContent = temp;
    tempUnitElement.textContent = '°';
    weatherConditionElement.textContent = condition.charAt(0).toUpperCase() + condition.slice(1);
    humidityLowTempElement.textContent = `Humedad: ${humidity}% / Sensación: ${temp_feelslike_c}°`;

    // POBLAR TARJETA DE CALIDAD DEL AIRE (sin cambios)
    const aqi = data.current.air_quality['us-epa-index'];
    const aqiText = data.current.air_quality.us_epa_index_text;

    if (aqi !== undefined) {
        const { status, color } = getAqiStatus(aqi);
        airQualityStatusElement.textContent = `${aqi} - ${aqiText || status}`;
        const aqiProgressPercentage = ((aqi - 1) / 5) * 100;
        aqiProgressBarFill.style.width = `${aqiProgressPercentage}%`;
    } else {
        airQualityStatusElement.textContent = "No disponible";
        aqiProgressBarFill.style.width = '0%';
    }

    // POBLAR TARJETA DE CONTAMINANTES (NO2 y CO) (sin cambios)
    const airQualityData = data.current.air_quality;

    const no2_ug_m3 = airQualityData.no2;
    const no2_ppb = (no2_ug_m3 * 0.53).toFixed(1);
    const { status: no2Status, unit: no2Unit } = getContaminantStatus(no2_ppb, 'no2');
    no2ValueElement.textContent = no2_ppb;
    no2StatusElement.textContent = no2Status;
    const no2ProgressPercentage = Math.min(100, (no2_ppb / 50) * 100);
    no2ProgressBarFill.style.width = `${no2ProgressPercentage}%`;

    const co_ug_m3 = airQualityData.co;
    const co_ppm = (co_ug_m3 * 0.00087).toFixed(1);
    const { status: coStatus, unit: coUnit } = getContaminantStatus(co_ppm, 'co');
    coValueElement.textContent = co_ppm;
    coStatusElement.textContent = coStatus;
    const coProgressPercentage = Math.min(100, (co_ppm / 10) * 100);
    coProgressBarFill.style.width = `${coProgressPercentage}%`;

    // ***** POBLAR NUEVA TARJETA DE OZONO *****
    const o3_ug_m3 = airQualityData.o3; // Ozono de la API en µg/m³
    // Conversión aproximada de µg/m³ a ppb para O3: ppb = µg/m³ * 0.51
    const o3_ppb = (o3_ug_m3 * 0.51).toFixed(1);
    const { status: o3Status, unit: o3Unit } = getContaminantStatus(o3_ppb, 'o3');
    o3ValueElement.textContent = o3_ppb;
    o3StatusElement.textContent = o3Status;
    // Para la barra de progreso de O3, escala entre 0 y 100 ppb (ejemplo de umbral máximo)
    const o3ProgressPercentage = Math.min(100, (o3_ppb / 100) * 100);
    o3ProgressBarFill.style.width = `${o3ProgressPercentage}%`;
    // *****************************************
}

// Ejecutar la función cuando la página se carga (sin cambios)
document.addEventListener('DOMContentLoaded', getWeatherData);
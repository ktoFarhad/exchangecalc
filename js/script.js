// ===== Глобальные переменные =====
const API_URL = "https://open.er-api.com/v6/latest/"
let exchangeRates = {}
let lastUpdated = null

// ===== DOM элементы =====
// Общие элементы
const navbarBurger = document.querySelector(".burger")
const navLinks = document.querySelector(".nav-links")

// Элементы конвертера валют
const fromCurrencySelect = document.getElementById("from-currency")
const toCurrencySelect = document.getElementById("to-currency")
const amountInput = document.getElementById("amount")
const convertBtn = document.getElementById("convert-btn")
const resetBtn = document.getElementById("reset-btn")
const swapBtn = document.getElementById("swap-btn")
const conversionRateElement = document.getElementById("conversion-rate")
const convertedAmountElement = document.getElementById("converted-amount")
const toCurrencyCodeElement = document.getElementById("to-currency-code")
const updateTimeElement = document.getElementById("update-time")

// Элементы страницы курсов валют
const baseCurrencyElement = document.getElementById("base-currency")
const baseCurrencySelect = document.getElementById("base-currency-select")
const refreshRatesBtn = document.getElementById("refresh-rates")
const ratesLoadingElement = document.getElementById("rates-loading")
const ratesErrorElement = document.getElementById("rates-error")
const ratesTableElement = document.getElementById("rates-table")
const ratesBodyElement = document.getElementById("rates-body")
const updateTimeRatesElement = document.getElementById("update-time-rates")

// Элементы формы контактов
const contactForm = document.getElementById("contact-form")
const formMessageElement = document.getElementById("form-message")

// ===== Обработчики событий =====
document.addEventListener("DOMContentLoaded", () => {
// Переключение мобильной навигации
if (navbarBurger) {
    navbarBurger.addEventListener("click", () => {
    navbarBurger.classList.toggle("active")
    navLinks.classList.toggle("active")
    })
}

// Инициализация страницы конвертера
if (fromCurrencySelect && toCurrencySelect) {
    initializeConverter()
}

// Инициализация страницы курсов валют
if (baseCurrencySelect) {
    initializeRatesPage()
}

// Инициализация формы контактов
if (contactForm) {
    initializeContactForm()
}
})

// ===== Функции конвертера валют =====

/**
 * Инициализация страницы конвертера валют
 */
function initializeConverter() {
// Получение курсов валют и заполнение выпадающих списков
fetchExchangeRates("USD")
    .then(() => {
    populateCurrencySelects()
    updateConversionResult()
    })
    .catch((error) => {
    console.error("Ошибка инициализации конвертера:", error)
    })

// Добавление обработчиков событий
convertBtn.addEventListener("click", updateConversionResult)
resetBtn.addEventListener("click", resetConverter)
swapBtn.addEventListener("click", swapCurrencies)

// Обновление результата при изменении ввода/выбора
amountInput.addEventListener("input", updateConversionResult)
fromCurrencySelect.addEventListener("change", updateConversionResult)
toCurrencySelect.addEventListener("change", updateConversionResult)
}

/**
 * Заполнение выпадающих списков валют доступными валютами
 */
function populateCurrencySelects() {
// Очистка существующих опций
fromCurrencySelect.innerHTML = ""
toCurrencySelect.innerHTML = ""

// Получение валют из курсов обмена
const currencies = Object.keys(exchangeRates)

// Добавление опций в выпадающие списки
currencies.forEach((currency) => {
    const fromOption = document.createElement("option")
    fromOption.value = currency
    fromOption.textContent = currency

    const toOption = document.createElement("option")
    toOption.value = currency
    toOption.textContent = currency

    fromCurrencySelect.appendChild(fromOption)
    toCurrencySelect.appendChild(toOption)
})

// Установка значений по умолчанию
fromCurrencySelect.value = "USD"
toCurrencySelect.value = "EUR"
}

/**
 * Обновление результата конвертации на основе текущих входных данных
 */
function updateConversionResult() {
const amount = Number.parseFloat(amountInput.value)
const fromCurrency = fromCurrencySelect.value
const toCurrency = toCurrencySelect.value

if (isNaN(amount) || amount <= 0) {
    alert("Пожалуйста, введите корректную сумму")
    return
}

// Расчет конвертации
const conversionRate = exchangeRates[toCurrency] / exchangeRates[fromCurrency]
const convertedAmount = amount * conversionRate

// Обновление интерфейса
conversionRateElement.textContent = conversionRate.toFixed(4)
convertedAmountElement.textContent = convertedAmount.toFixed(2)
toCurrencyCodeElement.textContent = toCurrency

// Обновление текста отображения для курса конвертации
document.querySelector("#result p").textContent = `1.00 ${fromCurrency} = ${conversionRate.toFixed(4)} ${toCurrency}`
}

/**
 * Сброс формы конвертера к значениям по умолчанию
 */
function resetConverter() {
amountInput.value = "1"
fromCurrencySelect.value = "USD"
toCurrencySelect.value = "EUR"
updateConversionResult()
}

/**
 * Обмен валют местами
 */
function swapCurrencies() {
const temp = fromCurrencySelect.value
fromCurrencySelect.value = toCurrencySelect.value
toCurrencySelect.value = temp
updateConversionResult()
}

// ===== Функции страницы курсов валют =====

/**
 * Инициализация страницы курсов валют
 */
function initializeRatesPage() {
// Получение курсов валют и заполнение таблицы
fetchExchangeRates("USD")
    .then(() => {
    populateBaseCurrencySelect()
    displayExchangeRates()
    })
    .catch((error) => {
    console.error("Ошибка инициализации страницы курсов:", error)
    showRatesError()
    })

// Добавление обработчиков событий
refreshRatesBtn.addEventListener("click", refreshRates)
baseCurrencySelect.addEventListener("change", changeBaseCurrency)
}

/**
 * Заполнение выпадающего списка базовой валюты
 */
function populateBaseCurrencySelect() {
// Очистка существующих опций
baseCurrencySelect.innerHTML = ""

// Получение валют из курсов обмена
const currencies = Object.keys(exchangeRates)

// Добавление опций в выпадающий список
currencies.forEach((currency) => {
    const option = document.createElement("option")
    option.value = currency
    option.textContent = currency
    baseCurrencySelect.appendChild(option)
})

// Установка значения по умолчанию
baseCurrencySelect.value = "USD"
}

/**
 * Отображение курсов валют в таблице
 */
function displayExchangeRates() {
// Показать состояние загрузки
ratesLoadingElement.classList.remove("hidden")
ratesTableElement.classList.add("hidden")
ratesErrorElement.classList.add("hidden")

// Получение базовой валюты
const baseCurrency = baseCurrencySelect.value || "USD"

// Обновление отображения базовой валюты
baseCurrencyElement.textContent = baseCurrency

// Очистка существующих строк таблицы
ratesBodyElement.innerHTML = ""

// Получение валют и сортировка по алфавиту
const currencies = Object.keys(exchangeRates).sort()

// Расчет курсов относительно базовой валюты
const baseRate = exchangeRates[baseCurrency]

// Добавление строк в таблицу
currencies.forEach((currency) => {
    // Пропуск базовой валюты
    if (currency === baseCurrency) return

    const rate = exchangeRates[currency] / baseRate

    const row = document.createElement("tr")
    row.innerHTML = `
            <td>${getCurrencyName(currency)}</td>
            <td>${currency}</td>
            <td>${rate.toFixed(4)}</td>
        `

    ratesBodyElement.appendChild(row)
})

// Обновление времени последнего обновления
if (updateTimeRatesElement && lastUpdated) {
    updateTimeRatesElement.textContent = formatDateTime(lastUpdated)
}

// Скрыть загрузку, показать таблицу
ratesLoadingElement.classList.add("hidden")
ratesTableElement.classList.remove("hidden")
}

/**
 * Изменение базовой валюты и обновление таблицы курсов
 */
function changeBaseCurrency() {
displayExchangeRates()
}

/**
 * Обновление данных курсов валют
 */
function refreshRates() {
const baseCurrency = baseCurrencySelect.value || "USD"

fetchExchangeRates(baseCurrency, true)
    .then(() => {
    displayExchangeRates()
    })
    .catch((error) => {
    console.error("Ошибка обновления курсов:", error)
    showRatesError()
    })
}

/**
 * Показать сообщение об ошибке на странице курсов
 */
function showRatesError() {
ratesLoadingElement.classList.add("hidden")
ratesTableElement.classList.add("hidden")
ratesErrorElement.classList.remove("hidden")
}

// ===== Функции формы контактов =====

/**
 * Инициализация формы контактов
 */
function initializeContactForm() {
contactForm.addEventListener("submit", handleContactFormSubmit)
}

/**
 * Обработка отправки формы контактов
 * @param {Event} event - Событие отправки формы
 */
function handleContactFormSubmit(event) {
event.preventDefault()

// Получение данных формы
const formData = new FormData(contactForm)
const name = formData.get("name")
const email = formData.get("email")
const subject = formData.get("subject")
const message = formData.get("message")

// Валидация данных формы
if (!name || !email || !subject || !message) {
    showFormMessage("Пожалуйста, заполните все поля", "error")
    return
}

if (!isValidEmail(email)) {
    showFormMessage("Пожалуйста, введите корректный email адрес", "error")
    return
}

// Имитация отправки формы (в реальном приложении это отправило бы данные на сервер)
setTimeout(() => {
    showFormMessage("Ваше сообщение успешно отправлено!", "success")
    contactForm.reset()
}, 1000)
}

/**
 * Показать сообщение в форме контактов
 * @param {string} message - Сообщение для отображения
 * @param {string} type - Тип сообщения ('success' или 'error')
 */
function showFormMessage(message, type) {
formMessageElement.textContent = message
formMessageElement.className = "form-message"
formMessageElement.classList.add(type)
formMessageElement.classList.remove("hidden")

// Скрыть сообщение через 5 секунд
setTimeout(() => {
    formMessageElement.classList.add("hidden")
}, 5000)
}

/**
 * Валидация формата email
 * @param {string} email - Email для проверки
 * @returns {boolean} - True, если email корректный
 */
function isValidEmail(email) {
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
return emailRegex.test(email)
}

// ===== Функции API и данных =====

/**
 * Получение курсов валют из API
 * @param {string} baseCurrency - Базовая валюта для курсов
 * @param {boolean} forceRefresh - Принудительное обновление из API вместо использования кэша
 * @returns {Promise} - Promise, который разрешается, когда курсы получены
 */
async function fetchExchangeRates(baseCurrency = "USD", forceRefresh = false) {
// Проверка, есть ли у нас кэшированные данные и они не старше 1 часа
const currentTime = new Date()
const cacheExpired = !lastUpdated || currentTime - lastUpdated > 60 * 60 * 1000 || forceRefresh

if (!cacheExpired && Object.keys(exchangeRates).length > 0) {
    return Promise.resolve(exchangeRates)
}

try {
    const response = await fetch(`${API_URL}${baseCurrency}`)

    if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status}`)
    }

    const data = await response.json()

    if (data && data.rates) {
    exchangeRates = data.rates
    lastUpdated = new Date()

    // Обновление отображения времени последнего обновления
    if (updateTimeElement) {
        updateTimeElement.textContent = formatDateTime(lastUpdated)
    }

    return exchangeRates
    } else {
    throw new Error("Некорректный ответ API")
    }
} catch (error) {
    console.error("Ошибка получения курсов валют:", error)
    throw error
}
}

// ===== Вспомогательные функции =====

/**
 * Форматирование даты и времени для отображения
 * @param {Date} date - Дата для форматирования
 * @returns {string} - Отформатированная строка даты
 */
function formatDateTime(date) {
if (!date) return "--"

return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
})
}

/**
 * Получение названия валюты по коду валюты
 * @param {string} code - Код валюты
 * @returns {string} - Название валюты
 */
function getCurrencyName(code) {
const currencyNames = {
    USD: "Доллар США",
    EUR: "Евро",
    GBP: "Британский фунт",
    JPY: "Японская иена",
    AUD: "Австралийский доллар",
    CAD: "Канадский доллар",
    CHF: "Швейцарский франк",
    CNY: "Китайский юань",
    RUB: "Российский рубль",
    INR: "Индийская рупия",
    BRL: "Бразильский реал",
    ZAR: "Южноафриканский рэнд",
    TRY: "Турецкая лира",
    MXN: "Мексиканское песо",
    SGD: "Сингапурский доллар",
    NZD: "Новозеландский доллар",
    SEK: "Шведская крона",
    NOK: "Норвежская крона",
    KRW: "Южнокорейская вона",
    HKD: "Гонконгский доллар",
}

return currencyNames[code] || code
}

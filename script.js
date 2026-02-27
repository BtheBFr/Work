// ============================================
// WORK от "B the B" | Завод Осколки
// ПОЛНАЯ ВЕРСИЯ С АДМИНКОЙ И КЭШИРОВАНИЕМ
// ============================================

const API_URL = CONFIG.apiUrl;
let currentUser = null;
let currentWordleGame = null;
let selectedShop = null;
let selectedFile = null;
let selectedMethod = null;

// КЭШ ДЛЯ БЫСТРОЙ ЗАГРУЗКИ
const cache = {
    user: null,
    words: {},
    history: null,
    admin: null,
    timestamp: {}
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initCursorGlow();
    checkSavedSession();
});

function initApp() {
    // Кнопки авторизации
    document.getElementById('showLoginBtn')?.addEventListener('click', showLoginForm);
    document.getElementById('showRegisterBtn')?.addEventListener('click', showRegisterForm);
    
    // Кнопки пользователя
    document.getElementById('btnProfile')?.addEventListener('click', () => showProfile());
    document.getElementById('btnHistory')?.addEventListener('click', () => showHistory());
    document.getElementById('btnWithdraw')?.addEventListener('click', () => showWithdraw());
    document.getElementById('btnAdmin')?.addEventListener('click', () => showAdminPanel());
    document.getElementById('btnLogout')?.addEventListener('click', logout);
    
    // Мобильное меню
    document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMobileMenu);
    
    // Модальное окно
    document.getElementById('modalClose')?.addEventListener('click', hideModal);
    document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) {
            hideModal();
        }
    });
}

// Эффект свечения за курсором
function initCursorGlow() {
    const glow = document.querySelector('.cursor-glow');
    if (!glow) return;
    
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX - 200;
        mouseY = e.clientY - 200;
    });
    
    function animate() {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        glow.style.transform = `translate(${glowX}px, ${glowY}px)`;
        requestAnimationFrame(animate);
    }
    
    animate();
}

// ============================================
// РАБОТА С API (С КЭШИРОВАНИЕМ)
// ============================================

async function callAppsScript(action, params = {}, useCache = false, cacheTime = 60000) {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    
    // Проверяем кэш
    if (useCache && cache[cacheKey] && (Date.now() - cache.timestamp[cacheKey] < cacheTime)) {
        console.log(`📦 КЭШ: ${action}`, cache[cacheKey]);
        return cache[cacheKey];
    }
    
    try {
        const urlParams = new URLSearchParams({
            action: action,
            ...params
        });
        
        console.log(`📡 API запрос: ${action}`, params);
        
        const response = await fetch(`${API_URL}?${urlParams.toString()}`);
        const data = await response.json();
        
        console.log(`📦 API ответ: ${action}`, data);
        
        if (!data.success) {
            if (data.error) {
                showNotification(data.error, 'error');
            }
            return null;
        }
        
        // Сохраняем в кэш
        if (useCache) {
            cache[cacheKey] = data;
            cache.timestamp[cacheKey] = Date.now();
        }
        
        return data;
    } catch (error) {
        console.error('❌ API ошибка:', error);
        showNotification('Ошибка соединения с сервером', 'error');
        return null;
    }
}

// ============================================
// АВТОРИЗАЦИЯ
// ============================================

function checkSavedSession() {
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
        // Сразу показываем интерфейс (мгновенно)
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('userPanel').style.display = 'flex';
        document.querySelector('.token-value').textContent = savedToken;
        
        // Показываем меню сразу
        showMainMenu();
        
        // Загружаем данные в фоне
        loginWithToken(savedToken, true);
    }
}

function showLoginForm() {
    const form = `
        <div class="form-container">
            <h2 class="form-title">🔐 Вход</h2>
            <form id="loginForm" onsubmit="event.preventDefault(); loginWithToken(document.getElementById('loginToken').value);">
                <div class="form-group">
                    <label>Токен</label>
                    <input type="text" id="loginToken" placeholder="Введите ваш токен" required autofocus>
                </div>
                <div class="form-actions">
                    <button type="submit" class="submit-btn">Войти</button>
                    <button type="button" class="cancel-btn" onclick="hideModal()">Отмена</button>
                </div>
            </form>
            <div class="bot-card glass" style="margin-top: 20px;">
                <div class="bot-icon">🤖</div>
                <div class="bot-info">
                    <p>Нет токена?</p>
                    <a href="https://t.me/WorkBtheB_bot" target="_blank" class="bot-link">Получить в боте →</a>
                </div>
            </div>
        </div>
    `;
    showModal(form);
    
    setTimeout(() => {
        document.getElementById('loginToken')?.focus();
    }, 100);
}

function showRegisterForm() {
    const form = `
        <div class="form-container">
            <h2 class="form-title">📝 Регистрация</h2>
            <form id="registerForm" onsubmit="event.preventDefault(); registerUser()">
                <div class="form-group">
                    <label>Токен (получите в боте)</label>
                    <input type="text" id="regToken" placeholder="Введите токен" required>
                </div>
                <div class="form-group">
                    <label>Никнейм</label>
                    <input type="text" id="regNickname" placeholder="Придумайте никнейм" required>
                </div>
                <div class="form-group">
                    <label>Номер карты (необязательно)</label>
                    <input type="text" id="regCard" placeholder="0000 0000 0000 0000">
                </div>
                <div class="form-group">
                    <label>Номер телефона (необязательно)</label>
                    <input type="text" id="regPhone" placeholder="+7 (999) 999-99-99">
                </div>
                <div class="form-group">
                    <label>Логин Steam (необязательно)</label>
                    <input type="text" id="regSteam" placeholder="Steam login">
                </div>
                <div class="form-hint">* Минимум одно поле для вывода должно быть заполнено</div>
                <div class="form-actions">
                    <button type="submit" class="submit-btn">Зарегистрироваться</button>
                    <button type="button" class="cancel-btn" onclick="hideModal()">Отмена</button>
                </div>
            </form>
        </div>
    `;
    showModal(form);
}

async function registerUser() {
    const token = document.getElementById('regToken').value;
    const nickname = document.getElementById('regNickname').value;
    const card = document.getElementById('regCard').value;
    const phone = document.getElementById('regPhone').value;
    const steam = document.getElementById('regSteam').value;
    
    if (!card && !phone && !steam) {
        showNotification('Заполните хотя бы одно поле для вывода', 'error');
        return;
    }
    
    const result = await callAppsScript('register', {
        token, nickname, card, phone, steam
    });
    
    if (result && result.success) {
        showNotification('Регистрация успешна!', 'success');
        hideModal(); // ЗАКРЫВАЕМ МОДАЛКУ
        loginWithToken(token);
    }
}

async function loginWithToken(token, silent = false) {
    const result = await callAppsScript('login', { token }, true, 30000); // КЭШ 30 секунд
    
    if (result && result.success) {
        currentUser = result.user;
        localStorage.setItem('userToken', token);
        
        if (!silent) {
            hideModal(); // ЗАКРЫВАЕМ МОДАЛКУ
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('userPanel').style.display = 'flex';
            document.querySelector('.token-value').textContent = currentUser.token;
            showMainMenu();
            showNotification(`Добро пожаловать, ${currentUser.nickname}!`, 'success');
        } else {
            // Обновляем данные в фоне
            currentUser = result.user;
            document.querySelector('.token-value').textContent = currentUser.token;
        }
        
        // Проверяем админа
        checkIfAdmin(token);
    } else if (!silent) {
        showNotification('Ошибка входа', 'error');
    }
}

async function checkIfAdmin(token) {
    const result = await callAppsScript('checkAdmin', { token }, true, 60000); // КЭШ 1 минуту
    
    if (result && result.success && result.isAdmin) {
        document.getElementById('btnAdmin').style.display = 'flex';
    } else {
        document.getElementById('btnAdmin').style.display = 'none';
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('userToken');
    
    // Очищаем кэш
    for (let key in cache) {
        delete cache[key];
    }
    
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.getElementById('userPanel').style.display = 'none';
    document.getElementById('btnAdmin').style.display = 'none';
    showMainMenu();
    showNotification('Вы вышли из аккаунта', 'info');
}

// ============================================
// ГЛАВНОЕ МЕНЮ
// ============================================

function showMainMenu() {
    const menu = `
        <div class="main-menu">
            <div class="menu-btn" onclick="loadWordle()">
                <span>🎮</span>
                <h3>Wordle</h3>
                <p>Отгадай слово и получи +0.15₽</p>
            </div>
            <div class="menu-btn" onclick="loadCheck()">
                <span>🧾</span>
                <h3>Чек</h3>
                <p>Загрузи чек и получи +0.75₽</p>
            </div>
        </div>
    `;
    document.getElementById('mainContent').innerHTML = menu;
}

// ============================================
// WORDLE
// ============================================

async function loadWordle() {
    const today = new Date().toLocaleDateString('ru-RU');
    
    // Сразу показываем пустую сетку
    showEmptyWordle();
    
    // Загружаем данные
    const result = await callAppsScript('getWords', { date: today }, true, 60000); // КЭШ 1 минуту
    
    if (!result || !result.success) {
        return;
    }
    
    const words = result.words;
    
    let userWord = words.find(w => w.assignedTo === currentUser?.token);
    
    if (!userWord) {
        const freeWord = words.find(w => !w.assignedTo && w.status === 'свободно');
        
        if (freeWord) {
            const saveResult = await callAppsScript('saveWordProgress', {
                token: currentUser.token,
                word: freeWord.word,
                status: 'играет',
                attempts: JSON.stringify([]),
                guesses: ''
            });
            
            if (saveResult && saveResult.success) {
                userWord = {
                    word: freeWord.word,
                    status: 'играет',
                    attempts: [],
                    guesses: ''
                };
            }
        } else {
            showNotification('На сегодня нет свободных слов', 'error');
            return;
        }
    }
    
    if (userWord) {
        currentWordleGame = {
            word: userWord.word,
            status: userWord.status,
            attempts: userWord.attempts || [],
            guesses: userWord.guesses || ''
        };
        
        renderWordle();
    }
}

function showEmptyWordle() {
    currentWordleGame = {
        word: '?????',
        status: 'играет',
        attempts: [],
        guesses: '',
        currentGuess: [],
        letterStatus: {}
    };
    renderWordle();
}

function renderWordle() {
    const html = `
        <div class="wordle-container glass">
            <div class="game-header">
                <h2 class="game-title">🎮 Wordle</h2>
                <div class="game-attempts">
                    Попытки: <span>${currentWordleGame.attempts.length}/6</span>
                </div>
            </div>
            
            <div class="wordle-grid" id="wordleGrid">
                ${renderWordleGrid()}
            </div>
            
            <div class="wordle-keyboard" id="wordleKeyboard">
                ${renderKeyboard()}
            </div>
            
            ${currentWordleGame.status === 'отгадано' ? 
                '<div class="win-message">🎉 Поздравляем! Вы отгадали слово! +0.15₽</div>' : 
                currentWordleGame.attempts.length >= 6 ? 
                '<div class="lose-message">😢 Вы проиграли. Слово было: ' + currentWordleGame.word + '</div>' : 
                ''
            }
            
            <div class="form-actions">
                <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
    
    if (currentWordleGame.status !== 'отгадано' && currentWordleGame.attempts.length < 6) {
        initWordleKeyboard();
    }
}

function renderWordleGrid() {
    let grid = '';
    
    for (let i = 0; i < 6; i++) {
        grid += '<div class="wordle-row">';
        
        for (let j = 0; j < 5; j++) {
            let cellClass = 'wordle-cell';
            let letter = '';
            
            if (i < currentWordleGame.attempts.length) {
                const attempt = currentWordleGame.attempts[i];
                if (attempt && attempt[j]) {
                    letter = attempt[j].letter;
                    cellClass += ` ${attempt[j].status}`;
                }
            } else if (i === currentWordleGame.attempts.length) {
                if (currentWordleGame.currentGuess && currentWordleGame.currentGuess[j]) {
                    letter = currentWordleGame.currentGuess[j];
                    cellClass += ' filled';
                }
            }
            
            grid += `<div class="${cellClass}">${letter}</div>`;
        }
        
        grid += '</div>';
    }
    
    return grid;
}

function renderKeyboard() {
    const rows = [
        ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
        ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
        ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '←', '↵']
    ];
    
    let keyboard = '';
    
    rows.forEach(row => {
        keyboard += '<div class="keyboard-row">';
        row.forEach(key => {
            let keyClass = 'key';
            if (key === '←') keyClass += ' wide';
            if (key === '↵') keyClass += ' wide';
            
            if (currentWordleGame.letterStatus && currentWordleGame.letterStatus[key]) {
                keyClass += ` ${currentWordleGame.letterStatus[key]}`;
            }
            
            keyboard += `<button class="${keyClass}" onclick="handleKeyPress('${key}')">${key}</button>`;
        });
        keyboard += '</div>';
    });
    
    return keyboard;
}

function initWordleKeyboard() {
    currentWordleGame.currentGuess = [];
    currentWordleGame.letterStatus = {};
    
    currentWordleGame.attempts.forEach(attempt => {
        attempt.forEach(({letter, status}) => {
            if (!currentWordleGame.letterStatus[letter] || 
                (status === 'correct' && currentWordleGame.letterStatus[letter] !== 'correct') ||
                (status === 'present' && currentWordleGame.letterStatus[letter] !== 'correct')) {
                currentWordleGame.letterStatus[letter] = status;
            }
        });
    });
}

function handleKeyPress(key) {
    if (currentWordleGame.status === 'отгадано' || currentWordleGame.attempts.length >= 6) {
        return;
    }
    
    if (key === '←') {
        currentWordleGame.currentGuess.pop();
        renderWordle();
        return;
    }
    
    if (key === '↵') {
        if (currentWordleGame.currentGuess.length === 5) {
            submitWord();
        }
        return;
    }
    
    if (currentWordleGame.currentGuess.length < 5) {
        currentWordleGame.currentGuess.push(key);
        renderWordle();
    }
}

async function submitWord() {
    const guess = currentWordleGame.currentGuess.join('');
    const target = currentWordleGame.word;
    
    const result = checkWord(guess, target);
    
    currentWordleGame.attempts.push(result);
    
    result.forEach(({letter, status}) => {
        if (!currentWordleGame.letterStatus[letter] || 
            (status === 'correct' && currentWordleGame.letterStatus[letter] !== 'correct') ||
            (status === 'present' && currentWordleGame.letterStatus[letter] !== 'correct')) {
            currentWordleGame.letterStatus[letter] = status;
        }
    });
    
    const isWin = result.every(r => r.status === 'correct');
    
    if (isWin) {
        currentWordleGame.status = 'отгадано';
        await awardWordleWin();
    }
    
    currentWordleGame.currentGuess = [];
    await saveWordleProgress();
    renderWordle();
}

function checkWord(guess, target) {
    const result = [];
    const targetChars = target.split('');
    const guessChars = guess.split('');
    
    for (let i = 0; i < 5; i++) {
        if (guessChars[i] === targetChars[i]) {
            result[i] = { letter: guessChars[i], status: 'correct' };
            targetChars[i] = null;
            guessChars[i] = null;
        }
    }
    
    for (let i = 0; i < 5; i++) {
        if (guessChars[i] === null) continue;
        
        const index = targetChars.indexOf(guessChars[i]);
        if (index !== -1) {
            result[i] = { letter: guessChars[i], status: 'present' };
            targetChars[index] = null;
        } else {
            result[i] = { letter: guessChars[i], status: 'absent' };
        }
    }
    
    return result;
}

async function awardWordleWin() {
    const result = await callAppsScript('updateBalance', {
        token: currentUser.token,
        amount: 0.15
    });
    
    if (result && result.success) {
        await callAppsScript('addHistory', {
            token: currentUser.token,
            nickname: currentUser.nickname,
            type: 'wordle',
            amount: '+0.15',
            description: `Отгадал слово: ${currentWordleGame.word}`
        });
        
        currentUser.balance = result.balance;
        showNotification('+0.15₽ за слово!', 'success');
    }
}

async function saveWordleProgress() {
    await callAppsScript('saveWordProgress', {
        token: currentUser.token,
        word: currentWordleGame.word,
        status: currentWordleGame.status,
        attempts: JSON.stringify(currentWordleGame.attempts),
        guesses: Object.keys(currentWordleGame.letterStatus || {}).join(',')
    });
}

// ============================================
// ЧЕК
// ============================================

function loadCheck() {
    selectedShop = null;
    selectedFile = null;
    
    const html = `
        <div class="check-container glass">
            <h2 class="form-title">🧾 Загрузить чек</h2>
            
            <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
                <input type="file" id="fileInput" accept="image/*" style="display: none;" onchange="handleFileSelect(this.files[0])">
                <div class="upload-icon">📸</div>
                <div class="upload-text">Нажмите для выбора файла</div>
                <div class="upload-hint">или перетащите фото сюда</div>
            </div>
            
            <div class="shops-grid">
                <div class="shop-card" onclick="selectShop('Магнит')">
                    <div class="shop-logo">🛒</div>
                    <div class="shop-name">Магнит</div>
                </div>
                <div class="shop-card" onclick="selectShop('Пятерочка')">
                    <div class="shop-logo">🏪</div>
                    <div class="shop-name">Пятерочка</div>
                </div>
                <div class="shop-card" onclick="selectShop('Лента')">
                    <div class="shop-logo">🎗️</div>
                    <div class="shop-name">Лента</div>
                </div>
                <div class="shop-card" onclick="selectShop('Монетка')">
                    <div class="shop-logo">🪙</div>
                    <div class="shop-name">Монетка</div>
                </div>
                <div class="shop-card" onclick="selectShop('Перекресток')">
                    <div class="shop-logo">➕</div>
                    <div class="shop-name">Перекресток</div>
                </div>
                <div class="shop-card" onclick="selectShop('Чижик')">
                    <div class="shop-logo">🐦</div>
                    <div class="shop-name">Чижик</div>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="submit-btn" onclick="uploadCheck()" id="uploadBtn" disabled>Загрузить чек</button>
                <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
    
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelect(file);
        }
    });
}

function selectShop(shop) {
    selectedShop = shop;
    document.querySelectorAll('.shop-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.shop-card').classList.add('selected');
    updateUploadButton();
}

function handleFileSelect(file) {
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.innerHTML = `
                <img src="${e.target.result}" class="upload-preview">
                <div class="upload-hint">Нажмите чтобы изменить</div>
            `;
        };
        reader.readAsDataURL(file);
        
        updateUploadButton();
    }
}

function updateUploadButton() {
    const btn = document.getElementById('uploadBtn');
    if (btn) {
        btn.disabled = !(selectedShop && selectedFile);
    }
}

// Конвертация файла в base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Загрузка чека с фото на Google Drive
async function uploadCheck() {
    if (!selectedShop || !selectedFile) {
        showNotification('Выберите магазин и файл', 'error');
        return;
    }
    
    showNotification('Загрузка...', 'info');
    
    try {
        const base64Photo = await fileToBase64(selectedFile);
        
        const fileName = `check_${currentUser.token}_${Date.now()}.jpg`;
        const mimeType = selectedFile.type;
        
        const result = await callAppsScript('uploadPhoto', {
            base64Data: base64Photo,
            fileName: fileName,
            mimeType: mimeType,
            token: currentUser.token,
            nickname: currentUser.nickname,
            shop: selectedShop
        });
        
        if (result && result.success) {
            showNotification('Чек отправлен на проверку!', 'success');
            showMainMenu();
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showNotification('Ошибка при загрузке фото', 'error');
    }
}

// ============================================
// ПРОФИЛЬ (с кэшем)
// ============================================

async function showProfile() {
    // Сразу показываем старые данные
    const html = `
        <div class="profile-container glass">
            <div class="profile-header">
                <div class="profile-avatar">
                    ${currentUser?.nickname[0]?.toUpperCase() || '?'}
                </div>
                <div class="profile-info">
                    <h3>${currentUser?.nickname || 'Загрузка...'}</h3>
                    <p>Токен: ${currentUser?.token || ''}</p>
                </div>
            </div>
            
            <div class="balance-card">
                <span class="balance-label">Баланс</span>
                <span class="balance-value">${currentUser?.balance?.toFixed(2) || '0.00'}₽</span>
            </div>
            
            <div class="requisites-section">
                <h3 class="section-title">Мои реквизиты</h3>
                <div class="requisites-grid">
                    <div class="requisite-card" onclick="editRequisite('card')">
                        <div class="requisite-icon">💳</div>
                        <div class="requisite-type">Карта</div>
                        <div class="requisite-value">${currentUser?.card || 'Не указана'}</div>
                    </div>
                    
                    <div class="requisite-card" onclick="editRequisite('phone')">
                        <div class="requisite-icon">📱</div>
                        <div class="requisite-type">Телефон</div>
                        <div class="requisite-value">${currentUser?.phone || 'Не указан'}</div>
                    </div>
                    
                    <div class="requisite-card" onclick="editRequisite('steam')">
                        <div class="requisite-icon">🎮</div>
                        <div class="requisite-type">Steam</div>
                        <div class="requisite-value">${currentUser?.steam || 'Не указан'}</div>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
    
    // Обновляем данные в фоне
    const userResult = await callAppsScript('getUser', { token: currentUser.token }, true, 30000);
    
    if (userResult && userResult.success) {
        currentUser = userResult.user;
        showProfile(); // Перерисовываем с новыми данными
    }
}

function editRequisite(type) {
    showNotification('Редактирование будет доступно позже', 'info');
}

// ============================================
// ИСТОРИЯ (с кэшем)
// ============================================

async function showHistory() {
    // Сразу показываем заглушку
    const html = `
        <div class="history-container glass">
            <h2 class="form-title">📜 История операций</h2>
            <div class="history-list">
                <p>Загрузка...</p>
            </div>
            <div class="form-actions">
                <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
    
    // Загружаем данные
    const result = await callAppsScript('getHistory', { token: currentUser.token }, true, 30000);
    
    if (!result || !result.success) {
        return;
    }
    
    const history = result.history || [];
    
    const fullHtml = `
        <div class="history-container glass">
            <h2 class="form-title">📜 История операций</h2>
            
            <div class="history-filters">
                <button class="filter-btn active" onclick="filterHistory('all')">Все</button>
                <button class="filter-btn" onclick="filterHistory('wordle')">Wordle</button>
                <button class="filter-btn" onclick="filterHistory('check')">Чеки</button>
                <button class="filter-btn" onclick="filterHistory('withdrawal')">Выводы</button>
            </div>
            
            <div class="history-list" id="historyList">
                ${renderHistoryItems(history)}
            </div>
            
            <div class="form-actions">
                <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = fullHtml;
}

function renderHistoryItems(history) {
    if (history.length === 0) {
        return '<p class="no-history">История пуста</p>';
    }
    
    return history.map(item => {
        const amountClass = item.amount.startsWith('+') ? 'positive' : 'negative';
        
        let icon = '📝';
        if (item.type === 'wordle') icon = '🎮';
        if (item.type === 'check') icon = '🧾';
        if (item.type === 'withdrawal') icon = '💸';
        
        return `
            <div class="history-item" data-type="${item.type}">
                <div class="history-icon">${icon}</div>
                <div class="history-content">
                    <div class="history-type">${getTypeName(item.type)}</div>
                    <div class="history-desc">${item.description}</div>
                </div>
                <div class="history-amount ${amountClass}">${item.amount}₽</div>
                <div class="history-date">${item.date} ${item.time}</div>
            </div>
        `;
    }).join('');
}

function getTypeName(type) {
    const types = {
        'wordle': 'Wordle',
        'check': 'Чек',
        'withdrawal': 'Вывод',
        'penalty': 'Штраф'
    };
    return types[type] || type;
}

function filterHistory(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        if (type === 'all' || item.dataset.type === type) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ============================================
// ВЫВОД
// ============================================

async function showWithdraw() {
    // Сразу показываем с текущими данными
    const availableMethods = [];
    if (currentUser?.card) availableMethods.push({ id: 'card', name: 'Карта', icon: '💳', details: currentUser.card });
    if (currentUser?.phone) availableMethods.push({ id: 'phone', name: 'Телефон', icon: '📱', details: currentUser.phone });
    if (currentUser?.steam) availableMethods.push({ id: 'steam', name: 'Steam', icon: '🎮', details: currentUser.steam });
    
    const html = `
        <div class="withdraw-container glass">
            <h2 class="form-title">💸 Вывод средств</h2>
            
            <div class="balance-info">
                <span class="balance-info-label">Доступно для вывода</span>
                <span class="balance-info-value">${currentUser?.balance?.toFixed(2) || '0.00'}₽</span>
            </div>
            
            ${currentUser?.balance < 20 ? `
                <div class="warning-message">
                    ⚠️ Минимальная сумма вывода: 20₽
                </div>
            ` : availableMethods.length === 0 ? `
                <div class="warning-message">
                    ⚠️ Добавьте реквизиты в профиле
                </div>
            ` : `
                <div class="form-group">
                    <label>Способ вывода</label>
                    <div class="withdraw-methods">
                        ${availableMethods.map(method => `
                            <div class="method-card" onclick="selectWithdrawMethod('${method.id}')">
                                <div class="method-icon">${method.icon}</div>
                                <div class="method-name">${method.name}</div>
                                <div class="method-detail">${method.details}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Сумма вывода (мин. 20₽)</label>
                    <input type="number" id="withdrawAmount" min="20" max="${currentUser.balance}" step="0.01" placeholder="Введите сумму">
                </div>
                
                <div class="form-actions">
                    <button class="submit-btn" onclick="submitWithdraw()" id="withdrawSubmit">Вывести</button>
                    <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
                </div>
            `}
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
    
    // Обновляем данные в фоне
    const userResult = await callAppsScript('getUser', { token: currentUser.token }, true, 30000);
    
    if (userResult && userResult.success) {
        currentUser = userResult.user;
        showWithdraw(); // Перерисовываем
    }
}

function selectWithdrawMethod(methodId) {
    selectedMethod = methodId;
    document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.method-card').classList.add('active');
}

async function submitWithdraw() {
    if (!selectedMethod) {
        showNotification('Выберите способ вывода', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if (isNaN(amount) || amount < 20) {
        showNotification('Минимальная сумма вывода 20₽', 'error');
        return;
    }
    
    if (amount > currentUser.balance) {
        showNotification('Недостаточно средств', 'error');
        return;
    }
    
    let details = '';
    if (selectedMethod === 'card') details = currentUser.card;
    if (selectedMethod === 'phone') details = currentUser.phone;
    if (selectedMethod === 'steam') details = currentUser.steam;
    
    const result = await callAppsScript('addWithdrawal', {
        token: currentUser.token,
        nickname: currentUser.nickname,
        amount: amount.toString(),
        method: selectedMethod,
        details: details
    });
    
    if (result && result.success) {
        showNotification('Заявка на вывод создана!', 'success');
        showMainMenu();
    }
}

// ============================================
// АДМИН ПАНЕЛЬ (РАБОЧАЯ!)
// ============================================

async function showAdminPanel() {
    // Проверяем права
    const adminCheck = await callAppsScript('checkAdmin', { token: currentUser.token });
    
    if (!adminCheck || !adminCheck.success || !adminCheck.isAdmin) {
        showNotification('У вас нет прав администратора', 'error');
        return;
    }
    
    // Загружаем данные
    showLoading(true);
    
    try {
        // Загружаем всех пользователей
        const usersResult = await callAppsScript('getAllUsers', { token: currentUser.token });
        
        // Загружаем чеки
        const checksResult = await callAppsScript('getAllChecks', { token: currentUser.token });
        
        // Загружаем выводы
        const withdrawalsResult = await callAppsScript('getAllWithdrawals', { token: currentUser.token });
        
        // Загружаем статистику
        const statsResult = await callAppsScript('getStats', { token: currentUser.token });
        
        const html = `
            <div class="admin-container glass">
                <h2 class="form-title">👑 Админ панель</h2>
                
                <div class="admin-tabs">
                    <button class="tab-btn active" onclick="showAdminTab('users')">Пользователи</button>
                    <button class="tab-btn" onclick="showAdminTab('checks')">Чеки</button>
                    <button class="tab-btn" onclick="showAdminTab('withdrawals')">Выводы</button>
                    <button class="tab-btn" onclick="showAdminTab('stats')">Статистика</button>
                </div>
                
                <div class="admin-content" id="adminContent">
                    ${renderAdminUsers(usersResult?.users || [])}
                </div>
                
                <div class="form-actions">
                    <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = html;
        
        // Сохраняем данные для переключения вкладок
        window.adminData = {
            users: usersResult?.users || [],
            checks: checksResult?.checks || [],
            withdrawals: withdrawalsResult?.withdrawals || [],
            stats: statsResult?.stats || {}
        };
        
    } catch (error) {
        console.error('Admin error:', error);
        showNotification('Ошибка загрузки админ панели', 'error');
    } finally {
        showLoading(false);
    }
}

function renderAdminUsers(users) {
    if (!users || users.length === 0) {
        return '<p>Нет пользователей</p>';
    }
    
    return `
        <div class="admin-section">
            <h3>📋 Пользователи (${users.length})</h3>
            <div class="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Токен</th>
                            <th>Никнейм</th>
                            <th>Баланс</th>
                            <th>Карта</th>
                            <th>Телефон</th>
                            <th>Steam</th>
                            <th>Регистрация</th>
                            <th>Последний вход</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user[0]}</td>
                                <td>${user[1]}</td>
                                <td>${user[2]}₽</td>
                                <td>${user[3] || '-'}</td>
                                <td>${user[4] || '-'}</td>
                                <td>${user[5] || '-'}</td>
                                <td>${user[6]}</td>
                                <td>${user[7]}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAdminChecks(checks) {
    if (!checks || checks.length === 0) {
        return '<p>Нет чеков</p>';
    }
    
    return `
        <div class="admin-section">
            <h3>🧾 Чеки (${checks.length})</h3>
            <div class="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Токен</th>
                            <th>Никнейм</th>
                            <th>Магазин</th>
                            <th>Фото</th>
                            <th>Дата</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${checks.map(check => `
                            <tr>
                                <td>${check[0]}</td>
                                <td>${check[1]}</td>
                                <td>${check[2]}</td>
                                <td>${check[3]}</td>
                                <td><a href="${check[5]}" target="_blank">📸</a></td>
                                <td>${check[6]} ${check[7]}</td>
                                <td>${check[8]}</td>
                                <td>
                                    <button class="small-btn" onclick="approveCheck('${check[0]}')">✅</button>
                                    <button class="small-btn" onclick="rejectCheck('${check[0]}')">❌</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAdminWithdrawals(withdrawals) {
    if (!withdrawals || withdrawals.length === 0) {
        return '<p>Нет заявок на вывод</p>';
    }
    
    return `
        <div class="admin-section">
            <h3>💸 Заявки на вывод (${withdrawals.length})</h3>
            <div class="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Токен</th>
                            <th>Никнейм</th>
                            <th>Сумма</th>
                            <th>Способ</th>
                            <th>Реквизиты</th>
                            <th>Дата</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${withdrawals.map(w => `
                            <tr>
                                <td>${w[0]}</td>
                                <td>${w[1]}</td>
                                <td>${w[2]}</td>
                                <td>${w[3]}₽</td>
                                <td>${w[4]}</td>
                                <td>${w[5]}</td>
                                <td>${w[6]}</td>
                                <td>${w[7]}</td>
                                <td>
                                    <button class="small-btn" onclick="approveWithdrawal('${w[0]}')">✅</button>
                                    <button class="small-btn" onclick="rejectWithdrawal('${w[0]}')">❌</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderAdminStats(stats) {
    return `
        <div class="admin-section">
            <h3>📊 Статистика</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalUsers || 0}</div>
                    <div class="stat-label">Всего пользователей</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalBalance || 0}₽</div>
                    <div class="stat-label">Общий баланс</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalChecks || 0}</div>
                    <div class="stat-label">Всего чеков</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.pendingChecks || 0}</div>
                    <div class="stat-label">Ожидают проверки</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalWithdrawals || 0}</div>
                    <div class="stat-label">Всего выводов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.pendingWithdrawals || 0}₽</div>
                    <div class="stat-label">Ожидают вывода</div>
                </div>
            </div>
        </div>
    `;
}

function showAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let content = '';
    
    switch(tab) {
        case 'users':
            content = renderAdminUsers(window.adminData.users);
            break;
        case 'checks':
            content = renderAdminChecks(window.adminData.checks);
            break;
        case 'withdrawals':
            content = renderAdminWithdrawals(window.adminData.withdrawals);
            break;
        case 'stats':
            content = renderAdminStats(window.adminData.stats);
            break;
    }
    
    document.getElementById('adminContent').innerHTML = content;
}

async function approveCheck(checkId) {
    const result = await callAppsScript('approveCheck', {
        token: currentUser.token,
        checkId: checkId
    });
    
    if (result && result.success) {
        showNotification('Чек одобрен!', 'success');
        showAdminPanel(); // Обновляем
    }
}

async function rejectCheck(checkId) {
    const result = await callAppsScript('rejectCheck', {
        token: currentUser.token,
        checkId: checkId
    });
    
    if (result && result.success) {
        showNotification('Чек отклонен', 'info');
        showAdminPanel(); // Обновляем
    }
}

async function approveWithdrawal(withdrawalId) {
    const result = await callAppsScript('approveWithdrawal', {
        token: currentUser.token,
        withdrawalId: withdrawalId
    });
    
    if (result && result.success) {
        showNotification('Вывод одобрен!', 'success');
        showAdminPanel(); // Обновляем
    }
}

async function rejectWithdrawal(withdrawalId) {
    const result = await callAppsScript('rejectWithdrawal', {
        token: currentUser.token,
        withdrawalId: withdrawalId
    });
    
    if (result && result.success) {
        showNotification('Вывод отклонен', 'info');
        showAdminPanel(); // Обновляем
    }
}

// ============================================
// МОДАЛЬНОЕ ОКНО И УВЕДОМЛЕНИЯ
// ============================================

function showModal(content) {
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function toggleMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const panel = document.getElementById('userPanel');
    btn.classList.toggle('active');
    panel.classList.toggle('show');
}

function showLoading(show) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">✕</button>
    `;
    
    container.appendChild(notification);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

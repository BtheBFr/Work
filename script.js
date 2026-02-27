// Глобальные переменные
let currentUser = null;
let currentWordleGame = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initCursorGlow();
    checkSavedSession();
});

// Инициализация приложения
function initApp() {
    // Кнопки авторизации
    document.getElementById('showLoginBtn')?.addEventListener('click', showLoginForm);
    document.getElementById('showRegisterBtn')?.addEventListener('click', showRegisterForm);
    
    // Кнопки пользователя
    document.getElementById('btnProfile')?.addEventListener('click', showProfile);
    document.getElementById('btnHistory')?.addEventListener('click', showHistory);
    document.getElementById('btnWithdraw')?.addEventListener('click', showWithdraw);
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
    
    document.addEventListener('mousemove', (e) => {
        glow.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    });
}

// Проверка сохраненной сессии
function checkSavedSession() {
    const savedToken = localStorage.getItem('userToken');
    if (savedToken) {
        loginWithToken(savedToken);
    }
}

// Показать уведомление
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

// Показать модальное окно
function showModal(content) {
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').style.display = 'flex';
}

// Скрыть модальное окно
function hideModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

// Переключить мобильное меню
function toggleMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const panel = document.getElementById('userPanel');
    btn.classList.toggle('active');
    panel.classList.toggle('show');
}

// Показать форму входа
function showLoginForm() {
    const form = `
        <div class="form-container">
            <h2 class="form-title">🔐 Вход</h2>
            <form onsubmit="event.preventDefault(); loginWithToken(document.getElementById('loginToken').value);">
                <div class="form-group">
                    <label>Токен</label>
                    <input type="text" id="loginToken" placeholder="Введите ваш токен" required>
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
}

// Показать форму регистрации
function showRegisterForm() {
    const form = `
        <div class="form-container">
            <h2 class="form-title">📝 Регистрация</h2>
            <form onsubmit="event.preventDefault(); registerUser()">
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

// Регистрация пользователя
async function registerUser() {
    const token = document.getElementById('regToken').value;
    const nickname = document.getElementById('regNickname').value;
    const card = document.getElementById('regCard').value;
    const phone = document.getElementById('regPhone').value;
    const steam = document.getElementById('regSteam').value;
    
    // Проверка на минимум одно поле
    if (!card && !phone && !steam) {
        showNotification('Заполните хотя бы одно поле для вывода', 'error');
        return;
    }
    
    try {
        // Проверяем токен в таблице
        const tokenCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'tokens!A:B'
        });
        
        const tokens = tokenCheck.result.values || [];
        const foundToken = tokens.find(row => row[0] === token && row[1] === 'свободен');
        
        if (!foundToken) {
            showNotification('Токен не найден или уже использован', 'error');
            return;
        }
        
        // Создаем пользователя
        const now = new Date().toLocaleDateString('ru-RU');
        
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'users!A:I',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    token,
                    nickname,
                    '0',
                    card || '',
                    phone || '',
                    steam || '',
                    now,
                    now,
                    ''
                ]]
            }
        });
        
        // Обновляем статус токена
        const tokenRowIndex = tokens.findIndex(row => row[0] === token) + 1;
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `tokens!B${tokenRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['занят']]
            }
        });
        
        showNotification('Регистрация успешна!', 'success');
        hideModal();
        
        // Автоматический вход
        loginWithToken(token);
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Ошибка регистрации', 'error');
    }
}

// Вход по токену
async function loginWithToken(token) {
    try {
        // Ищем пользователя
        const userCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'users!A:I'
        });
        
        const users = userCheck.result.values || [];
        const user = users.find(row => row[0] === token);
        
        if (!user) {
            showNotification('Пользователь не найден', 'error');
            return;
        }
        
        // Сохраняем сессию
        currentUser = {
            token: user[0],
            nickname: user[1],
            balance: parseFloat(user[2]) || 0,
            card: user[3],
            phone: user[4],
            steam: user[5],
            regDate: user[6],
            lastLogin: user[7],
            dailyWord: user[8]
        };
        
        localStorage.setItem('userToken', token);
        
        // Обновляем lastLogin
        const now = new Date().toLocaleDateString('ru-RU');
        const userRowIndex = users.findIndex(row => row[0] === token) + 1;
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `users!H${userRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[now]]
            }
        });
        
        // Показываем интерфейс пользователя
        showUserInterface();
        
        // Проверяем админ токен
        if (token === CONFIG.adminToken) {
            showAdminButton();
        }
        
        showNotification(`Добро пожаловать, ${currentUser.nickname}!`, 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка входа', 'error');
    }
}

// Показать интерфейс пользователя
function showUserInterface() {
    document.querySelector('.welcome-screen').style.display = 'none';
    document.getElementById('userPanel').style.display = 'flex';
    document.getElementById('tokenBadge').querySelector('.token-value').textContent = currentUser.token;
    
    // Показываем главное меню
    showMainMenu();
}

// Показать главное меню
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

// Загрузить Wordle
async function loadWordle() {
    // Проверяем, есть ли уже слово на сегодня
    const today = new Date().toLocaleDateString('ru-RU');
    
    try {
        const wordsCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'daily_words!A:H'
        });
        
        const words = wordsCheck.result.values || [];
        
        // Ищем слово для пользователя на сегодня
        let userWord = words.find(row => 
            row[0] === today && 
            row[2] === currentUser.token
        );
        
        if (!userWord) {
            // Ищем свободное слово на сегодня
            const freeWord = words.find(row => 
                row[0] === today && 
                (!row[2] || row[2] === '') && 
                row[3] === 'свободно'
            );
            
            if (freeWord) {
                // Назначаем слово пользователю
                const wordRowIndex = words.findIndex(row => 
                    row[0] === today && 
                    row[1] === freeWord[1]
                ) + 1;
                
                await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: CONFIG.spreadsheetId,
                    range: `daily_words!C${wordRowIndex}:D${wordRowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[currentUser.token, 'играет']]
                    }
                });
                
                userWord = [today, freeWord[1], currentUser.token, 'играет', '', '', '', ''];
                
                // Обновляем daily_word у пользователя
                await updateUserDailyWord(currentUser.token, freeWord[1]);
            } else {
                showNotification('На сегодня нет свободных слов', 'error');
                return;
            }
        }
        
        // Загружаем игру
        currentWordleGame = {
            word: userWord[1],
            status: userWord[3],
            attempts: userWord[4] ? JSON.parse(userWord[4]) : [],
            guesses: userWord[5] ? userWord[5].split(',') : []
        };
        
        renderWordle();
        
    } catch (error) {
        console.error('Wordle load error:', error);
        showNotification('Ошибка загрузки Wordle', 'error');
    }
}

// Отрендерить Wordle
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
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
    
    if (currentWordleGame.status !== 'отгадано' && currentWordleGame.attempts.length < 6) {
        initWordleKeyboard();
    }
}

// Отрендерить сетку Wordle
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
                // Текущая попытка
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

// Отрендерить клавиатуру
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
            
            // Добавляем классы для использованных букв
            if (currentWordleGame.letterStatus && currentWordleGame.letterStatus[key]) {
                keyClass += ` ${currentWordleGame.letterStatus[key]}`;
            }
            
            keyboard += `<button class="${keyClass}" onclick="handleKeyPress('${key}')">${key}</button>`;
        });
        keyboard += '</div>';
    });
    
    return keyboard;
}

// Инициализация клавиатуры Wordle
function initWordleKeyboard() {
    currentWordleGame.currentGuess = [];
    currentWordleGame.letterStatus = {};
    
    // Загружаем статусы букв из попыток
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

// Обработка нажатия клавиши
async function handleKeyPress(key) {
    if (currentWordleGame.status === 'отгадано' || currentWordleGame.attempts.length >= 6) {
        return;
    }
    
    if (key === '←') {
        // Удалить последнюю букву
        currentWordleGame.currentGuess.pop();
        renderWordle();
        return;
    }
    
    if (key === '↵') {
        // Отправить слово
        if (currentWordleGame.currentGuess.length === 5) {
            await submitWord();
        }
        return;
    }
    
    // Добавить букву
    if (currentWordleGame.currentGuess.length < 5) {
        currentWordleGame.currentGuess.push(key);
        renderWordle();
    }
}

// Отправить слово
async function submitWord() {
    const guess = currentWordleGame.currentGuess.join('');
    const target = currentWordleGame.word;
    
    // Проверяем результат
    const result = checkWord(guess, target);
    
    // Сохраняем попытку
    currentWordleGame.attempts.push(result);
    
    // Обновляем статусы букв
    result.forEach(({letter, status}) => {
        if (!currentWordleGame.letterStatus[letter] || 
            (status === 'correct' && currentWordleGame.letterStatus[letter] !== 'correct') ||
            (status === 'present' && currentWordleGame.letterStatus[letter] !== 'correct')) {
            currentWordleGame.letterStatus[letter] = status;
        }
    });
    
    // Проверяем победу
    const isWin = result.every(r => r.status === 'correct');
    
    if (isWin) {
        currentWordleGame.status = 'отгадано';
        
        // Начисляем награду
        await awardWordleWin();
    }
    
    // Очищаем текущую попытку
    currentWordleGame.currentGuess = [];
    
    // Сохраняем прогресс
    await saveWordleProgress();
    
    // Перерисовываем
    renderWordle();
}

// Проверка слова
function checkWord(guess, target) {
    const result = [];
    const targetChars = target.split('');
    const guessChars = guess.split('');
    
    // Сначала отмечаем правильные буквы
    for (let i = 0; i < 5; i++) {
        if (guessChars[i] === targetChars[i]) {
            result[i] = { letter: guessChars[i], status: 'correct' };
            targetChars[i] = null;
            guessChars[i] = null;
        }
    }
    
    // Затем отмечаем буквы не на своих местах
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

// Начисление награды за Wordle
async function awardWordleWin() {
    try {
        // Обновляем баланс
        const newBalance = currentUser.balance + 0.15;
        
        const userCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'users!A:I'
        });
        
        const users = userCheck.result.values || [];
        const userRowIndex = users.findIndex(row => row[0] === currentUser.token) + 1;
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `users!C${userRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newBalance.toString()]]
            }
        });
        
        // Добавляем в историю
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'history!A:H',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    Date.now(),
                    currentUser.token,
                    currentUser.nickname,
                    'wordle',
                    '+0.15',
                    new Date().toLocaleDateString('ru-RU'),
                    new Date().toLocaleTimeString('ru-RU'),
                    `Отгадал слово: ${currentWordleGame.word}`
                ]]
            }
        });
        
        currentUser.balance = newBalance;
        showNotification('+0.15₽ за слово!', 'success');
        
    } catch (error) {
        console.error('Award error:', error);
    }
}

// Сохранить прогресс Wordle
async function saveWordleProgress() {
    try {
        const wordsCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'daily_words!A:H'
        });
        
        const words = wordsCheck.result.values || [];
        const today = new Date().toLocaleDateString('ru-RU');
        
        const wordRowIndex = words.findIndex(row => 
            row[0] === today && 
            row[1] === currentWordleGame.word
        ) + 1;
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `daily_words!D${wordRowIndex}:G${wordRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    currentWordleGame.status,
                    JSON.stringify(currentWordleGame.attempts),
                    Object.keys(currentWordleGame.letterStatus || {}).join(','),
                    new Date().toLocaleString('ru-RU')
                ]]
            }
        });
        
    } catch (error) {
        console.error('Save progress error:', error);
    }
}

// Обновить daily_word у пользователя
async function updateUserDailyWord(token, word) {
    try {
        const userCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'users!A:I'
        });
        
        const users = userCheck.result.values || [];
        const userRowIndex = users.findIndex(row => row[0] === token) + 1;
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: `users!I${userRowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[word]]
            }
        });
        
    } catch (error) {
        console.error('Update user word error:', error);
    }
}

// Загрузить раздел "Чек"
function loadCheck() {
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
    
    // Drag and drop
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

// Выбор магазина
let selectedShop = null;
let selectedFile = null;

function selectShop(shop) {
    selectedShop = shop;
    document.querySelectorAll('.shop-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.target.closest('.shop-card').classList.add('selected');
    
    updateUploadButton();
}

// Обработка выбора файла
function handleFileSelect(file) {
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        
        // Показываем превью
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

// Обновление кнопки загрузки
function updateUploadButton() {
    const btn = document.getElementById('uploadBtn');
    if (btn) {
        btn.disabled = !(selectedShop && selectedFile);
    }
}

// Загрузка чека
async function uploadCheck() {
    if (!selectedShop || !selectedFile) {
        showNotification('Выберите магазин и файл', 'error');
        return;
    }
    
    try {
        showNotification('Загрузка...', 'info');
        
        // TODO: Загрузка фото на Google Drive
        // Пока просто имитируем
        
        // Сохраняем в таблицу
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'checks!A:J',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    Date.now(),
                    currentUser.token,
                    currentUser.nickname,
                    selectedShop,
                    'temp_id',
                    'temp_url',
                    new Date().toLocaleDateString('ru-RU'),
                    new Date().toLocaleTimeString('ru-RU'),
                    'ожидание',
                    ''
                ]]
            }
        });
        
        showNotification('Чек отправлен на проверку!', 'success');
        showMainMenu();
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Ошибка загрузки', 'error');
    }
}

// Показать профиль
function showProfile() {
    const html = `
        <div class="profile-container glass">
            <div class="profile-header">
                <div class="profile-avatar">
                    ${currentUser.nickname[0].toUpperCase()}
                </div>
                <div class="profile-info">
                    <h3>${currentUser.nickname}</h3>
                    <p>Токен: ${currentUser.token}</p>
                </div>
            </div>
            
            <div class="balance-card">
                <span class="balance-label">Баланс</span>
                <span class="balance-value">${currentUser.balance.toFixed(2)}₽</span>
            </div>
            
            <div class="requisites-section">
                <h3 class="section-title">Мои реквизиты</h3>
                <div class="requisites-grid">
                    <div class="requisite-card" onclick="editRequisite('card')">
                        <div class="requisite-icon">💳</div>
                        <div class="requisite-type">Карта</div>
                        <div class="requisite-value">${currentUser.card || 'Не указана'}</div>
                    </div>
                    
                    <div class="requisite-card" onclick="editRequisite('phone')">
                        <div class="requisite-icon">📱</div>
                        <div class="requisite-type">Телефон</div>
                        <div class="requisite-value">${currentUser.phone || 'Не указан'}</div>
                    </div>
                    
                    <div class="requisite-card" onclick="editRequisite('steam')">
                        <div class="requisite-icon">🎮</div>
                        <div class="requisite-type">Steam</div>
                        <div class="requisite-value">${currentUser.steam || 'Не указан'}</div>
                    </div>
                    
                    <div class="requisite-card requisite-add" onclick="addRequisite()">
                        <div class="requisite-icon">➕</div>
                        <div class="requisite-type">Добавить</div>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
            </div>
        </div>
    `;
    
    document.getElementById('mainContent').innerHTML = html;
}

// Показать историю
async function showHistory() {
    try {
        const historyCheck = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'history!A:H'
        });
        
        const history = historyCheck.result.values || [];
        const userHistory = history
            .filter(row => row[1] === currentUser.token)
            .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
        
        const html = `
            <div class="history-container glass">
                <h2 class="form-title">📜 История операций</h2>
                
                <div class="history-filters">
                    <button class="filter-btn active" onclick="filterHistory('all')">Все</button>
                    <button class="filter-btn" onclick="filterHistory('wordle')">Wordle</button>
                    <button class="filter-btn" onclick="filterHistory('check')">Чеки</button>
                    <button class="filter-btn" onclick="filterHistory('withdrawal')">Выводы</button>
                </div>
                
                <div class="history-list" id="historyList">
                    ${renderHistoryItems(userHistory)}
                </div>
                
                <div class="form-actions">
                    <button class="cancel-btn" onclick="showMainMenu()">Назад</button>
                </div>
            </div>
        `;
        
        document.getElementById('mainContent').innerHTML = html;
        
    } catch (error) {
        console.error('History error:', error);
        showNotification('Ошибка загрузки истории', 'error');
    }
}

// Отрендерить элементы истории
function renderHistoryItems(history) {
    if (history.length === 0) {
        return '<p class="no-history">История пуста</p>';
    }
    
    return history.map(row => {
        const [id, token, nickname, type, amount, date, time, desc] = row;
        const amountClass = amount.startsWith('+') ? 'positive' : 'negative';
        
        let icon = '📝';
        if (type === 'wordle') icon = '🎮';
        if (type === 'check') icon = '🧾';
        if (type === 'withdrawal') icon = '💸';
        
        return `
            <div class="history-item" data-type="${type}">
                <div class="history-icon">${icon}</div>
                <div class="history-content">
                    <div class="history-type">${getTypeName(type)}</div>
                    <div class="history-desc">${desc}</div>
                </div>
                <div class="history-amount ${amountClass}">${amount}₽</div>
                <div class="history-date">${date} ${time}</div>
            </div>
        `;
    }).join('');
}

// Получить название типа
function getTypeName(type) {
    const types = {
        'wordle': 'Wordle',
        'check': 'Чек',
        'withdrawal': 'Вывод',
        'penalty': 'Штраф'
    };
    return types[type] || type;
}

// Фильтр истории
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

// Показать вывод средств
async function showWithdraw() {
    // Проверяем, есть ли активные выводы
    const withdrawalsCheck = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: CONFIG.spreadsheetId,
        range: 'withdrawals!A:H'
    });
    
    const withdrawals = withdrawalsCheck.result.values || [];
    const hasPending = withdrawals.some(row => 
        row[1] === currentUser.token && row[6] === 'ожидание'
    );
    
    // Доступные методы (только те, что есть у пользователя)
    const availableMethods = [];
    if (currentUser.card) availableMethods.push({ id: 'card', name: 'Карта', icon: '💳', details: currentUser.card });
    if (currentUser.phone) availableMethods.push({ id: 'phone', name: 'Телефон', icon: '📱', details: currentUser.phone });
    if (currentUser.steam) availableMethods.push({ id: 'steam', name: 'Steam', icon: '🎮', details: currentUser.steam });
    
    const html = `
        <div class="withdraw-container glass">
            <h2 class="form-title">💸 Вывод средств</h2>
            
            <div class="balance-info">
                <span class="balance-info-label">Доступно для вывода</span>
                <span class="balance-info-value">${currentUser.balance.toFixed(2)}₽</span>
            </div>
            
            ${hasPending ? `
                <div class="warning-message">
                    ⚠️ У вас есть активная заявка на вывод. Новую можно создать только после ее обработки.
                </div>
            ` : currentUser.balance < 20 ? `
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
}

// Выбор метода вывода
let selectedMethod = null;

function selectWithdrawMethod(methodId) {
    selectedMethod = methodId;
    document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.method-card').classList.add('active');
}

// Отправка заявки на вывод
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
    
    try {
        let details = '';
        if (selectedMethod === 'card') details = currentUser.card;
        if (selectedMethod === 'phone') details = currentUser.phone;
        if (selectedMethod === 'steam') details = currentUser.steam;
        
        // Создаем заявку
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'withdrawals!A:H',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    Date.now(),
                    currentUser.token,
                    currentUser.nickname,
                    amount.toString(),
                    selectedMethod,
                    details,
                    new Date().toLocaleDateString('ru-RU'),
                    'ожидание'
                ]]
            }
        });
        
        showNotification('Заявка на вывод создана!', 'success');
        showMainMenu();
        
    } catch (error) {
        console.error('Withdraw error:', error);
        showNotification('Ошибка создания заявки', 'error');
    }
}

// Показать кнопку админа
function showAdminButton() {
    // TODO: Добавить кнопку админ панели
}

// Выход
function logout() {
    currentUser = null;
    localStorage.removeItem('userToken');
    document.querySelector('.welcome-screen').style.display = 'flex';
    document.getElementById('userPanel').style.display = 'none';
    showMainMenu();
    showNotification('Вы вышли из аккаунта', 'info');
}

// Авторизация Google Sheets
function initGoogleSheets() {
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: CONFIG.apiKey,
            clientId: CONFIG.clientId,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            scope: 'https://www.googleapis.com/auth/spreadsheets'
        }).then(() => {
            console.log('Google Sheets API готов');
        });
    });
}

// Запускаем авторизацию
initGoogleSheets();

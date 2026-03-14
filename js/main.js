// === КОНФИГУРАЦИЯ ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTNV5Uc-T5EmqP5TeLyEcP0eApz_nlMMaj_psXFToniKLyS4-ZQwUMka_Fqtktj3wH/exec';
let currentUser = null;
let wordleState = {
    word: '',
    attempts: [],
    currentRow: 0,
    currentCol: 0,
    streak: 0
};

// === ЗАГРУЗКА ПРИ СТАРТЕ ===
document.addEventListener('DOMContentLoaded', () => {
    loadFromCache();
});

// === КЕШ ===
function loadFromCache() {
    const saved = localStorage.getItem('work_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('authModal').classList.remove('active');
        document.getElementById('mainSite').style.display = 'block';
        updateUI();
    }
}

function saveToCache() {
    if (currentUser) {
        localStorage.setItem('work_user', JSON.stringify(currentUser));
    }
}

// === АВТОРИЗАЦИЯ ===
function showRegister() {
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
}

async function register() {
    const token = document.getElementById('regToken').value;
    if (!token) {
        alert('Введите токен');
        return;
    }

    try {
        const response = await fetch(`${SCRIPT_URL}?action=checkToken&token=${token}`);
        const data = await response.json();
        
        if (data.exists) {
            if (!data.used) {
                currentUser = { token, name: data.name };
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('requisitesForm').style.display = 'block';
            } else {
                // Вход
                await loginUser(token);
            }
        } else {
            alert('Токен не найден');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function login() {
    const token = document.getElementById('loginToken').value;
    await loginUser(token);
}

async function loginUser(token) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${token}`);
        const data = await response.json();
        
        if (data.success) {
            currentUser = data;
            saveToCache();
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            updateUI();
            
            if (data.isAdmin) {
                document.getElementById('adminBtn').style.display = 'block';
            }
        } else {
            alert('Ошибка входа');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function saveRequisites() {
    const requisites = {
        phone: document.getElementById('phone').value,
        card: document.getElementById('card').value,
        steam: document.getElementById('steam').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                token: currentUser.token,
                requisites
            })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            currentUser = { ...currentUser, ...requisites };
            saveToCache();
            updateUI();
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

// === ПРОФИЛЬ ===
function showProfile() {
    document.getElementById('profileName').textContent = currentUser.name || '';
    document.getElementById('profileBalance').textContent = currentUser.balance || 0;
    document.getElementById('profileClicks').textContent = currentUser.clicks || 0;
    document.getElementById('profileEarned').textContent = currentUser.earnedFromLinks || 0;
    document.getElementById('tokenVisible').textContent = currentUser.token;
    
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileCard').value = currentUser.card || '';
    document.getElementById('profileSteam').value = currentUser.steam || '';
    
    document.getElementById('profileModal').classList.add('active');
}

function showToken() {
    document.getElementById('tokenHidden').style.display = 'none';
    document.getElementById('tokenVisible').style.display = 'inline';
}

function closeProfile() {
    document.getElementById('profileModal').classList.remove('active');
}

async function updateRequisites() {
    const requisites = {
        phone: document.getElementById('profilePhone').value,
        card: document.getElementById('profileCard').value,
        steam: document.getElementById('profileSteam').value
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateRequisites',
                token: currentUser.token,
                requisites
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = { ...currentUser, ...requisites };
            saveToCache();
            alert('Реквизиты обновлены');
            closeProfile();
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

// === ВЫВОД ===
function showWithdraw() {
    document.getElementById('withdrawModal').classList.add('active');
}

function closeWithdraw() {
    document.getElementById('withdrawModal').classList.remove('active');
}

async function withdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const type = document.getElementById('withdrawType').value;
    const code = document.getElementById('secretCode').value;

    if (!amount || amount < 20) {
        alert('Минимальная сумма 20 ₽');
        return;
    }

    if (!code) {
        alert('Введите секретный код');
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'requestWithdraw',
                token: currentUser.token,
                withdrawData: { amount, requisitType: type, secretCode: code }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Заявка создана');
            closeWithdraw();
            // Обновляем баланс
            const userData = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
            currentUser = await userData.json();
            saveToCache();
        } else {
            alert(data.error);
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

// === WORDLE ===
async function playWordle() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getWordle&token=${currentUser.token}`);
        const data = await response.json();
        
        if (data.success) {
            wordleState.word = data.word;
            wordleState.attempts = data.attempts || [];
            wordleState.currentRow = wordleState.attempts.length;
            wordleState.currentCol = 0;
            
            renderWordle();
            document.getElementById('wordleModal').classList.add('active');
        } else {
            alert('Нет слов на сегодня');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

function renderWordle() {
    const gameDiv = document.getElementById('wordleGame');
    let html = '<div class="wordle-grid">';
    
    for (let i = 0; i < 6; i++) {
        html += '<div class="wordle-row">';
        for (let j = 0; j < 5; j++) {
            let cellClass = 'wordle-cell';
            let letter = '';
            
            if (i < wordleState.attempts.length) {
                const attempt = wordleState.attempts[i];
                letter = attempt[j] || '';
                
                if (letter) {
                    if (wordleState.word[j] === letter) {
                        cellClass += ' correct';
                    } else if (wordleState.word.includes(letter)) {
                        cellClass += ' present';
                    } else {
                        cellClass += ' absent';
                    }
                }
            } else if (i === wordleState.currentRow && j < wordleState.currentCol) {
                letter = wordleState.currentAttempt?.[j] || '';
            }
            
            html += `<div class="${cellClass}">${letter}</div>`;
        }
        html += '</div>';
    }
    html += '</div>';
    
    gameDiv.innerHTML = html;
    renderKeyboard();
}

function renderKeyboard() {
    const keys = 'йцукенгшщзхъфывапролджэячсмитьбю';
    let html = '';
    
    for (let key of keys) {
        html += `<button class="key" onclick="typeLetter('${key}')">${key}</button>`;
    }
    html += `<button class="key" onclick="deleteLetter()">⌫</button>`;
    html += `<button class="key" onclick="submitWord()">⏎</button>`;
    
    document.getElementById('wordleKeyboard').innerHTML = html;
}

function typeLetter(letter) {
    if (wordleState.currentCol < 5 && wordleState.currentRow < 6) {
        if (!wordleState.currentAttempt) {
            wordleState.currentAttempt = [];
        }
        wordleState.currentAttempt[wordleState.currentCol] = letter;
        wordleState.currentCol++;
        renderWordle();
    }
}

function deleteLetter() {
    if (wordleState.currentCol > 0) {
        wordleState.currentCol--;
        delete wordleState.currentAttempt[wordleState.currentCol];
        renderWordle();
    }
}

async function submitWord() {
    if (wordleState.currentCol === 5) {
        const word = wordleState.currentAttempt.join('');
        wordleState.attempts.push(word);
        
        if (word === wordleState.word) {
            // Победа
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveWordleProgress',
                    token: currentUser.token,
                    wordData: { status: 'win' }
                })
            });
            
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                currentUser.balance = (currentUser.balance || 0) + data.reward;
                saveToCache();
                closeWordle();
            }
        } else if (wordleState.attempts.length === 6) {
            // Поражение
            await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveWordleProgress',
                    token: currentUser.token,
                    wordData: { status: 'lose' }
                })
            });
            alert('Не угадали! Попробуйте завтра');
            closeWordle();
        } else {
            wordleState.currentRow++;
            wordleState.currentCol = 0;
            wordleState.currentAttempt = [];
            renderWordle();
        }
    }
}

function closeWordle() {
    document.getElementById('wordleModal').classList.remove('active');
}

// === ЧЕКИ ===
function uploadCheck() {
    document.getElementById('checkModal').classList.add('active');
}

function closeCheck() {
    document.getElementById('checkModal').classList.remove('active');
}

async function submitCheck() {
    const store = document.getElementById('checkStore').value;
    const date = document.getElementById('checkDate').value;
    const file = document.getElementById('checkPhoto').files[0];
    
    if (!file) {
        alert('Выберите фото чека');
        return;
    }
    
    if (!date) {
        alert('Выберите дату чека');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result.split(',')[1];
        
        const formData = new URLSearchParams();
        formData.append('action', 'uploadCheck');
        formData.append('token', currentUser.token);
        formData.append('store', store);
        formData.append('checkDate', date.split('-').reverse().join('.'));
        formData.append('fileData', base64);

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Чек отправлен на проверку');
                closeCheck();
            } else {
                alert(data.error);
            }
        } catch(e) {
            alert('Ошибка: ' + e);
        }
    };
    
    reader.readAsDataURL(file);
}

// === ССЫЛКИ ===
function showLinks() {
    document.getElementById('userLink').textContent = currentUser.link || 'ссылка не найдена';
    document.getElementById('linkClicks').textContent = currentUser.clicks || 0;
    document.getElementById('linkEarned').textContent = currentUser.earnedFromLinks || 0;
    document.getElementById('linksModal').classList.add('active');
}

function closeLinks() {
    document.getElementById('linksModal').classList.remove('active');
}

function copyLink() {
    navigator.clipboard.writeText(currentUser.link);
    alert('Ссылка скопирована!');
}

// === ИСТОРИЯ ===
async function showHistory() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getHistory&token=${currentUser.token}`);
        const data = await response.json();
        
        if (data.success) {
            let html = '';
            data.history.forEach(item => {
                let typeClass = '';
                if (item.type === 'withdraw') typeClass = 'withdraw';
                if (item.type === 'penalty') typeClass = 'penalty';
                
                html += `
                    <div class="history-item ${typeClass}">
                        <strong>${item.type}</strong> - ${item.amount} ₽<br>
                        <small>${item.date}</small><br>
                        <small>${item.details || ''}</small>
                    </div>
                `;
            });
            
            document.getElementById('historyList').innerHTML = html || 'История пуста';
            document.getElementById('historyModal').classList.add('active');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('active');
}

// === АДМИНКА ===
async function showAdmin() {
    document.getElementById('adminModal').classList.add('active');
    showAdminTab('users');
}

function closeAdmin() {
    document.getElementById('adminModal').classList.remove('active');
}

async function showAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    try {
        let data;
        if (tab === 'users') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetAllUsers&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '<table><tr><th>Токен</th><th>Имя</th><th>Баланс</th></tr>';
                data.users.forEach(user => {
                    html += `<tr>
                        <td>${user.token}</td>
                        <td>${user.name}</td>
                        <td>${user.balance} ₽</td>
                    </tr>`;
                });
                html += '</table>';
                document.getElementById('adminContent').innerHTML = html;
            }
        } else if (tab === 'withdrawals') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingWithdrawals&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '';
                data.withdrawals.forEach(w => {
                    html += `
                        <div class="history-item">
                            ${w.token} - ${w.amount} ₽ на ${w.type}<br>
                            <button onclick="approveWithdraw(${w.id})">✅ Одобрить</button>
                            <button onclick="rejectWithdraw(${w.id})">❌ Отклонить</button>
                        </div>
                    `;
                });
                document.getElementById('adminContent').innerHTML = html || 'Нет заявок';
            }
        } else if (tab === 'checks') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingChecks&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '';
                data.checks.forEach(c => {
                    html += `
                        <div class="history-item">
                            ${c.token} - ${c.store} (${c.checkDate})<br>
                            <a href="${c.photoUrl}" target="_blank">📸 Фото</a><br>
                            <input type="number" id="amount_${c.id}" placeholder="Сумма">
                            <button onclick="approveCheck(${c.id})">✅ Одобрить</button>
                            <button onclick="rejectCheck(${c.id})">❌ Отклонить</button>
                            <button onclick="penaltyCheck(${c.id})">⚠️ Штраф</button>
                        </div>
                    `;
                });
                document.getElementById('adminContent').innerHTML = html || 'Нет чеков';
            }
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function approveWithdraw(id) {
    if (!confirm('Одобрить вывод?')) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminApproveWithdraw',
                token: currentUser.token,
                withdrawId: id
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('withdrawals');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function rejectWithdraw(id) {
    if (!confirm('Отклонить вывод?')) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminRejectWithdraw',
                token: currentUser.token,
                withdrawId: id
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('withdrawals');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function approveCheck(id) {
    const amount = document.getElementById(`amount_${id}`).value;
    if (!amount) {
        alert('Введите сумму');
        return;
    }
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminApproveCheck',
                token: currentUser.token,
                checkId: id,
                amount: parseFloat(amount)
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function rejectCheck(id) {
    const reason = prompt('Причина отклонения:');
    if (!reason) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminRejectCheck',
                token: currentUser.token,
                checkId: id,
                reason
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function penaltyCheck(id) {
    if (!confirm('Выписать штраф 0.15 ₽?')) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminPenaltyCheck',
                token: currentUser.token,
                checkId: id
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

// === РЕКЛАМА ===
function openAd() {
    window.open('https://bthebfr.github.io/about/', '_blank');
}

// === ОБНОВЛЕНИЕ UI ===
function updateUI() {
    // Фоновое обновление данных
    setTimeout(async () => {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
            const data = await response.json();
            if (data.success) {
                currentUser = { ...currentUser, ...data };
                saveToCache();
            }
        } catch(e) {
            console.log('Ошибка обновления:', e);
        }
    }, 1000);
}

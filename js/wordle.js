// === WORDLE ===

let wordleState = {
    word: '',
    attempts: [],
    currentRow: 0,
    currentCol: 0,
    streak: 0,
    gameId: null,
    gameDate: null
};

// Загружаем слово заранее
async function preloadWordle() {
    if (!currentUser) return;
    
    try {
        const today = new Date().toDateString();
        const savedGame = localStorage.getItem(`wordle_${currentUser.token}_${today}`);
        
        if (savedGame) {
            wordleState = JSON.parse(savedGame);
            console.log('Загружена сохраненная игра:', wordleState);
            return;
        }
        
        const response = await fetch(`${SCRIPT_URL}?action=getWordle&token=${currentUser.token}`);
        const data = await response.json();
        
        if (data.success) {
            wordleState = {
                word: data.word,
                attempts: data.attempts || [],
                currentRow: data.attempts ? data.attempts.length : 0,
                currentCol: 0,
                streak: data.streak || 0,
                gameId: data.gameId,
                gameDate: today
            };
            
            localStorage.setItem(`wordle_${currentUser.token}_${today}`, JSON.stringify(wordleState));
            console.log('Загружено новое слово:', wordleState);
        }
    } catch(e) {
        console.log('Ошибка предзагрузки Wordle:', e);
    }
}

async function playWordle() {
    const today = new Date().toDateString();
    
    // Проверяем, не прошла ли полночь
    if (wordleState.gameDate && wordleState.gameDate !== today) {
        console.log('Новый день, сбрасываем игру');
        wordleState = {
            word: '',
            attempts: [],
            currentRow: 0,
            currentCol: 0,
            streak: wordleState.streak || 0, // Стрик сохраняется
            gameId: null,
            gameDate: today
        };
        localStorage.removeItem(`wordle_${currentUser.token}_${wordleState.gameDate}`);
    }
    
    // Проверяем, не закончена ли игра
    if (wordleState.attempts.length >= 6) {
        alert('Вы уже использовали все попытки сегодня');
        return;
    }
    
    if (wordleState.attempts.length > 0 && wordleState.attempts[wordleState.attempts.length - 1] === wordleState.word) {
        alert('Вы уже отгадали слово сегодня');
        return;
    }
    
    showLoader();
    try {
        // Если нет слова - загружаем
        if (!wordleState.word) {
            const response = await fetch(`${SCRIPT_URL}?action=getWordle&token=${currentUser.token}`);
            const data = await response.json();
            
            if (data.success) {
                wordleState.word = data.word;
                wordleState.attempts = data.attempts || [];
                wordleState.currentRow = data.attempts ? data.attempts.length : 0;
                wordleState.streak = data.streak || wordleState.streak;
                wordleState.gameId = data.gameId;
                wordleState.gameDate = today;
                
                localStorage.setItem(`wordle_${currentUser.token}_${today}`, JSON.stringify(wordleState));
                console.log('Загружено слово для игры:', wordleState);
            } else {
                alert('Нет слов на сегодня');
                hideLoader();
                return;
            }
        }
        
        renderWordle();
        document.getElementById('wordleModal').classList.add('active');
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
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
                    // Правильное сравнение букв
                    if (wordleState.word[j] === letter) {
                        cellClass += ' correct';
                    } else if (wordleState.word.includes(letter)) {
                        cellClass += ' present';
                    } else {
                        cellClass += ' absent';
                    }
                }
            } else if (i === wordleState.currentRow && wordleState.currentAttempt && j < wordleState.currentAttempt.length) {
                letter = wordleState.currentAttempt[j];
            }
            
            html += `<div class="${cellClass}">${letter}</div>`;
        }
        html += '</div>';
    }
    html += '</div>';
    
    let streakHtml = '';
    if (wordleState.streak > 0) {
        streakHtml = `<div class="streak-info">🔥 Стрик: ${wordleState.streak} ${wordleState.streak > 1 ? '(бонус +0.05)' : ''}</div>`;
    }
    
    gameDiv.innerHTML = html + streakHtml;
    renderKeyboard();
}

function renderKeyboard() {
    const rows = [
        ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
        ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
        ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
    ];
    
    let html = '<div class="keyboard-container">';
    
    rows.forEach((row, index) => {
        html += '<div class="keyboard-row">';
        row.forEach(key => {
            html += `<button class="key" onclick="typeLetter('${key}')">${key}</button>`;
        });
        html += '</div>';
    });
    
    // Отдельный ряд для управления
    html += '<div class="keyboard-row">';
    html += `<button class="key special" onclick="deleteLetter()" style="min-width: 80px;">⌫</button>`;
    html += `<button class="key special" onclick="submitWord()" style="min-width: 120px;">⏎ Ввод</button>`;
    html += '</div>';
    
    html += '</div>';
    
    document.getElementById('wordleKeyboard').innerHTML = html;
}

// Физическая клавиатура
document.addEventListener('keydown', function(e) {
    if (!document.getElementById('wordleModal').classList.contains('active')) return;
    
    const key = e.key.toLowerCase();
    
    if (/^[а-я]$/.test(key)) {
        typeLetter(key);
        e.preventDefault();
    } else if (e.key === 'Backspace') {
        deleteLetter();
        e.preventDefault();
    } else if (e.key === 'Enter') {
        submitWord();
        e.preventDefault();
    }
});

function typeLetter(letter) {
    // Проверяем, можно ли еще вводить
    if (wordleState.currentRow >= 6) return;
    if (wordleState.attempts.length >= 6) return;
    if (wordleState.attempts.length > 0 && wordleState.attempts[wordleState.attempts.length - 1] === wordleState.word) return;
    
    if (!wordleState.currentAttempt) {
        wordleState.currentAttempt = [];
    }
    
    if (wordleState.currentAttempt.length < 5) {
        wordleState.currentAttempt.push(letter);
        renderWordle();
    }
}

function deleteLetter() {
    if (wordleState.currentAttempt && wordleState.currentAttempt.length > 0) {
        wordleState.currentAttempt.pop();
        renderWordle();
    }
}

async function submitWord() {
    // Проверяем, можно ли отправить
    if (wordleState.currentRow >= 6) return;
    if (wordleState.attempts.length >= 6) return;
    if (wordleState.attempts.length > 0 && wordleState.attempts[wordleState.attempts.length - 1] === wordleState.word) return;
    
    if (!wordleState.currentAttempt || wordleState.currentAttempt.length !== 5) {
        alert('Введите слово из 5 букв');
        return;
    }
    
    const word = wordleState.currentAttempt.join('');
    
    // Добавляем попытку
    wordleState.attempts.push(word);
    wordleState.currentAttempt = [];
    wordleState.currentRow = wordleState.attempts.length;
    
    // Сохраняем в кеш
    localStorage.setItem(`wordle_${currentUser.token}_${new Date().toDateString()}`, JSON.stringify(wordleState));
    
    // Проверяем победу
    if (word === wordleState.word) {
        showLoader();
        try {
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
                const reward = data.reward || 0.15;
                const newStreak = (wordleState.streak || 0) + 1;
                alert(`🎉 Победа! +${reward} руб ${newStreak > 1 ? '(Стрик +0.05)' : ''}`);
                
                currentUser.balance = (currentUser.balance || 0) + reward;
                wordleState.streak = newStreak;
                saveToCache();
                
                // Обновляем данные
                const userResponse = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
                const userData = await userResponse.json();
                if (userData.success) {
                    currentUser = { ...currentUser, ...userData };
                    saveToCache();
                }
                
                closeWordle();
            }
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    } 
    // Проверяем поражение
    else if (wordleState.attempts.length >= 6) {
        showLoader();
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveWordleProgress',
                    token: currentUser.token,
                    wordData: { status: 'lose' }
                })
            });
            
            alert(`😔 Не угадали! Слово было: ${wordleState.word.toUpperCase()}`);
            wordleState.streak = 0;
            closeWordle();
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    } 
    // Продолжаем игру
    else {
        renderWordle();
    }
}

function closeWordle() {
    document.getElementById('wordleModal').classList.remove('active');
}

// Делаем функции глобальными
window.playWordle = playWordle;
window.typeLetter = typeLetter;
window.deleteLetter = deleteLetter;
window.submitWord = submitWord;
window.closeWordle = closeWordle;
window.preloadWordle = preloadWordle;

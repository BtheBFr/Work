// === WORDLE ===

let wordleState = {
    word: '',
    attempts: [],
    currentRow: 0,
    currentCol: 0,
    streak: 0,
    gameId: null
};

async function playWordle() {
    showLoader();
    try {
        // Проверяем, есть ли сохраненная игра в кеше
        const savedGame = localStorage.getItem(`wordle_${currentUser.token}_${new Date().toDateString()}`);
        
        if (savedGame) {
            wordleState = JSON.parse(savedGame);
            renderWordle();
            document.getElementById('wordleModal').classList.add('active');
            hideLoader();
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
                gameId: data.gameId
            };
            
            // Сохраняем в кеш
            localStorage.setItem(`wordle_${currentUser.token}_${new Date().toDateString()}`, JSON.stringify(wordleState));
            
            renderWordle();
            document.getElementById('wordleModal').classList.add('active');
        } else {
            alert('Нет слов на сегодня');
        }
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
    
    gameDiv.innerHTML = html;
    renderKeyboard();
}

function renderKeyboard() {
    // Исправленная клавиатура с рядами
    const keys = [
        ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
        ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
        ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
    ];
    
    let html = '<div class="keyboard-container">';
    
    keys.forEach(row => {
        html += '<div class="keyboard-row">';
        row.forEach(key => {
            html += `<button class="key" onclick="typeLetter('${key}')">${key}</button>`;
        });
        html += '</div>';
    });
    
    // Ряд с удалением и вводом
    html += '<div class="keyboard-row">';
    html += `<button class="key special" onclick="deleteLetter()">⌫</button>`;
    html += `<button class="key special" onclick="submitWord()">⏎</button>`;
    html += '</div>';
    
    html += '</div>';
    
    document.getElementById('wordleKeyboard').innerHTML = html;
}

// Обработка физической клавиатуры
document.addEventListener('keydown', function(e) {
    // Проверяем, открыто ли модальное окно Wordle
    if (!document.getElementById('wordleModal').classList.contains('active')) return;
    
    const key = e.key.toLowerCase();
    
    // Русские буквы
    if (/^[а-я]$/.test(key)) {
        typeLetter(key);
    }
    // Backspace
    else if (e.key === 'Backspace') {
        deleteLetter();
    }
    // Enter
    else if (e.key === 'Enter') {
        submitWord();
    }
});

function typeLetter(letter) {
    if (wordleState.currentRow >= 6) return;
    
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
    if (!wordleState.currentAttempt || wordleState.currentAttempt.length !== 5) {
        alert('Введите слово из 5 букв');
        return;
    }
    
    const word = wordleState.currentAttempt.join('');
    wordleState.attempts.push(word);
    
    // Сохраняем в кеш
    localStorage.setItem(`wordle_${currentUser.token}_${new Date().toDateString()}`, JSON.stringify(wordleState));
    
    if (word === wordleState.word) {
        // Победа
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
                alert(data.message);
                currentUser.balance = (currentUser.balance || 0) + data.reward;
                saveToCache();
                localStorage.removeItem(`wordle_${currentUser.token}_${new Date().toDateString()}`);
                closeWordle();
            }
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    } else if (wordleState.attempts.length === 6) {
        // Поражение
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
            alert('Не угадали! Попробуйте завтра');
            localStorage.removeItem(`wordle_${currentUser.token}_${new Date().toDateString()}`);
            closeWordle();
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    } else {
        wordleState.currentRow++;
        wordleState.currentAttempt = [];
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

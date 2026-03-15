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

// Загружаем слово заранее при старте
async function preloadWordle() {
    if (!currentUser) return;
    
    try {
        const savedGame = localStorage.getItem(`wordle_${currentUser.token}_${new Date().toDateString()}`);
        if (savedGame) {
            wordleState = JSON.parse(savedGame);
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
                gameDate: new Date().toDateString()
            };
            
            localStorage.setItem(`wordle_${currentUser.token}_${new Date().toDateString()}`, JSON.stringify(wordleState));
        }
    } catch(e) {
        console.log('Ошибка предзагрузки Wordle:', e);
    }
}

async function playWordle() {
    // Проверяем, не прошла ли полночь
    const today = new Date().toDateString();
    if (wordleState.gameDate !== today) {
        wordleState = {
            word: '',
            attempts: [],
            currentRow: 0,
            currentCol: 0,
            streak: 0,
            gameId: null,
            gameDate: today
        };
    }
    
    showLoader();
    try {
        if (!wordleState.word) {
            const response = await fetch(`${SCRIPT_URL}?action=getWordle&token=${currentUser.token}`);
            const data = await response.json();
            
            if (data.success) {
                wordleState.word = data.word;
                wordleState.attempts = data.attempts || [];
                wordleState.currentRow = data.attempts ? data.attempts.length : 0;
                wordleState.streak = data.streak || 0;
                wordleState.gameId = data.gameId;
                
                localStorage.setItem(`wordle_${currentUser.token}_${today}`, JSON.stringify(wordleState));
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
    
    // Добавляем информацию о стрике
    let streakHtml = '';
    if (wordleState.streak > 0) {
        streakHtml = `<div class="streak-info">🔥 Стрик: ${wordleState.streak} ${wordleState.streak > 1 ? '(бонус +0.05)' : ''}</div>`;
    }
    
    gameDiv.innerHTML = html + streakHtml;
    renderKeyboard();
}

function renderKeyboard() {
    const rows = [
        ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з'],
        ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
        ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
    ];
    
    let html = '<div class="keyboard-container">';
    
    rows.forEach((row, index) => {
        html += '<div class="keyboard-row">';
        row.forEach(key => {
            html += `<button class="key" onclick="typeLetter('${key}')">${key}</button>`;
        });
        if (index === 2) {
            html += `<button class="key special" onclick="deleteLetter()">⌫</button>`;
        }
        html += '</div>';
    });
    
    html += '<div class="keyboard-row">';
    html += `<button class="key special" onclick="submitWord()" style="min-width: 120px;">⏎ Ввод</button>`;
    html += '</div>';
    
    html += '</div>';
    
    document.getElementById('wordleKeyboard').innerHTML = html;
}

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
    if (wordleState.currentRow >= 6 || wordleState.attempts.length >= 6) return;
    
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
    
    // Проверяем, что слово из 5 букв
    if (word.length !== 5) {
        alert('Слово должно быть из 5 букв');
        return;
    }
    
    wordleState.attempts.push(word);
    wordleState.currentAttempt = [];
    wordleState.currentRow = wordleState.attempts.length;
    
    localStorage.setItem(`wordle_${currentUser.token}_${new Date().toDateString()}`, JSON.stringify(wordleState));
    
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
                localStorage.removeItem(`wordle_${currentUser.token}_${new Date().toDateString()}`);
                closeWordle();
            }
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    } else if (wordleState.attempts.length >= 6) {
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
            
            alert('😔 Не угадали! Попробуйте завтра');
            wordleState.streak = 0;
            localStorage.removeItem(`wordle_${currentUser.token}_${new Date().toDateString()}`);
            closeWordle();
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    } else {
        renderWordle();
    }
}

function closeWordle() {
    document.getElementById('wordleModal').classList.remove('active');
}

window.playWordle = playWordle;
window.typeLetter = typeLetter;
window.deleteLetter = deleteLetter;
window.submitWord = submitWord;
window.closeWordle = closeWordle;
window.preloadWordle = preloadWordle;

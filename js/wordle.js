// === WORDLE ===

let wordleState = {
    word: '',
    attempts: [],
    currentRow: 0,
    currentCol: 0,
    streak: 0
};

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

// === ВЫВОД ===

function showWithdraw() {
    const modal = document.getElementById('withdrawModal');
    const content = modal.querySelector('.modal-content');
    
    // Создаем красивый выбор реквизитов, если его нет
    if (!content.querySelector('.withdraw-options')) {
        const select = document.getElementById('withdrawType');
        select.style.display = 'none';
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'withdraw-options';
        
        const options = [
            { value: 'phone', icon: '📱', label: 'Телефон' },
            { value: 'card', icon: '💳', label: 'Банковская карта' },
            { value: 'steam', icon: '🎮', label: 'Steam' }
        ];
        
        options.forEach(opt => {
            const option = document.createElement('div');
            option.className = 'withdraw-option';
            if (opt.value === 'phone') option.classList.add('selected');
            option.innerHTML = `<i>${opt.icon}</i><span>${opt.label}</span>`;
            option.onclick = function() {
                document.querySelectorAll('.withdraw-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('withdrawType').value = opt.value;
            };
            optionsDiv.appendChild(option);
        });
        
        // Вставляем после заголовка
        const title = content.querySelector('h2');
        title.insertAdjacentElement('afterend', optionsDiv);
    }
    
    modal.classList.add('active');
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

    showLoader();
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
            // Обновляем данные пользователя
            const userResponse = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
            const userData = await userResponse.json();
            if (userData.success) {
                currentUser = { ...currentUser, ...userData };
                saveToCache();
            }
        } else {
            alert(data.error);
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

// Делаем функции глобальными
window.showWithdraw = showWithdraw;
window.closeWithdraw = closeWithdraw;
window.withdraw = withdraw;

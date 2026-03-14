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

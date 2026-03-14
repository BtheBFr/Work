// === ИСТОРИЯ ===

async function showHistory() {
    showLoader();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getHistory&token=${currentUser.token}`);
        const data = await response.json();
        
        if (data.success) {
            let html = '';
            data.history.forEach(item => {
                let typeClass = '';
                if (item.type === 'withdraw' || item.type === 'withdraw_approved') typeClass = 'withdraw';
                if (item.type === 'penalty') typeClass = 'penalty';
                
                const amountClass = item.amount > 0 ? 'positive' : 'negative';
                
                html += `
                    <div class="history-item ${typeClass}">
                        <div style="display: flex; justify-content: space-between;">
                            <strong>${item.type === 'wordle' ? '🎮 Wordle' : 
                                      item.type === 'check' ? '🧾 Чек' : 
                                      item.type === 'withdraw' ? '💸 Вывод' : 
                                      item.type === 'withdraw_approved' ? '✅ Вывод одобрен' : 
                                      item.type === 'penalty' ? '⚠️ Штраф' : item.type}</strong>
                            <strong style="color: ${item.amount > 0 ? '#4CAF50' : '#f44336'}">${item.amount} ₽</strong>
                        </div>
                        <small>${item.date}</small><br>
                        <small style="color: #888;">${item.details || ''}</small>
                    </div>
                `;
            });
            
            document.getElementById('historyList').innerHTML = html || '<p style="text-align:center; color:#888;">История пуста</p>';
            document.getElementById('historyModal').classList.add('active');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('active');
}

// Делаем функции глобальными
window.showHistory = showHistory;
window.closeHistory = closeHistory;

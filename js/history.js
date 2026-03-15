// === ИСТОРИЯ ===

async function showHistory() {
    showLoader();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getHistory&token=${currentUser.token}`);
        const data = await response.json();
        
        if (data.success) {
            let html = '<div class="history-list">';
            
            if (data.history.length === 0) {
                html += '<p style="text-align:center; color:#888;">История пуста</p>';
            } else {
                // Переворачиваем массив, чтобы новые были сверху
                const history = data.history.reverse();
                
                history.forEach(item => {
                    let typeClass = '';
                    let typeText = '';
                    
                    if (item.type === 'wordle') {
                        typeText = '🎮 Wordle';
                    } else if (item.type === 'check') {
                        typeText = '🧾 Чек';
                    } else if (item.type === 'check_approved') {
                        typeText = '✅ Чек одобрен';
                    } else if (item.type === 'withdraw') {
                        typeText = '💸 Заявка на вывод';
                        typeClass = 'withdraw';
                    } else if (item.type === 'withdraw_approved') {
                        typeText = '✅ Вывод одобрен';
                    } else if (item.type === 'withdraw_rejected') {
                        typeText = '❌ Вывод отклонен';
                    } else if (item.type === 'penalty') {
                        typeText = '⚠️ Штраф';
                        typeClass = 'penalty';
                    } else {
                        typeText = item.type;
                    }
                    
                    // Форматируем дату
                    let formattedDate = item.date;
                    if (item.date && item.date.includes('T')) {
                        const date = new Date(item.date);
                        formattedDate = date.toLocaleString('ru-RU');
                    }
                    
                    const amountClass = item.amount > 0 ? 'positive' : 'negative';
                    const amountColor = item.amount > 0 ? '#4CAF50' : '#f44336';
                    
                    html += `
                        <div class="history-item ${typeClass}">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>${typeText}</strong>
                                <strong style="color: ${amountColor}">${item.amount} ₽</strong>
                            </div>
                            <div class="date">${formattedDate}</div>
                            ${item.details ? `<small style="color: #888;">${item.details}</small>` : ''}
                        </div>
                    `;
                });
            }
            
            html += '</div>';
            document.getElementById('historyList').innerHTML = html;
            document.getElementById('historyModal').classList.add('active');
            
            // Скроллим вверх
            const historyList = document.querySelector('.history-list');
            if (historyList) {
                historyList.scrollTop = 0;
            }
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

window.showHistory = showHistory;
window.closeHistory = closeHistory;

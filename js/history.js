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
                // Сортируем по дате (новые сверху)
                const history = data.history.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                
                history.forEach(item => {
                    let typeClass = '';
                    let typeText = '';
                    
                    if (item.type === 'wordle') {
                        typeText = '🎮 Wordle';
                    } else if (item.type === 'check') {
                        typeText = '🧾 Чек отправлен';
                    } else if (item.type === 'check_approved') {
                        typeText = '✅ Чек одобрен';
                    } else if (item.type === 'check_rejected') {
                        typeText = '❌ Чек отклонен';
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
                    } else if (item.type === 'register') {
                        typeText = '📝 Регистрация';
                    } else {
                        typeText = item.type;
                    }
                    
                    let formattedDate = item.date;
                    if (item.date) {
                        const date = new Date(item.date);
                        if (!isNaN(date)) {
                            formattedDate = date.toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    }
                    
                    let details = item.details || '';
                    details = details.replace(/phone/g, 'телефон');
                    details = details.replace(/card/g, 'карту');
                    details = details.replace(/steam/g, 'Steam');
                    
                    const amountColor = item.amount > 0 ? '#4CAF50' : '#f44336';
                    
                    html += `
                        <div class="history-item ${typeClass}">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>${typeText}</strong>
                                <strong style="color: ${amountColor}">${item.amount} ₽</strong>
                            </div>
                            <div class="date">${formattedDate}</div>
                            ${details ? `<small style="color: #888;">${details}</small>` : ''}
                        </div>
                    `;
                });
            }
            
            html += '</div>';
            document.getElementById('historyList').innerHTML = html;
            document.getElementById('historyModal').classList.add('active');
            
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

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

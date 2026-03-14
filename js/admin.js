// === АДМИНКА ===

async function showAdmin() {
    document.getElementById('adminModal').classList.add('active');
    showAdminTab('users');
}

function closeAdmin() {
    document.getElementById('adminModal').classList.remove('active');
}

async function showAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    try {
        let data;
        if (tab === 'users') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetAllUsers&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '<table><tr><th>Токен</th><th>Имя</th><th>Баланс</th></tr>';
                data.users.forEach(user => {
                    html += `<tr>
                        <td>${user.token}</td>
                        <td>${user.name}</td>
                        <td>${user.balance} ₽</td>
                    </tr>`;
                });
                html += '</table>';
                document.getElementById('adminContent').innerHTML = html;
            }
        } else if (tab === 'withdrawals') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingWithdrawals&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '';
                data.withdrawals.forEach(w => {
                    html += `
                        <div class="history-item">
                            ${w.token} - ${w.amount} ₽ на ${w.type}<br>
                            <button onclick="approveWithdraw(${w.id})">✅ Одобрить</button>
                            <button onclick="rejectWithdraw(${w.id})">❌ Отклонить</button>
                        </div>
                    `;
                });
                document.getElementById('adminContent').innerHTML = html || 'Нет заявок';
            }
        } else if (tab === 'checks') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingChecks&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '';
                data.checks.forEach(c => {
                    html += `
                        <div class="history-item">
                            ${c.token} - ${c.store} (${c.checkDate})<br>
                            <a href="${c.photoUrl}" target="_blank">📸 Фото</a><br>
                            <input type="number" id="amount_${c.id}" placeholder="Сумма">
                            <button onclick="approveCheck(${c.id})">✅ Одобрить</button>
                            <button onclick="rejectCheck(${c.id})">❌ Отклонить</button>
                            <button onclick="penaltyCheck(${c.id})">⚠️ Штраф</button>
                        </div>
                    `;
                });
                document.getElementById('adminContent').innerHTML = html || 'Нет чеков';
            }
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function approveWithdraw(id) {
    if (!confirm('Одобрить вывод?')) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminApproveWithdraw',
                token: currentUser.token,
                withdrawId: id
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('withdrawals');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function rejectWithdraw(id) {
    if (!confirm('Отклонить вывод?')) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminRejectWithdraw',
                token: currentUser.token,
                withdrawId: id
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('withdrawals');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function approveCheck(id) {
    const amount = document.getElementById(`amount_${id}`).value;
    if (!amount) {
        alert('Введите сумму');
        return;
    }
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminApproveCheck',
                token: currentUser.token,
                checkId: id,
                amount: parseFloat(amount)
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function rejectCheck(id) {
    const reason = prompt('Причина отклонения:');
    if (!reason) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminRejectCheck',
                token: currentUser.token,
                checkId: id,
                reason
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function penaltyCheck(id) {
    if (!confirm('Выписать штраф 0.15 ₽?')) return;
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminPenaltyCheck',
                token: currentUser.token,
                checkId: id
            })
        });
        
        const data = await response.json();
        alert(data.message);
        showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

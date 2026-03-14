// === АДМИНКА ===

// Делаем функции глобальными
window.showAdmin = async function() {
    console.log('showAdmin called');
    console.log('Current user:', currentUser);
    
    // Проверяем, точно ли админ
    if (!currentUser) {
        alert('Сначала войдите в аккаунт');
        return;
    }
    
    // Проверяем isAdmin (может быть true или 'TRUE')
    const isAdmin = currentUser.isAdmin === true || currentUser.isAdmin === 'TRUE';
    console.log('isAdmin check:', isAdmin);
    
    if (!isAdmin) {
        alert('Доступ запрещен');
        return;
    }
    
    document.getElementById('adminModal').classList.add('active');
    window.showAdminTab('users');
}

window.closeAdmin = function() {
    document.getElementById('adminModal').classList.remove('active');
}

window.showAdminTab = async function(tab) {
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // Добавляем активный класс нажатой кнопке
    event.target.classList.add('active');
    
    try {
        showLoader();
        let data;
        
        if (tab === 'users') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetAllUsers&token=${currentUser.token}`);
            data = await response.json();
            console.log('adminGetAllUsers:', data);
            
            if (data.success) {
                let html = '<table class="admin-table"><tr><th>Токен</th><th>Имя</th><th>Баланс</th><th>Админ</th></tr>';
                data.users.forEach(user => {
                    html += `<tr>
                        <td>${user.token}</td>
                        <td>${user.name}</td>
                        <td>${user.balance} ₽</td>
                        <td>${user.isAdmin ? '✅' : '❌'}</td>
                    </tr>`;
                });
                html += '</table>';
                document.getElementById('adminContent').innerHTML = html;
            }
        } else if (tab === 'withdrawals') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingWithdrawals&token=${currentUser.token}`);
            data = await response.json();
            console.log('adminGetPendingWithdrawals:', data);
            
            if (data.success) {
                let html = '';
                data.withdrawals.forEach(w => {
                    html += `
                        <div class="history-item">
                            <strong>${w.token}</strong> - ${w.amount} ₽ на ${w.type}<br>
                            <small>${w.date}</small><br>
                            <button class="btn btn-primary" onclick="approveWithdraw(${w.id})" style="width: auto; display: inline-block; margin-right: 5px;">✅ Одобрить</button>
                            <button class="btn btn-secondary" onclick="rejectWithdraw(${w.id})" style="width: auto; display: inline-block;">❌ Отклонить</button>
                        </div>
                    `;
                });
                document.getElementById('adminContent').innerHTML = html || '<p style="text-align:center; color:#888;">Нет заявок на вывод</p>';
            }
        } else if (tab === 'checks') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingChecks&token=${currentUser.token}`);
            data = await response.json();
            console.log('adminGetPendingChecks:', data);
            
            if (data.success) {
                let html = '';
                data.checks.forEach(c => {
                    html += `
                        <div class="history-item">
                            <strong>${c.token}</strong> - ${c.store} (${c.checkDate})<br>
                            <a href="${c.photoUrl}" target="_blank" style="color:#4CAF50;">📸 Открыть фото</a><br>
                            <input type="number" id="amount_${c.id}" placeholder="Сумма" class="input" style="margin:5px 0; width: 100%;">
                            <button class="btn btn-primary" onclick="approveCheck(${c.id})" style="width: auto; display: inline-block; margin-right: 5px;">✅ Одобрить</button>
                            <button class="btn btn-secondary" onclick="rejectCheck(${c.id})" style="width: auto; display: inline-block; margin-right: 5px;">❌ Отклонить</button>
                            <button class="btn" onclick="penaltyCheck(${c.id})" style="width: auto; display: inline-block; background: #ff9800;">⚠️ Штраф</button>
                        </div>
                    `;
                });
                document.getElementById('adminContent').innerHTML = html || '<p style="text-align:center; color:#888;">Нет чеков на проверку</p>';
            }
        }
    } catch(e) {
        alert('Ошибка: ' + e);
        console.error(e);
    } finally {
        hideLoader();
    }
}

// Функции для действий админа
window.approveWithdraw = async function(id) {
    if (!confirm('Одобрить вывод?')) return;
    
    try {
        showLoader();
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
        window.showAdminTab('withdrawals');
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.rejectWithdraw = async function(id) {
    if (!confirm('Отклонить вывод?')) return;
    
    try {
        showLoader();
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
        window.showAdminTab('withdrawals');
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.approveCheck = async function(id) {
    const amount = document.getElementById(`amount_${id}`).value;
    if (!amount) {
        alert('Введите сумму');
        return;
    }
    
    try {
        showLoader();
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
        window.showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.rejectCheck = async function(id) {
    const reason = prompt('Причина отклонения:');
    if (!reason) return;
    
    try {
        showLoader();
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
        window.showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.penaltyCheck = async function(id) {
    if (!confirm('Выписать штраф 0.15 ₽?')) return;
    
    try {
        showLoader();
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
        window.showAdminTab('checks');
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

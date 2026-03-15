// === АДМИНКА ===

window.showAdmin = async function() {
    console.log('showAdmin called');
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
        alert('Сначала войдите в аккаунт');
        return;
    }
    
    // Проверяем isAdmin (строка 'TRUE' или булево true)
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
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
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
                    // Правильная проверка админа
                    const isUserAdmin = user.isAdmin === true || user.isAdmin === 'TRUE';
                    html += `<tr>
                        <td>${user.token}</td>
                        <td>${user.name}</td>
                        <td>${user.balance || 0} ₽</td>
                        <td>${isUserAdmin ? '✅' : '❌'}</td>
                    </tr>`;
                });
                html += '</table>';
                document.getElementById('adminContent').innerHTML = html;
            }
        } else if (tab === 'withdrawals') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingWithdrawals&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '<div class="admin-list">';
                if (data.withdrawals.length === 0) {
                    html += '<p style="text-align:center; color:#888;">Нет заявок на вывод</p>';
                } else {
                    data.withdrawals.forEach(w => {
                        const date = new Date(w.date);
                        const formattedDate = date.toLocaleString('ru-RU');
                        
                        let typeText = w.type;
                        if (w.type === 'phone') typeText = 'телефон';
                        if (w.type === 'card') typeText = 'карта';
                        if (w.type === 'steam') typeText = 'Steam';
                        
                        html += `
                            <div class="history-item" id="withdraw-${w.id}">
                                <strong>${w.token}</strong> - ${w.amount} ₽ на ${typeText}<br>
                                <small class="date">${formattedDate}</small><br>
                                <small>Реквизит: ${w.requisit}</small><br>
                                <button class="btn btn-primary" onclick="approveWithdraw(${w.id})" style="width: auto; display: inline-block; margin-right: 5px;">✅ Одобрить</button>
                                <button class="btn btn-secondary" onclick="rejectWithdraw(${w.id})" style="width: auto; display: inline-block;">❌ Отклонить</button>
                            </div>
                        `;
                    });
                }
                html += '</div>';
                document.getElementById('adminContent').innerHTML = html;
            }
        } else if (tab === 'checks') {
            const response = await fetch(`${SCRIPT_URL}?action=adminGetPendingChecks&token=${currentUser.token}`);
            data = await response.json();
            
            if (data.success) {
                let html = '<div class="admin-list">';
                if (data.checks.length === 0) {
                    html += '<p style="text-align:center; color:#888;">Нет чеков на проверку</p>';
                } else {
                    data.checks.forEach(c => {
                        const date = new Date(c.checkDate);
                        const formattedDate = date.toLocaleDateString('ru-RU');
                        html += `
                            <div class="history-item" id="check-${c.id}">
                                <strong>${c.token}</strong> - ${c.store} (${formattedDate})<br>
                                <a href="${c.photoUrl}" target="_blank" style="color:#4CAF50; text-decoration: none;">📸 Открыть фото</a><br>
                                <div class="input-wrapper" style="margin:10px 0;">
                                    <input type="number" id="amount_${c.id}" placeholder=" " value="0">
                                    <label>Сумма</label>
                                </div>
                                <button class="btn btn-primary" onclick="approveCheck(${c.id})" style="width: auto; display: inline-block; margin-right: 5px;">✅ Одобрить</button>
                                <button class="btn btn-secondary" onclick="rejectCheck(${c.id})" style="width: auto; display: inline-block; margin-right: 5px;">❌ Отклонить</button>
                                <button class="btn" onclick="penaltyCheck(${c.id})" style="width: auto; display: inline-block; background: #ff9800;">⚠️ Штраф</button>
                            </div>
                        `;
                    });
                }
                html += '</div>';
                document.getElementById('adminContent').innerHTML = html;
            }
        }
    } catch(e) {
        alert('Ошибка: ' + e);
        console.error(e);
    } finally {
        hideLoader();
    }
}

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
        if (data.success) {
            alert('✅ Вывод одобрен');
            const element = document.getElementById(`withdraw-${id}`);
            if (element) element.remove();
            
            const container = document.querySelector('.admin-list');
            if (container && container.children.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#888;">Нет заявок на вывод</p>';
            }
        } else {
            alert('❌ ' + (data.error || 'Ошибка'));
        }
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
        if (data.success) {
            alert('❌ Вывод отклонен');
            const element = document.getElementById(`withdraw-${id}`);
            if (element) element.remove();
            
            const container = document.querySelector('.admin-list');
            if (container && container.children.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#888;">Нет заявок на вывод</p>';
            }
        } else {
            alert('❌ ' + (data.error || 'Ошибка'));
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.approveCheck = async function(id) {
    const amount = document.getElementById(`amount_${id}`).value;
    if (!amount || amount <= 0) {
        alert('Введите сумму больше 0');
        return;
    }
    
    if (!confirm(`Одобрить чек на ${amount} ₽?`)) return;
    
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
        if (data.success) {
            alert('✅ Чек одобрен');
            const element = document.getElementById(`check-${id}`);
            if (element) element.remove();
            
            const container = document.querySelector('.admin-list');
            if (container && container.children.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#888;">Нет чеков на проверку</p>';
            }
        } else {
            alert('❌ ' + (data.error || 'Ошибка'));
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.rejectCheck = async function(id) {
    const reason = prompt('Причина отклонения:');
    if (!reason) return;
    
    if (!confirm(`Отклонить чек? Причина: ${reason}`)) return;
    
    try {
        showLoader();
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'adminRejectCheck',
                token: currentUser.token,
                checkId: id,
                reason: reason
            })
        });
        
        const data = await response.json();
        if (data.success) {
            alert('❌ Чек отклонен');
            const element = document.getElementById(`check-${id}`);
            if (element) element.remove();
            
            const container = document.querySelector('.admin-list');
            if (container && container.children.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#888;">Нет чеков на проверку</p>';
            }
        } else {
            alert('❌ ' + (data.error || 'Ошибка'));
        }
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
        if (data.success) {
            alert('⚠️ Штраф выписан');
            const element = document.getElementById(`check-${id}`);
            if (element) element.remove();
            
            const container = document.querySelector('.admin-list');
            if (container && container.children.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#888;">Нет чеков на проверку</p>';
            }
        } else {
            alert('❌ ' + (data.error || 'Ошибка'));
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

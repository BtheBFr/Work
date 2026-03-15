// === ПРОФИЛЬ ===

function showProfile() {
    document.getElementById('profileName').textContent = currentUser.name || '';
    document.getElementById('profileBalance').textContent = currentUser.balance || 0;
    document.getElementById('profileClicks').textContent = currentUser.clicks || 0;
    document.getElementById('profileEarned').textContent = currentUser.earnedFromLinks || 0;
    document.getElementById('tokenVisible').textContent = currentUser.token;
    
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileCard').value = currentUser.card || '';
    document.getElementById('profileSteam').value = currentUser.steam || '';
    
    document.getElementById('profileModal').classList.add('active');
}

function showToken() {
    document.getElementById('tokenHidden').style.display = 'none';
    document.getElementById('tokenVisible').style.display = 'inline';
}

function closeProfile() {
    document.getElementById('profileModal').classList.remove('active');
}

async function updateRequisites() {
    const requisites = {
        phone: document.getElementById('profilePhone').value.trim(),
        card: document.getElementById('profileCard').value.trim(),
        steam: document.getElementById('profileSteam').value.trim()
    };

    showLoader();
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateRequisites',
                token: currentUser.token,
                requisites: requisites
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Сразу обновляем локальные данные
            currentUser.phone = requisites.phone;
            currentUser.card = requisites.card;
            currentUser.steam = requisites.steam;
            saveToCache();
            
            alert('✅ Реквизиты обновлены');
            closeProfile();
            
            // НЕ перезагружаем данные с сервера сразу,
            // чтобы не затереть только что измененные реквизиты
            setTimeout(async () => {
                const userResponse = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
                const userData = await userResponse.json();
                if (userData.success) {
                    // Сохраняем изменения реквизитов
                    userData.phone = requisites.phone;
                    userData.card = requisites.card;
                    userData.steam = requisites.steam;
                    currentUser = { ...currentUser, ...userData };
                    saveToCache();
                }
            }, 2000);
        } else {
            alert('❌ ' + (data.error || 'Ошибка обновления'));
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.showProfile = showProfile;
window.showToken = showToken;
window.closeProfile = closeProfile;
window.updateRequisites = updateRequisites;

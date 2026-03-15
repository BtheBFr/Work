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
            currentUser.phone = requisites.phone;
            currentUser.card = requisites.card;
            currentUser.steam = requisites.steam;
            saveToCache();
            alert('✅ Реквизиты обновлены');
            closeProfile();
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

// === АВТОРИЗАЦИЯ ===

window.showRegister = function() {
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('requisitesForm').style.display = 'none';
}

window.showLogin = function() {
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('requisitesForm').style.display = 'none';
}

window.register = async function() {
    const token = document.getElementById('regToken').value.trim();
    if (!token) {
        alert('Введите токен');
        return;
    }

    showLoader();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=checkToken&token=${token}`);
        const data = await response.json();
        console.log('checkToken ответ:', data);
        
        if (data.exists) {
            if (!data.used) {
                currentUser = { 
                    token: token, 
                    name: data.name,
                    isAdmin: data.isAdmin === 'TRUE' || data.isAdmin === true
                };
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('requisitesForm').style.display = 'block';
            } else {
                await window.loginUser(token);
            }
        } else {
            alert('Токен не найден в таблице');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
        console.error(e);
    } finally {
        hideLoader();
    }
}

window.login = async function() {
    const token = document.getElementById('loginToken').value.trim();
    if (!token) {
        alert('Введите токен');
        return;
    }
    await window.loginUser(token);
}

window.loginUser = async function(token) {
    showLoader();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${token}`);
        const data = await response.json();
        console.log('getUserData ответ:', data);
        
        if (data.success) {
            data.isAdmin = data.isAdmin === 'TRUE' || data.isAdmin === true;
            
            currentUser = data;
            saveToCache();
            
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            
            console.log('isAdmin значение:', data.isAdmin);
            if (currentUser.isAdmin) {
                document.getElementById('adminBtn').style.display = 'block';
                console.log('Админ кнопка показана');
            } else {
                document.getElementById('adminBtn').style.display = 'none';
                console.log('Не админ');
            }
            
            // Предзагружаем Wordle
            if (window.preloadWordle) {
                setTimeout(() => preloadWordle(), 1000);
            }
            
            updateUI();
        } else {
            alert('Ошибка входа: ' + (data.error || 'неизвестная ошибка'));
        }
    } catch(e) {
        alert('Ошибка: ' + e);
        console.error(e);
    } finally {
        hideLoader();
    }
}

window.saveRequisites = async function() {
    const requisites = {
        phone: document.getElementById('phone').value.trim(),
        card: document.getElementById('card').value.trim(),
        steam: document.getElementById('steam').value.trim()
    };

    if (!requisites.phone && !requisites.card && !requisites.steam) {
        alert('Введите хотя бы один реквизит');
        return;
    }

    showLoader();
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                token: currentUser.token,
                requisites: requisites
            })
        });
        
        const data = await response.json();
        console.log('register ответ:', data);
        
        if (data.success) {
            currentUser.phone = requisites.phone;
            currentUser.card = requisites.card;
            currentUser.steam = requisites.steam;
            saveToCache();
            
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            
            if (currentUser.isAdmin) {
                document.getElementById('adminBtn').style.display = 'block';
            }
            
            updateUI();
        } else {
            alert('Ошибка: ' + (data.error || 'неизвестная ошибка'));
        }
    } catch(e) {
        alert('Ошибка: ' + e);
        console.error(e);
    } finally {
        hideLoader();
    }
}

// Очищаем поля при открытии
document.addEventListener('DOMContentLoaded', function() {
    const authModal = document.getElementById('authModal');
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList.contains('active')) {
                document.getElementById('regToken').value = '';
                document.getElementById('loginToken').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('card').value = '';
                document.getElementById('steam').value = '';
            }
        });
    });
    
    observer.observe(authModal, { attributes: true, attributeFilter: ['class'] });
});

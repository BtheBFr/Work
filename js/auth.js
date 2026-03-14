// === АВТОРИЗАЦИЯ ===

window.showRegister = function() {
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
}

window.showLogin = function() {
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
}

window.register = async function() {
    const token = document.getElementById('regToken').value;
    if (!token) {
        alert('Введите токен');
        return;
    }

    showLoader();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=checkToken&token=${token}`);
        const data = await response.json();
        console.log('checkToken ответ:', data); // Отладка
        
        if (data.exists) {
            if (!data.used) {
                currentUser = { token, name: data.name };
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('requisitesForm').style.display = 'block';
            } else {
                await window.loginUser(token);
            }
        } else {
            alert('Токен не найден');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.login = async function() {
    const token = document.getElementById('loginToken').value;
    await window.loginUser(token);
}

window.loginUser = async function(token) {
    showLoader();
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${token}`);
        const data = await response.json();
        console.log('getUserData ответ:', data); // Отладка
        
        if (data.success) {
            currentUser = data;
            saveToCache();
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            updateUI();
            
            // Админка показывается если в таблице TRUE
            console.log('isAdmin значение:', data.isAdmin); // Отладка
            if (data.isAdmin === true || data.isAdmin === 'TRUE') {
                document.getElementById('adminBtn').style.display = 'block';
                console.log('Админ кнопка показана');
            } else {
                console.log('Не админ');
            }
        } else {
            alert('Ошибка входа');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

window.saveRequisites = async function() {
    const requisites = {
        phone: document.getElementById('phone').value,
        card: document.getElementById('card').value,
        steam: document.getElementById('steam').value
    };

    showLoader();
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                token: currentUser.token,
                requisites
            })
        });
        
        const data = await response.json();
        console.log('register ответ:', data); // Отладка
        
        if (data.success) {
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            currentUser = { ...currentUser, ...requisites };
            saveToCache();
            updateUI();
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    } finally {
        hideLoader();
    }
}

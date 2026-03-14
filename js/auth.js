// === АВТОРИЗАЦИЯ ===

function showRegister() {
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.auth-buttons').style.display = 'none';
}

async function register() {
    const token = document.getElementById('regToken').value;
    if (!token) {
        alert('Введите токен');
        return;
    }

    try {
        const response = await fetch(`${SCRIPT_URL}?action=checkToken&token=${token}`);
        const data = await response.json();
        
        if (data.exists) {
            if (!data.used) {
                currentUser = { token, name: data.name };
                document.getElementById('registerForm').style.display = 'none';
                document.getElementById('requisitesForm').style.display = 'block';
            } else {
                await loginUser(token);
            }
        } else {
            alert('Токен не найден');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function login() {
    const token = document.getElementById('loginToken').value;
    await loginUser(token);
}

async function loginUser(token) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${token}`);
        const data = await response.json();
        
        if (data.success) {
            currentUser = data;
            saveToCache();
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            updateUI();
            
            if (data.isAdmin) {
                document.getElementById('adminBtn').style.display = 'block';
            }
        } else {
            alert('Ошибка входа');
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

async function saveRequisites() {
    const requisites = {
        phone: document.getElementById('phone').value,
        card: document.getElementById('card').value,
        steam: document.getElementById('steam').value
    };

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
        if (data.success) {
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            currentUser = { ...currentUser, ...requisites };
            saveToCache();
            updateUI();
        }
    } catch(e) {
        alert('Ошибка: ' + e);
    }
}

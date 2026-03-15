// === КОНФИГУРАЦИЯ ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTNV5Uc-T5EmqP5TeLyEcP0eApz_nlMMaj_psXFToniKLyS4-ZQwUMka_Fqtktj3wH/exec';
let currentUser = null;

function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    createBackgroundAnimation();
    loadFromCache();
});

function createBackgroundAnimation() {
    const bg = document.createElement('div');
    bg.className = 'background-animation';
    
    for (let i = 0; i < 3; i++) {
        const circle = document.createElement('div');
        circle.className = 'circle';
        bg.appendChild(circle);
    }
    
    const particles = document.createElement('div');
    particles.className = 'particles';
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = 10 + Math.random() * 10 + 's';
        particles.appendChild(particle);
    }
    bg.appendChild(particles);
    
    document.body.insertBefore(bg, document.body.firstChild);
}

function loadFromCache() {
    const saved = localStorage.getItem('work_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            console.log('Загружено из кеша:', currentUser);
            
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            
            if (currentUser.isAdmin) {
                document.getElementById('adminBtn').style.display = 'block';
                console.log('Админ кнопка показана (из кеша)');
            }
            
            updateUI();
        } catch(e) {
            console.error('Ошибка загрузки кеша:', e);
        }
    }
}

function saveToCache() {
    if (currentUser) {
        localStorage.setItem('work_user', JSON.stringify(currentUser));
    }
}

window.logout = function() {
    if (confirm('Выйти из аккаунта?')) {
        localStorage.removeItem('work_user');
        currentUser = null;
        document.getElementById('mainSite').style.display = 'none';
        document.getElementById('authModal').classList.add('active');
        document.getElementById('adminBtn').style.display = 'none';
        
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('requisitesForm').style.display = 'none';
        document.querySelector('.auth-buttons').style.display = 'block';
    }
}

function updateUI() {
    setTimeout(async () => {
        try {
            showLoader();
            const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
            const data = await response.json();
            console.log('Обновление данных:', data);
            
            if (data.success) {
                currentUser = { ...currentUser, ...data };
                saveToCache();
                
                if (currentUser.isAdmin) {
                    document.getElementById('adminBtn').style.display = 'block';
                    console.log('Админ кнопка показана (обновление)');
                } else {
                    document.getElementById('adminBtn').style.display = 'none';
                    console.log('Не админ:', currentUser.isAdmin);
                }
            }
        } catch(e) {
            console.log('Ошибка обновления:', e);
        } finally {
            hideLoader();
        }
    }, 1000);
}

window.openAd = function() {
    window.open('https://bthebfr.github.io/btheb-about/', '_blank');
}

window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.updateUI = updateUI;

// === КОНФИГУРАЦИЯ ===
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwTNV5Uc-T5EmqP5TeLyEcP0eApz_nlMMaj_psXFToniKLyS4-ZQwUMka_Fqtktj3wH/exec';
let currentUser = null;

// Показывать/скрывать загрузку
function showLoader() {
    document.getElementById('loader').classList.add('active');
}

function hideLoader() {
    document.getElementById('loader').classList.remove('active');
}

// === ЗАГРУЗКА ПРИ СТАРТЕ ===
document.addEventListener('DOMContentLoaded', () => {
    // Создаем анимацию на фоне
    createBackgroundAnimation();
    loadFromCache();
});

// Создание фоновой анимации
function createBackgroundAnimation() {
    const bg = document.createElement('div');
    bg.className = 'background-animation';
    
    // Круги
    for (let i = 0; i < 3; i++) {
        const circle = document.createElement('div');
        circle.className = 'circle';
        bg.appendChild(circle);
    }
    
    // Частицы
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

// === КЕШ ===
function loadFromCache() {
    const saved = localStorage.getItem('work_user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            console.log('Загружено из кеша:', currentUser); // Отладка
            document.getElementById('authModal').classList.remove('active');
            document.getElementById('mainSite').style.display = 'block';
            updateUI();
            
            // Проверяем админа
            if (currentUser.isAdmin === true || currentUser.isAdmin === 'TRUE') {
                document.getElementById('adminBtn').style.display = 'block';
                console.log('Админ кнопка показана (из кеша)');
            }
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

// === ВЫХОД ===
window.logout = function() {
    if (confirm('Выйти из аккаунта?')) {
        localStorage.removeItem('work_user');
        currentUser = null;
        document.getElementById('mainSite').style.display = 'none';
        document.getElementById('authModal').classList.add('active');
        document.getElementById('adminBtn').style.display = 'none';
        // Сброс форм
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'none';
        document.querySelector('.auth-buttons').style.display = 'block';
    }
}

// === ОБНОВЛЕНИЕ UI ===
function updateUI() {
    // Фоновое обновление данных
    setTimeout(async () => {
        try {
            showLoader();
            const response = await fetch(`${SCRIPT_URL}?action=getUserData&token=${currentUser.token}`);
            const data = await response.json();
            console.log('Обновление данных:', data); // Отладка
            
            if (data.success) {
                currentUser = { ...currentUser, ...data };
                saveToCache();
                
                // Проверяем админа снова
                if (currentUser.isAdmin === true || currentUser.isAdmin === 'TRUE') {
                    document.getElementById('adminBtn').style.display = 'block';
                    console.log('Админ кнопка показана (обновление)');
                }
            }
        } catch(e) {
            console.log('Ошибка обновления:', e);
        } finally {
            hideLoader();
        }
    }, 1000);
}

// === РЕКЛАМА ===
window.openAd = function() {
    window.open('https://bthebfr.github.io/btheb-about/', '_blank');
}

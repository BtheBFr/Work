// === ЧЕКИ ===

function uploadCheck() {
    const modal = document.getElementById('checkModal');
    
    // Создаем красивый выбор магазина
    if (!document.querySelector('.store-selector')) {
        const select = document.getElementById('checkStore');
        select.style.display = 'none';
        
        const selector = document.createElement('div');
        selector.className = 'store-selector';
        
        const options = ['Пятерочка', 'Магнит', 'Монетка', 'Чижик'];
        let optionsHtml = '<div class="store-options">';
        options.forEach(store => {
            optionsHtml += `<div class="store-option" onclick="selectStore('${store}')">${store}</div>`;
        });
        optionsHtml += '</div>';
        
        selector.innerHTML = optionsHtml;
        select.insertAdjacentElement('beforebegin', selector);
    }
    
    // Создаем красивый выбор даты
    const dateInput = document.getElementById('checkDate');
    dateInput.type = 'date';
    dateInput.className = 'date-picker';
    
    // Создаем красивую кнопку загрузки фото (как кнопка "Отправить")
    if (!document.querySelector('.file-upload-btn')) {
        const fileInput = document.getElementById('checkPhoto');
        fileInput.style.display = 'none';
        
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'btn btn-primary';
        uploadBtn.id = 'uploadPhotoBtn';
        uploadBtn.innerHTML = '📸 Загрузить фото';
        uploadBtn.style.marginBottom = '10px';
        uploadBtn.onclick = function() {
            fileInput.click();
        };
        
        fileInput.addEventListener('change', function() {
            if (this.files[0]) {
                uploadBtn.innerHTML = `📸 ${this.files[0].name}`;
                uploadBtn.style.background = '#4CAF50';
            } else {
                uploadBtn.innerHTML = '📸 Загрузить фото';
                uploadBtn.style.background = '';
            }
        });
        
        // Вставляем перед кнопкой "Отправить"
        const submitBtn = document.querySelector('#checkModal .btn-primary:not(#uploadPhotoBtn)');
        submitBtn.parentNode.insertBefore(uploadBtn, submitBtn);
    }
    
    // Очищаем поля
    document.getElementById('checkDate').value = '';
    document.getElementById('checkPhoto').value = '';
    document.querySelectorAll('.store-option').forEach(opt => opt.classList.remove('selected'));
    
    // Сбрасываем текст кнопки
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    if (uploadBtn) {
        uploadBtn.innerHTML = '📸 Загрузить фото';
        uploadBtn.style.background = '';
    }
    
    modal.classList.add('active');
}

function selectStore(store) {
    document.querySelectorAll('.store-option').forEach(opt => opt.classList.remove('selected'));
    event.target.classList.add('selected');
    document.getElementById('checkStore').value = store;
}

function closeCheck() {
    document.getElementById('checkModal').classList.remove('active');
}

async function submitCheck() {
    const store = document.getElementById('checkStore').value;
    const date = document.getElementById('checkDate').value;
    const file = document.getElementById('checkPhoto').files[0];
    
    if (!store) {
        alert('Выберите магазин');
        return;
    }
    
    if (!file) {
        alert('Сначала загрузите фото чека');
        return;
    }
    
    if (!date) {
        alert('Выберите дату чека');
        return;
    }

    showLoader();
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result.split(',')[1];
        
        const formData = new URLSearchParams();
        formData.append('action', 'uploadCheck');
        formData.append('token', currentUser.token);
        formData.append('store', store);
        formData.append('checkDate', date.split('-').reverse().join('.'));
        formData.append('fileData', base64);

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                alert('✅ Чек отправлен на проверку');
                closeCheck();
            } else {
                alert('❌ ' + (data.error || 'Ошибка загрузки'));
            }
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    };
    
    reader.readAsDataURL(file);
}

window.uploadCheck = uploadCheck;
window.closeCheck = closeCheck;
window.submitCheck = submitCheck;
window.selectStore = selectStore;

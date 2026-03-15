// === ЧЕКИ ===

function uploadCheck() {
    const modal = document.getElementById('checkModal');
    
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
    
    const dateInput = document.getElementById('checkDate');
    dateInput.type = 'date';
    dateInput.className = 'date-picker';
    
    if (!document.querySelector('.file-input-wrapper')) {
        const fileInput = document.getElementById('checkPhoto');
        fileInput.style.display = 'none';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'file-input-wrapper';
        
        const label = document.createElement('label');
        label.className = 'file-label';
        label.innerHTML = `
            <span>📸 Выбрать фото чека</span>
            <span id="fileName">Файл не выбран</span>
        `;
        
        const fileButton = document.createElement('input');
        fileButton.type = 'file';
        fileButton.className = 'file-input';
        fileButton.accept = 'image/*';
        fileButton.capture = 'environment';
        
        fileButton.addEventListener('change', function() {
            document.getElementById('fileName').textContent = this.files[0] ? this.files[0].name : 'Файл не выбран';
            if (this.files[0]) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(this.files[0]);
                fileInput.files = dataTransfer.files;
            }
        });
        
        wrapper.appendChild(fileButton);
        wrapper.appendChild(label);
        
        const dateWrapper = document.querySelector('.date-picker');
        dateWrapper.insertAdjacentElement('afterend', wrapper);
    }
    
    // Очищаем поля
    document.getElementById('checkDate').value = '';
    document.getElementById('fileName').textContent = 'Файл не выбран';
    document.getElementById('checkPhoto').value = '';
    
    document.querySelectorAll('.store-option').forEach(opt => opt.classList.remove('selected'));
    
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
        alert('Выберите фото чека');
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

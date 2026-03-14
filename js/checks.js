// === ЧЕКИ ===

function uploadCheck() {
    const modal = document.getElementById('checkModal');
    
    // Проверяем, создан ли красивый выбор файла
    const fileInput = document.getElementById('checkPhoto');
    if (!document.querySelector('.file-input-wrapper')) {
        fileInput.style.display = 'none';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'file-input-wrapper';
        
        const label = document.createElement('label');
        label.className = 'file-label';
        label.innerHTML = `
            <span>📸 Выбрать фото чека</span>
            <span id="fileName">Файл не выбран</span>
        `;
        
        // Создаем кнопку выбора файла
        const fileButton = document.createElement('input');
        fileButton.type = 'file';
        fileButton.className = 'file-input';
        fileButton.accept = 'image/*';
        fileButton.capture = 'environment';
        
        fileButton.addEventListener('change', function() {
            document.getElementById('fileName').textContent = this.files[0] ? this.files[0].name : 'Файл не выбран';
            // Копируем файл в оригинальный input
            if (this.files[0]) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(this.files[0]);
                fileInput.files = dataTransfer.files;
            }
        });
        
        wrapper.appendChild(fileButton);
        wrapper.appendChild(label);
        
        // Вставляем после select
        const selectWrapper = document.querySelector('.custom-select');
        selectWrapper.insertAdjacentElement('afterend', wrapper);
    }
    
    modal.classList.add('active');
}

function closeCheck() {
    document.getElementById('checkModal').classList.remove('active');
}

async function submitCheck() {
    const store = document.getElementById('checkStore').value;
    const date = document.getElementById('checkDate').value;
    const file = document.getElementById('checkPhoto').files[0];
    
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
                alert('Чек отправлен на проверку');
                closeCheck();
            } else {
                alert(data.error);
            }
        } catch(e) {
            alert('Ошибка: ' + e);
        } finally {
            hideLoader();
        }
    };
    
    reader.readAsDataURL(file);
}

// Делаем функции глобальными
window.uploadCheck = uploadCheck;
window.closeCheck = closeCheck;
window.submitCheck = submitCheck;

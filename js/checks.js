// === ЧЕКИ ===

function uploadCheck() {
    // Создаем красивый интерфейс для выбора файла
    const modal = document.getElementById('checkModal');
    const content = modal.querySelector('.modal-content');
    
    // Обновляем содержимое если нужно
    const fileWrapper = content.querySelector('.file-input-wrapper');
    if (!fileWrapper) {
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
        
        fileInput.parentNode.insertBefore(wrapper, fileInput);
        wrapper.appendChild(fileInput);
        wrapper.appendChild(label);
        
        fileInput.addEventListener('change', function() {
            document.getElementById('fileName').textContent = this.files[0] ? this.files[0].name : 'Файл не выбран';
        });
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

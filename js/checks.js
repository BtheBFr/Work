// === ЧЕКИ ===

function uploadCheck() {
    document.getElementById('checkModal').classList.add('active');
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
        }
    };
    
    reader.readAsDataURL(file);
}

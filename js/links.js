// === ССЫЛКИ ===

function showLinks() {
    const modal = document.getElementById('linksModal');
    const linkContainer = modal.querySelector('.link-container');
    
    if (!linkContainer) {
        // Создаем красивый контейнер для ссылки
        const content = modal.querySelector('.modal-content');
        const oldLink = document.getElementById('userLink');
        const oldBtn = content.querySelector('button[onclick="copyLink()"]');
        
        // Создаем новый контейнер
        const container = document.createElement('div');
        container.className = 'link-container';
        
        const linkElement = document.createElement('div');
        linkElement.className = 'link';
        linkElement.id = 'userLink';
        linkElement.textContent = currentUser.link || 'ссылка не найдена';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i>📋</i> Копировать ссылку';
        copyBtn.onclick = copyLink;
        
        container.appendChild(linkElement);
        container.appendChild(copyBtn);
        
        // Заменяем старые элементы
        if (oldLink) oldLink.remove();
        if (oldBtn) oldBtn.remove();
        
        // Вставляем после заголовка
        const title = content.querySelector('h2');
        title.insertAdjacentElement('afterend', container);
    } else {
        document.getElementById('userLink').textContent = currentUser.link || 'ссылка не найдена';
    }
    
    document.getElementById('linkClicks').textContent = currentUser.clicks || 0;
    document.getElementById('linkEarned').textContent = currentUser.earnedFromLinks || 0;
    document.getElementById('linksModal').classList.add('active');
}

function closeLinks() {
    document.getElementById('linksModal').classList.remove('active');
}

function copyLink() {
    navigator.clipboard.writeText(currentUser.link);
    
    // Показываем красивый эффект
    const btn = event.target.closest('.copy-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i>✅</i> Скопировано!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

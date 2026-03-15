// === ССЫЛКИ ===

function showLinks() {
    const modal = document.getElementById('linksModal');
    const content = modal.querySelector('.modal-content');
    
    if (!content.querySelector('.link-container')) {
        const oldLink = document.getElementById('userLink');
        const oldBtn = content.querySelector('button[onclick="copyLink()"]');
        
        const container = document.createElement('div');
        container.className = 'link-container';
        
        const linkElement = document.createElement('div');
        linkElement.className = 'link';
        linkElement.id = 'userLink';
        linkElement.textContent = currentUser.link || 'ссылка не найдена';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '📋 Копировать ссылку';
        copyBtn.onclick = copyLink;
        
        container.appendChild(linkElement);
        container.appendChild(copyBtn);
        
        if (oldLink) oldLink.remove();
        if (oldBtn) oldBtn.remove();
        
        const title = content.querySelector('h2');
        title.insertAdjacentElement('afterend', container);
    } else {
        document.getElementById('userLink').textContent = currentUser.link || 'ссылка не найдена';
    }
    
    document.getElementById('linkClicks').textContent = currentUser.clicks || 0;
    document.getElementById('linkEarned').textContent = currentUser.earnedFromLinks || 0;
    
    // Обновляем текст подсказки
    const hint = document.querySelector('#linksModal .hint');
    if (hint) {
        hint.textContent = 'Распространяй ссылку везде, говори что там слив, бесплатные деньги, или др.';
    }
    
    document.getElementById('linksModal').classList.add('active');
}

function closeLinks() {
    document.getElementById('linksModal').classList.remove('active');
}

function copyLink() {
    navigator.clipboard.writeText(currentUser.link);
    
    const btn = event.target.closest('.copy-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ Скопировано!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

window.showLinks = showLinks;
window.closeLinks = closeLinks;
window.copyLink = copyLink;

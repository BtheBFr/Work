// === ССЫЛКИ ===

function showLinks() {
    document.getElementById('userLink').textContent = currentUser.link || 'ссылка не найдена';
    document.getElementById('linkClicks').textContent = currentUser.clicks || 0;
    document.getElementById('linkEarned').textContent = currentUser.earnedFromLinks || 0;
    document.getElementById('linksModal').classList.add('active');
}

function closeLinks() {
    document.getElementById('linksModal').classList.remove('active');
}

function copyLink() {
    navigator.clipboard.writeText(currentUser.link);
    alert('Ссылка скопирована!');
}

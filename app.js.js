// Инициализация Telegram Mini App
let tg = window.Telegram.WebApp;

// Основные данные
let currentUser = null;
let playersDatabase = [];

// Данные метовых персонажей
const metaData = {
    'gem-grab': [
        { name: 'Гром', role: 'Контроль', emoji: '⚡' },
        { name: 'Сёрдж', role: 'Универсал', emoji: '🌊' },
        { name: 'Тара', role: 'Поддержка', emoji: '🔮' },
        { name: 'Джеки', role: 'Танк', emoji: '🛡️' },
        { name: 'Спраут', role: 'Контроль', emoji: '🌱' }
    ],
    'brawl-ball': [
        { name: 'Эдгар', role: 'Ассасин', emoji: '💨' },
        { name: 'Роза', role: 'Танк', emoji: '🥊' },
        { name: 'Кольт', role: 'Стрелок', emoji: '🔫' },
        { name: 'Биби', role: 'Ближний бой', emoji: '🎯' },
        { name: 'Фанг', role: 'Ассасин', emoji: '🥋' }
    ],
    'heist': [
        { name: 'Булл', role: 'Танк', emoji: '🐂' },
        { name: 'Брок', role: 'Стрелок', emoji: '🚀' },
        { name: '8-БИТ', role: 'Поддержка', emoji: '🎮' },
        { name: 'Дэррил', role: 'Ассасин', emoji: '🎩' },
        { name: 'Колетт', role: 'Универсал', emoji: '🎨' }
    ]
};

// Инициализация приложения
function initApp() {
    // Инициализируем Telegram Web App
    if (typeof tg !== 'undefined' && tg.initDataUnsafe) {
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Получаем данные пользователя Telegram
        const user = tg.initDataUnsafe.user;
        if (user) {
            currentUser = {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name || '',
                username: user.username || `user_${user.id}`
            };
            updateUserProfile();
        }
    } else {
        console.log('Telegram Web App не обнаружен. Запуск в браузере.');
        currentUser = {
            id: 1,
            firstName: 'Тестовый',
            lastName: 'Пользователь',
            username: 'test_user'
        };
        updateUserProfile();
    }
    
    populateMeta();
    loadPlayersFromStorage();
    setupEventListeners();
    updateProfileInfo();
}

// Обновление профиля пользователя
function updateUserProfile() {
    if (currentUser) {
        document.getElementById('userName').textContent = 
            `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('userAvatar').textContent = 
            currentUser.firstName[0] + (currentUser.lastName ? currentUser.lastName[0] : '');
    }
}

// Заполнение меты персонажей
function populateMeta() {
    for (const [mode, brawlers] of Object.entries(metaData)) {
        const container = document.getElementById(`${mode}Meta`);
        if (container) {
            container.innerHTML = brawlers.map(brawler => `
                <div class="brawler-card">
                    <div class="brawler-icon">${brawler.emoji}</div>
                    <div class="brawler-name">${brawler.name}</div>
                    <div class="brawler-role">${brawler.role}</div>
                </div>
            `).join('');
        }
    }
}

// Переключение табов
function switchTab(tabName) {
    // Скрываем все табы
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активный класс со всех кнопок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показываем выбранный таб
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Активируем соответствующую кнопку
    event.target.classList.add('active');
}

// Поиск подходящих игроков
function findTeammates(playerData) {
    return playersDatabase.filter(player => 
        player.userId !== playerData.userId &&
        Math.abs(player.trophies - playerData.trophies) <= 3000 &&
        player.gameMode === playerData.gameMode
    );
}

// Отображение найденных игроков
function displayTeammates(teammates) {
    const container = document.getElementById('playersList');
    
    if (teammates.length === 0) {
        container.innerHTML = '<div class="loading">😔 Пока нет подходящих игроков. Попробуйте позже или измените критерии поиска!</div>';
        return;
    }

    container.innerHTML = teammates.map(player => `
        <div class="player-item">
            <div class="player-name">${player.playerTag}</div>
            <div class="player-info">🏆 ${player.trophies.toLocaleString()} трофеев</div>
            <div class="player-info">🎯 Основной бравлер: ${player.mainBrawler}</div>
            <div class="player-info">📱 Режим: ${getGameModeName(player.gameMode)}</div>
            <button class="tg-button tg-button-secondary" onclick="inviteToTeam('${player.playerTag}')">
                ✉️ Пригласить в команду
            </button>
        </div>
    `).join('');
}

// Приглашение в команду
function inviteToTeam(playerTag) {
    const playerTagInput = document.getElementById('playerTag');
    const myTag = playerTagInput ? playerTagInput.value : 'не указан';
    
    const message = `Привет! 🎮\n\nХочешь составить команду в Brawl Stars?\nМой тег: ${myTag}\n\nДавай играть вместе! 💪`;
    
    // Пытаемся использовать Telegram API для отправки сообщения
    if (typeof tg !== 'undefined' && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?text=${encodeURIComponent(message)}`);
    } else {
        // Fallback для браузера
        navigator.clipboard.writeText(message).then(() => {
            alert(`✅ Сообщение для игрока ${playerTag} скопировано в буфер обмена!\n\nОтправьте ему это сообщение:`);
        }).catch(() => {
            alert(`✉️ Сообщение для игрока ${playerTag}:\n\n${message}\n\nСкопируйте и отправьте ему!`);
        });
    }
}

// Поделиться профилем
function shareProfile() {
    const playerTag = document.getElementById('playerTag').value;
    const trophies = document.getElementById('trophies').value;
    const gameMode = document.getElementById('gameMode').value;
    const mainBrawler = document.getElementById('mainBrawler').value;
    
    if (!playerTag || !trophies) {
        alert('⚠️ Заполните ваш профиль в разделе "Поиск команды"');
        return;
    }
    
    const modeName = getGameModeName(gameMode) || 'любой режим';
    const brawlerText = mainBrawler ? `🎯 Основной бравлер: ${mainBrawler}\n` : '';
    
    const message = `🎮 Мой профиль Brawl Stars:\n\n` +
                   `🏷️ Тег: ${playerTag}\n` +
                   `🏆 Трофеев: ${trophies}\n` +
                   `${brawlerText}` +
                   `📱 Предпочитаемый режим: ${modeName}\n\n` +
                   `Ищем команду для игры! 🚀`;
    
    if (typeof tg !== 'undefined' && tg.openTelegramLink) {
        tg.openTelegramLink(`https://t.me/share/url?text=${encodeURIComponent(message)}`);
    } else {
        navigator.clipboard.writeText(message).then(() => {
            alert('✅ Профиль скопирован в буфер обмена! Отправьте его друзьям.');
        }).catch(() => {
            alert(`📋 Профиль для отправки:\n\n${message}`);
        });
    }
}

// Обновление информации в профиле
function updateProfileInfo() {
    const playerTag = document.getElementById('playerTag').value;
    const trophies = document.getElementById('trophies').value;
    const gameMode = document.getElementById('gameMode').value;
    const mainBrawler = document.getElementById('mainBrawler').value;
    
    const profileInfo = document.getElementById('profileInfo');
    
    if (playerTag && trophies) {
        const modeName = getGameModeName(gameMode) || 'не выбран';
        const brawlerText = mainBrawler ? `<p>🎯 Основной бравлер: <strong>${mainBrawler}</strong></p>` : '';
        
        profileInfo.innerHTML = `
            <p>🏷️ Тег: <strong>${playerTag}</strong></p>
            <p>🏆 Трофеев: <strong>${trophies}</strong></p>
            <p>📱 Режим: <strong>${modeName}</strong></p>
            ${brawlerText}
        `;
    } else {
        profileInfo.innerHTML = '<p>Заполните информацию в разделе "Поиск команды"</p>';
    }
}

// Вспомогательные функции
function getGameModeName(mode) {
    const modes = {
        'gem-grab': 'Захват кристаллов',
        'brawl-ball': 'Бравл-бол',
        'heist': 'Ограбление',
        'bounty': 'Награда за голову',
        'siege': 'Осада',
        'hot-zone': 'Горячая зона'
    };
    return modes[mode] || mode;
}

// Работа с локальным хранилищем
function savePlayersToStorage() {
    localStorage.setItem('brawlStarsPlayers', JSON.stringify(playersDatabase));
}

function loadPlayersFromStorage() {
    try {
        const stored = localStorage.getItem('brawlStarsPlayers');
        if (stored) {
            playersDatabase = JSON.parse(stored);
            
            // Очищаем старые записи (старше 24 часов)
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            playersDatabase = playersDatabase.filter(player => 
                now - player.timestamp < dayInMs
            );
            savePlayersToStorage();
        }
    } catch (e) {
        console.log('Ошибка загрузки данных:', e);
        playersDatabase = [];
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    const form = document.getElementById('playerForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const playerData = {
                userId: currentUser?.id || Date.now(),
                playerTag: document.getElementById('playerTag').value.trim(),
                trophies: parseInt(document.getElementById('trophies').value),
                gameMode: document.getElementById('gameMode').value,
                mainBrawler: document.getElementById('mainBrawler').value,
                timestamp: Date.now()
            };

            if (!playerData.playerTag || !playerData.trophies || !playerData.gameMode) {
                alert('⚠️ Пожалуйста, заполните все обязательные поля!');
                return;
            }

            // Добавляем/обновляем игрока в базе
            const existingIndex = playersDatabase.findIndex(p => p.userId === playerData.userId);
            if (existingIndex !== -1) {
                playersDatabase[existingIndex] = playerData;
            } else {
                playersDatabase.push(playerData);
            }
            
            savePlayersToStorage();
            updateProfileInfo();
            
            // Ищем команду
            const teammates = findTeammates(playerData);
            displayTeammates(teammates);
            
            // Показываем уведомление
            if (typeof tg !== 'undefined' && tg.showPopup) {
                tg.showPopup({
                    title: '✅ Успешно!',
                    message: `Найдено ${teammates.length} подходящих игроков`,
                    buttons: [{ type: 'ok' }]
                });
            } else {
                alert(`✅ Найдено ${teammates.length} подходящих игроков!`);
            }
        });
    }

    // Обновляем профиль при изменении полей
    const formFields = ['playerTag', 'trophies', 'gameMode', 'mainBrawler'];
    formFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('change', updateProfileInfo);
            element.addEventListener('input', updateProfileInfo);
        }
    });
}

// Запуск приложения при загрузке
document.addEventListener('DOMContentLoaded', initApp);
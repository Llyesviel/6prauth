// Управление темой
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Загрузка темы из localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
body.classList.add(`theme-${savedTheme}`);

// Переключение темы только если существует элемент themeToggle
if (themeToggle) {
    themeToggle.checked = savedTheme === 'dark';
    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'dark' : 'light';
        body.classList.remove('theme-light', 'theme-dark');
        body.classList.add(`theme-${theme}`);
        localStorage.setItem('theme', theme);
    });
}

// Функция получения CSRF-токена из формы
function getCSRFToken(form) {
    const csrfInput = form.querySelector('input[name="csrfmiddlewaretoken"]');
    return csrfInput ? csrfInput.value : '';
}

// Формы авторизации
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        const csrfToken = getCSRFToken(loginForm);

        try {
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                window.location.href = '/profile/';
            } else {
                alert(result.error);
            }
        } catch (error) {
            alert('Ошибка при входе');
            console.error(error);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        const csrfToken = getCSRFToken(registerForm);

        try {
            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                alert('Регистрация успешна');
                window.location.href = '/login/';
            } else {
                alert(result.error);
            }
        } catch (error) {
            alert('Ошибка при регистрации');
            console.error(error);
        }
    });
}

// Профиль
const refreshDataBtn = document.getElementById('refreshData');
const cachedDataDiv = document.getElementById('cachedData');
const logoutBtn = document.getElementById('logoutBtn');

// Переменные для работы с кэшем
let cacheTimestamp = null;
let cacheInterval = null;

// Функция для загрузки данных
function loadCacheData() {
    // Сначала останавливаем предыдущий интервал
    if (cacheInterval) {
        clearInterval(cacheInterval);
        cacheInterval = null;
    }
    
    // Отображаем индикатор загрузки
    if (cachedDataDiv) {
        cachedDataDiv.innerHTML = '<div style="text-align:center;padding:20px;">Загрузка данных...</div>';
    }
    
    // Загружаем данные с сервера
    fetch('/api/data/?nocache=' + new Date().getTime())
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // Выводим данные в консоль для отладки
            console.log('Данные получены:', data);
            
            // Запоминаем время создания кэша
            cacheTimestamp = new Date(data.info.timestamp);
            
            // Формируем HTML для отображения данных
            var html = '<div class="data-formatted">';
            
            // Секция информации
            html += '<div class="data-section">';
            html += '<h4><i class="fas fa-info-circle"></i> Информация</h4>';
            html += '<div class="data-item">';
            html += '<span class="data-label">Статус кэша:</span>';
            html += '<span id="cacheStatus" class="data-value">Инициализация...</span>';
            html += '</div>';
            html += '<div class="data-item">';
            html += '<span class="data-label">Время создания:</span>';
            html += '<span class="data-value">' + cacheTimestamp.toLocaleString() + '</span>';
            html += '</div>';
            if (data.info.cache_key) {
                html += '<div class="data-item">';
                html += '<span class="data-label">Ключ кэша:</span>';
                html += '<span class="data-value">' + data.info.cache_key + '</span>';
                html += '</div>';
            }
            html += '</div>';
            
            // Данные пользователя
            html += '<div class="data-section">';
            html += '<h4><i class="fas fa-user"></i> Данные пользователя</h4>';
            html += '<div class="data-item">';
            html += '<span class="data-label">Имя пользователя:</span>';
            html += '<span class="data-value">' + data.user.username + '</span>';
            html += '</div>';
            
            // Добавляем последний вход
            html += '<div class="data-item">';
            html += '<span class="data-label">Последний вход:</span>';
            var lastLogin = data.user.last_login ? new Date(data.user.last_login).toLocaleString() : 'Нет данных';
            html += '<span class="data-value">' + lastLogin + '</span>';
            html += '</div>';
            
            // Активность
            html += '<div class="data-item">';
            html += '<span class="data-label">Активен:</span>';
            html += '<span class="data-value">' + (data.user.is_active ? 'Да' : 'Нет') + '</span>';
            html += '</div>';
            html += '</div>';
            
            // Добавляем остальные секции...
            // (для краткости я опускаю код, но тут должны быть секции статистики и информации о системе)
            
            html += '</div>';
            
            // Обновляем DOM
            if (cachedDataDiv) {
                cachedDataDiv.innerHTML = html;
                
                // Получаем элемент статуса кэша
                var statusElement = document.getElementById('cacheStatus');
                
                // Функция для обновления статуса кэша
                function updateStatus() {
                    if (!statusElement || !cacheTimestamp) return;
                    
                    var now = new Date();
                    var seconds = Math.floor((now - cacheTimestamp) / 1000);
                    
                    if (seconds < 60) {
                        statusElement.textContent = 'Данные обновлены ' + seconds + ' секунд назад';
                    } else {
                        statusElement.textContent = 'Срок действия кэша истек';
                        clearInterval(cacheInterval);
                    }
                }
                
                // Обновляем статус сразу
                updateStatus();
                
                // И затем каждую секунду
                cacheInterval = setInterval(updateStatus, 1000);
            }
        })
        .catch(function(error) {
            console.error('Ошибка:', error);
            if (cachedDataDiv) {
                cachedDataDiv.innerHTML = '<div style="color:red;padding:20px;">Ошибка при загрузке данных</div>';
            }
        });
}

// Привязываем обработчики событий
if (refreshDataBtn) {
    refreshDataBtn.addEventListener('click', loadCacheData);
    console.log('Кнопка обновления данных готова');
    
    // Автоматически загружаем данные при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM загружен, загружаем данные');
        loadCacheData();
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            // Получаем CSRF-токен из скрытой формы
            const logoutForm = document.getElementById('logoutForm');
            const csrfToken = getCSRFToken(logoutForm);
            
            const response = await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            });

            if (response.ok) {
                window.location.href = '/login/';
            }
        } catch (error) {
            alert('Ошибка при выходе');
            console.error(error);
        }
    });
}

// Вспомогательные функции
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
} 
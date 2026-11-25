let currentUser = null;
let currentLoadedGames = [];

// === UTILITÁRIOS E NOTIFICAÇÕES (SEM ALERTS FEIOS DO NAVEGADOR) ===

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info', duration = 3800) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    info: '🎮'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message).replace(/\n/g, '<br>')}</span>
    <button type="button" class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// Sobrescreve alert nativo do navegador para nunca mais exibir a caixa cinza feia
window.alert = function (msg) {
  showToast(msg, 'info', 4000);
};

function showConfirm(title, message, confirmText = "Confirmar", isDanger = true) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    if (!modal) {
      resolve(true);
      return;
    }

    document.getElementById('confirm-title').innerText = title || 'Confirmação';
    document.getElementById('confirm-message').innerText = message || 'Deseja continuar?';

    const iconEl = document.getElementById('confirm-icon');
    if (iconEl) iconEl.innerText = isDanger ? '🗑️' : '❓';

    const okBtn = document.getElementById('confirm-btn-ok');
    okBtn.innerText = confirmText;
    okBtn.className = isDanger ? 'danger' : '';

    const cancelBtn = document.getElementById('confirm-btn-cancel');

    modal.classList.add('active');

    function cleanup(result) {
      modal.classList.remove('active');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }

    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// === AUTENTICAÇÃO E ESTADO INICIAL ===

async function checkSession() {
  const { user } = await apiAuth.getSession();
  updateAuthUI(user || null);
}

function updateAuthUI(user) {
  currentUser = user;
  if (user) {
    document.getElementById('nav-dashboard').style.display = 'inline';
    document.getElementById('nav-profile').style.display = 'inline';
    document.getElementById('nav-login-btn').style.display = 'none';
    document.getElementById('nav-logout-btn').style.display = 'inline';
  } else {
    document.getElementById('nav-dashboard').style.display = 'none';
    document.getElementById('nav-profile').style.display = 'none';
    document.getElementById('nav-login-btn').style.display = 'inline';
    document.getElementById('nav-logout-btn').style.display = 'none';
  }
}

// === NAVEGAÇÃO SPA ===

function navigate(sectionId, param = null) {
  if ((sectionId === 'dashboard' || sectionId === 'profile') && !currentUser) {
    showToast("Você precisa estar logado para acessar esta página.", "info");
    return navigate('login');
  }

  document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

  if (sectionId === 'home') renderHome();
  if (sectionId === 'dashboard') renderDashboard();
  if (sectionId === 'search') renderSearch();
  if (sectionId === 'profile') renderProfile();
  if (sectionId === 'gameDetails') renderGameDetails(param);
}

const FALLBACK_GAMES = [
  {
    id: 119171,
    title: "Baldur's Gate III",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg",
    genre: "RPG, Estratégia, Aventura",
    platform: "PC, PS5, Xbox Series X",
    year: 2023,
    synopsis: "Um mal antigo retornou a Baldur's Gate, determinado a devorá-la por dentro. O destino de Faerûn está em suas mãos. Reúna seu grupo e lute pela sobrevivência."
  },
  {
    id: 1942,
    title: "The Witcher 3: Wild Hunt",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/coaarl.jpg",
    genre: "RPG, Aventura",
    platform: "PC, PS5, PS4, Xbox Series X, Switch",
    year: 2015,
    synopsis: "Como o bruxo Geralt de Rivia, você deve encontrar a Criança da Profecia em um vasto mundo aberto repleto de cidades mercantis, ilhas piratas e perigosas passagens nas montanhas."
  },
  {
    id: 119133,
    title: "Elden Ring",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg",
    genre: "RPG, Ação, Aventura",
    platform: "PC, PS5, PS4, Xbox Series X",
    year: 2022,
    synopsis: "Levante-se, Maculado, e seja guiado pela graça para brandir o poder do Anel Prístino e se tornar um Lorde Prístino nas Terras Intermédias."
  },
  {
    id: 6036,
    title: "The Last of Us Remastered",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5zks.jpg",
    genre: "Ação, Aventura, Tiro",
    platform: "PlayStation 4, PlayStation 5",
    year: 2014,
    synopsis: "Em uma civilização devastada, onde infectados e sobreviventes implacáveis proliferam, Joel é contratado para contrabandear Ellie para fora de uma zona de quarentena militar."
  },
  {
    id: 1802,
    title: "Chrono Trigger",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3plw.jpg",
    genre: "RPG Clássico",
    platform: "SNES, PS1, PC, Nintendo DS",
    year: 1995,
    synopsis: "O jovem Crono deve viajar no tempo através de eras para resgatar sua companheira e enfrentar uma força cósmica maligna destinada a destruir o planeta."
  },
  {
    id: 25076,
    title: "Red Dead Redemption 2",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg",
    genre: "Ação, Tiro, Aventura",
    platform: "PC, PS4, Xbox One",
    year: 2018,
    synopsis: "Estados Unidos, 1899. Arthur Morgan e a gangue Van der Linde são forçados a fugir em meio a assaltos e conflitos enquanto a era dos foras-da-lei chega ao fim."
  },
  {
    id: 1009,
    title: "The Last of Us",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg",
    genre: "Ação, Aventura",
    platform: "PlayStation 3",
    year: 2013,
    synopsis: "Uma jornada emocionante e brutal pelo território dos Estados Unidos pós-pandêmico onde o vínculo entre Joel e Ellie é testado ao limite."
  },
  {
    id: 379,
    title: "Metal Gear Solid 3: Snake Eater",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5ei5.jpg",
    genre: "Ação, Furtividade, Tiro",
    platform: "PlayStation 2, PC, Multi",
    year: 2004,
    synopsis: "Durante a Guerra Fria, Naked Snake deve infiltrar-se em território soviético para resgatar um cientista desertor e impedir o avanço de uma superarma nuclear."
  },
  {
    id: 26472,
    title: "Disco Elysium",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1sfj.jpg",
    genre: "RPG, Investigação, Indie",
    platform: "PC, PS4, PS5, Switch, Xbox",
    year: 2019,
    synopsis: "Você é um detetive com um sistema de habilidades único e um quarteirão inteiro para explorar. Interrogue personagens inesquecíveis, desvende assassinatos ou aceite subornos."
  },
  {
    id: 7346,
    title: "The Legend of Zelda: Breath of the Wild",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg",
    genre: "Aventura, RPG, Quebra-cabeça",
    platform: "Nintendo Switch, Wii U",
    year: 2017,
    synopsis: "Esqueça tudo o que sabe sobre os jogos The Legend of Zelda. Entre em um mundo de descoberta, exploração e aventura nesta jornada revolucionária por Hyrule."
  },
  {
    id: 9927,
    title: "Persona 5",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r76.jpg",
    genre: "RPG, Aventura",
    platform: "PlayStation 3, PlayStation 4, PC, Switch",
    year: 2016,
    synopsis: "Um grupo de estudantes do ensino médio em Tóquio acorda com poderes misteriosos e formam os Phantom Thieves para reformar os corações corruptos da sociedade."
  },
  {
    id: 1103,
    title: "Super Metroid",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5osy.jpg",
    genre: "Metroidvania, Ação, Plataforma",
    platform: "SNES, Nintendo Switch",
    year: 1994,
    synopsis: "Samus Aran retorna ao planeta Zebes para recuperar a última larva Metroid roubada pelos temíveis Piratas Espaciais liderados por Mother Brain."
  },
  {
    id: 19560,
    title: "God of War",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobkt6.jpg",
    genre: "Ação, Hack and Slash, Aventura",
    platform: "PlayStation 4, PC, PlayStation 5",
    year: 2018,
    synopsis: "Vivendo como um homem fora da sombra dos deuses nórdicos, Kratos deve se adaptar a terras desconhecidas, perigos impiedosos e a uma segunda chance de ser pai."
  },
  {
    id: 1026,
    title: "The Legend of Zelda: A Link to the Past",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co3vzn.jpg",
    genre: "Aventura, Quebra-cabeça",
    platform: "SNES, Game Boy Advance, Switch",
    year: 1991,
    synopsis: "Viaje entre o Mundo da Luz e o Mundo das Trevas para resgatar as donzelas e impedir os planos de Ganon de dominar a terra sagrada de Hyrule."
  },
  {
    id: 14593,
    title: "Hollow Knight",
    cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/cobfzp.jpg",
    genre: "Metroidvania, Indie, Plataforma",
    platform: "PC, PS4, Xbox One, Switch",
    year: 2017,
    synopsis: "Forje seu próprio caminho através das ruínas de Hallownest, um vasto reino subterrâneo esquecido repleto de insetos, heróis, mistérios e perigos mortais."
  }
];

// === FUNÇÕES DE RENDERIZAÇÃO ===

async function renderHome() {
  if (currentUser) {
    document.getElementById("remove").style.display = "none";
  }
  const container = document.getElementById('home-featured-games');
  container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; width: 100%; padding: 1.5rem 0; color: var(--primary);">Carregando Destaques da Twitch/IGDB...</p>';

  let games = await getTopGamesIGDB();
  let isFallback = false;

  if (!games || games.length === 0) {
    console.warn('Backend/IGDB indisponível. Carregando catálogo em modo de demonstração...');
    games = FALLBACK_GAMES;
    isFallback = true;
  }

  currentLoadedGames = games;

  container.innerHTML = '';

  if (isFallback) {
    const warning = document.createElement('div');
    warning.style.cssText = 'width: 100%; grid-column: 1 / -1; margin-bottom: 1rem; padding: 0.8rem 1rem; background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); border-radius: 8px; color: #fca5a5; font-size: 0.9rem; text-align: center;';
    warning.innerHTML = '⚠️ <strong>Aviso:</strong> A conexão com a API está temporariamente inativa. Exibindo jogos em modo de demonstração.';
    container.appendChild(warning);
  }

  games.forEach(game => {
    container.innerHTML += `
      <div class="card game-card" onclick="navigate('gameDetails', ${game.id})">
        <img src="${game.cover}" alt="${game.title}">
        <h3 style="margin-top: 0.5rem; font-size: 1.1rem; color: var(--secondary);">${game.title}</h3>
      </div>
    `;
  });
}

async function renderDashboard() {
  const container = document.getElementById('dashboard-logs');
  container.innerHTML = '<p style="text-align: center; padding: 1rem 0; color: var(--primary);">Buscando atividades da comunidade...</p>';

  // Puxa os últimos logs do backend PHP com o nome do usuário
  const { data: logs, error } = await apiLogs.getRecent();

  container.innerHTML = '';

  if (error || !logs || logs.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 1rem 0; color: var(--text-muted);">Nenhuma atividade recente encontrada.</p>';
    return;
  }

  logs.forEach(log => {
    const userName = log.profiles?.name || log.user_name || 'Gamer Anônimo';
    container.innerHTML += `
      <li style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem;">
        <p style="font-size: 1.1rem;">
          <strong style="color:var(--primary);">${escapeHtml(userName)}</strong> marcou 
          <strong style="color:var(--secondary); cursor:pointer;" onclick="navigate('gameDetails', ${log.game_id})">${escapeHtml(log.game_title)}</strong> 
          como <em style="text-transform: uppercase; font-size: 0.9em; opacity: 0.8;">${escapeHtml(log.status)}</em>
        </p>
        ${log.review ? `<p style="font-style: italic; color: var(--text-muted); margin-top: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-left: 3px solid var(--primary);">"${escapeHtml(log.review)}" <br><span style="color:#ffd700;">★ ${log.rating}/10</span></p>` : ''}
      </li>
    `;
  });
}

let searchDebounceTimer = null;
let currentSearchToken = 0;

function handleSearchDebounced() {
  clearTimeout(searchDebounceTimer);
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');

  if (!query) {
    renderSearch();
    return;
  }

  if (query.length < 2) {
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    handleSearch(false);
  }, 600);
}

async function handleSearch(immediate = false) {
  if (immediate) {
    clearTimeout(searchDebounceTimer);
  }

  const query = document.getElementById('search-input').value.trim();
  const genreFilter = document.getElementById('filter-genre').value.trim().toLowerCase();
  const platformFilter = document.getElementById('filter-platform').value.trim().toLowerCase();
  const container = document.getElementById('search-results');

  if (!query) {
    renderSearch();
    return;
  }

  const myToken = ++currentSearchToken;
  container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; width: 100%; padding: 1.5rem 0; color: var(--primary);">Pesquisando no Banco de Dados Mundial...</p>';
  let results = await searchIGDB(query);

  // Ignora respostas antigas se o usuário já iniciou uma nova busca
  if (myToken !== currentSearchToken) return;

  let isLocalSearch = false;

  if (!results || results.length === 0) {
    const qLower = query.toLowerCase();
    const localMatches = FALLBACK_GAMES.filter(g =>
      g.title.toLowerCase().includes(qLower) ||
      g.genre.toLowerCase().includes(qLower)
    );
    if (localMatches.length > 0) {
      results = localMatches;
      isLocalSearch = true;
    }
  }

  // Aplica filtros de gênero e plataforma quando selecionados
  if (results && results.length > 0) {
    if (genreFilter) {
      const genreMap = { 'ação': 'action', 'aventura': 'adventure', 'rpg': 'rpg' };
      const mapped = genreMap[genreFilter] || genreFilter;
      results = results.filter(g =>
        g.genre.toLowerCase().includes(genreFilter) || g.genre.toLowerCase().includes(mapped)
      );
    }
    if (platformFilter) {
      const platMap = { 'ps5': 'playstation 5', 'pc': 'pc' };
      const mapped = platMap[platformFilter] || platformFilter;
      results = results.filter(g =>
        g.platform.toLowerCase().includes(platformFilter) || g.platform.toLowerCase().includes(mapped)
      );
    }
  }

  currentLoadedGames = results || [];

  container.innerHTML = '';
  if (!results || results.length === 0) {
    container.innerHTML = '<p style="grid-column: 1 / -1; color: var(--danger); text-align: center; width: 100%; padding: 1.5rem 0;">Nenhum jogo encontrado com esse nome ou filtro.</p>';
    return;
  }

  if (isLocalSearch) {
    const notice = document.createElement('p');
    notice.style.cssText = 'grid-column: 1 / -1; color: var(--text-muted); font-size: 0.9rem; text-align: center; margin-bottom: 1rem;';
    notice.innerText = 'Exibindo correspondências do catálogo local (a API de busca online está temporariamente offline).';
    container.appendChild(notice);
  }

  results.forEach(game => {
    container.innerHTML += `
      <div class="card game-card" onclick="navigate('gameDetails', ${game.id})">
        <img src="${game.cover}" alt="${escapeHtml(game.title)}">
        <h3 style="margin-top: 0.5rem; font-size: 1.1rem; color: var(--secondary);">${escapeHtml(game.title)}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">${game.year} • ${escapeHtml(game.platform.substring(0, 20))}</p>
      </div>
    `;
  });
}

function renderSearch() {
  document.getElementById('search-results').innerHTML = '<p style="grid-column: 1 / -1; text-align: center; width: 100%; padding: 1.5rem 0; color: var(--text-muted);">Digite o nome de um jogo para buscar na IGDB.</p>';
}

let currentGameId = null;

// === ESTADO GLOBAL DO PERFIL E LOGS ===
let currentUserLogs = [];
let currentLogFilter = 'todos';
let currentProfileData = null;

async function renderGameDetails(id) {
  currentGameId = id;
  let game = currentLoadedGames.find(g => g.id === id);
  if (!game) {
    game = FALLBACK_GAMES.find(g => g.id === id);
  }
  if (!game && currentUserLogs.length > 0) {
    const userLog = currentUserLogs.find(l => l.game_id === id);
    if (userLog) {
      game = {
        id: id,
        title: userLog.game_title,
        cover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co670h.jpg',
        genre: 'Biblioteca Pessoal',
        platform: 'Plataforma Salva',
        year: '—',
        synopsis: 'Jogo registrado em seu backlog pessoal SavePoint.'
      };
      currentLoadedGames.push(game);
    }
  }

  if (!game) {
    showToast("Dados do jogo não encontrados.", "error");
    return navigate('home');
  }

  document.getElementById('game-detail-cover').src = game.cover;
  document.getElementById('game-detail-title').innerText = game.title;
  document.getElementById('game-detail-info').innerText = `${game.year} • ${game.genre} • ${game.platform}`;
  document.getElementById('game-detail-synopsis').innerText = game.synopsis;

  const reviewsContainer = document.getElementById('game-reviews');
  reviewsContainer.innerHTML = '<p style="text-align: center; padding: 1rem 0; color: var(--primary);">Carregando reviews da comunidade...</p>';

  // Busca reviews deste jogo específico no backend PHP
  const { data: gameLogs, error } = await apiLogs.getByGame(id);

  reviewsContainer.innerHTML = '';
  if (error || !gameLogs || gameLogs.length === 0) {
    reviewsContainer.innerHTML = '<p style="text-align: center; padding: 1rem 0; color: var(--text-muted);">Ainda não há reviews para este jogo. Seja o primeiro!</p>';
  } else {
    gameLogs.forEach(log => {
      const userName = log.profiles?.name || log.user_name || 'Anônimo';
      const ratingDisplay = (typeof log.rating === 'number' && log.rating >= 0 && log.rating <= 10)
        ? `★ ${log.rating}/10`
        : 'Sem nota';
      reviewsContainer.innerHTML += `
        <li class="card" style="margin-bottom: 1rem;">
          <p><strong style="color:var(--primary);">${escapeHtml(userName)}</strong> - <span style="color:#ffd700;">${ratingDisplay}</span></p>
          <p style="margin-top: 0.5rem; color: var(--text-main);">"${escapeHtml(log.review)}"</p>
        </li>
      `;
    });
  }
  closeLogModal();
}

// === TELA DE PERFIL ===

async function renderProfile() {
  if (!currentUser) return;

  // 1. Buscar dados do perfil do backend PHP
  const { data: profile } = await apiProfile.get();
  if (profile) {
    currentProfileData = profile;
    currentUser = { ...currentUser, ...profile };
  }

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfileData?.name || currentUser.email || 'Gamer')}&background=9d4edd&color=fff`;
  document.getElementById('profile-avatar').src = currentProfileData?.avatar_url || defaultAvatar;
  document.getElementById('profile-name').innerText = currentProfileData?.name || (currentUser.email ? currentUser.email.split('@')[0] : 'Gamer');
  document.getElementById('profile-email').innerText = currentUser.email || '';
  document.getElementById('profile-bio').innerText = currentProfileData?.bio || "Gamer em evolução no SavePoint. Nenhuma bio adicionada ainda.";

  // 2. Carregar logs do usuário do backend PHP
  const logsContainer = document.getElementById('profile-logs');
  logsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem 0;">Carregando seu histórico de jogos...</p>';

  const { data: userLogs } = await apiLogs.getUserLogs();

  currentUserLogs = userLogs || [];

  // 3. Atualizar estatísticas Gamer
  updateProfileStats(currentUserLogs);

  // 4. Renderizar logs com base no filtro
  renderFilteredProfileLogs();

  // 5. Renderizar Listas do Usuário
  renderCustomLists();
}

function updateProfileStats(logs) {
  const total = logs.length;
  const playing = logs.filter(l => l.status === 'jogando').length;
  const completed = logs.filter(l => l.status === 'concluido').length;
  const backlog = logs.filter(l => l.status === 'backlog').length;
  const abandoned = logs.filter(l => l.status === 'abandonado').length;

  const ratedLogs = logs.filter(l => typeof l.rating === 'number' && l.rating >= 0 && l.rating <= 10);
  const avgRating = ratedLogs.length > 0
    ? (ratedLogs.reduce((acc, curr) => acc + curr.rating, 0) / ratedLogs.length).toFixed(1)
    : '-';

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-playing').innerText = playing;
  document.getElementById('stat-completed').innerText = completed;
  document.getElementById('stat-backlog').innerText = backlog;
  document.getElementById('stat-abandoned').innerText = abandoned;
  document.getElementById('stat-avg-rating').innerText = avgRating !== '-' ? `★ ${avgRating}` : '-';
}

function filterProfileLogs(status) {
  currentLogFilter = status;

  document.querySelectorAll('#profile-filter-tabs .filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = Array.from(document.querySelectorAll('#profile-filter-tabs .filter-btn'))
    .find(b => b.getAttribute('onclick')?.includes(`'${status}'`));
  if (activeBtn) activeBtn.classList.add('active');

  renderFilteredProfileLogs();
}

function renderFilteredProfileLogs() {
  const container = document.getElementById('profile-logs');
  const countEl = document.getElementById('profile-logs-count');

  let list = currentUserLogs;
  if (currentLogFilter !== 'todos') {
    list = currentUserLogs.filter(l => l.status === currentLogFilter);
  }

  if (countEl) {
    countEl.innerText = `${list.length} ${list.length === 1 ? 'jogo' : 'jogos'}`;
  }

  container.innerHTML = '';
  if (list.length === 0) {
    if (currentUserLogs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎮</div>
          <p style="color:var(--text-main); font-weight:600;">Seu histórico está vazio</p>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-top:0.3rem;">Vá até o Catálogo de Busca ou Destaques para adicionar seu primeiro jogo!</p>
          <button onclick="navigate('search')" style="margin-top: 1rem; font-size: 0.85rem;">Explorar Catálogo</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <p style="color:var(--text-muted); font-size:0.95rem;">Nenhum jogo com status "${currentLogFilter}".</p>
        </div>
      `;
    }
    return;
  }

  list.forEach(log => {
    const statusClass = `badge-${log.status || 'jogando'}`;
    const statusLabel = {
      jogando: '🎮 Jogando',
      concluido: '🏆 Concluído',
      backlog: '⏳ Backlog',
      abandonado: '🛑 Abandonado'
    }[log.status] || log.status;

    const displayRating = (typeof log.rating === 'number' && log.rating >= 0 && log.rating <= 10)
      ? `<span style="color:#ffd700; font-weight:600;">★ ${log.rating}/10</span>`
      : `<span style="color:var(--text-muted); font-size:0.85rem;">Sem nota</span>`;

    container.innerHTML += `
      <li class="card" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
          <div>
            <h4 style="font-size: 1.15rem; margin-bottom: 0.2rem;">
              <a href="#" onclick="navigate('gameDetails', ${log.game_id})">${escapeHtml(log.game_title)}</a>
            </h4>
            <div style="display: flex; gap: 0.6rem; align-items: center; margin-top: 0.3rem;">
              <span class="status-badge ${statusClass}">${statusLabel}</span>
              ${displayRating}
            </div>
          </div>
          <div class="log-actions">
            <button class="btn-icon" title="Editar este registro" onclick="openEditLogModal('${log.id}')">✏️ Editar</button>
            <button class="btn-icon delete" title="Remover do histórico" onclick="deleteLog('${log.id}')">🗑️</button>
          </div>
        </div>
        ${log.review ? `<p style="margin-top: 0.3rem; font-style:italic; color:var(--text-muted); font-size:0.95rem; background: rgba(0,0,0,0.25); padding: 0.6rem 0.8rem; border-left: 3px solid var(--primary); border-radius: 4px;">"${escapeHtml(log.review)}"</p>` : ''}
      </li>
    `;
  });
}

// === EXCLUSÃO E EDIÇÃO DE LOGS DE JOGOS ===

async function deleteLog(logId) {
  if (!currentUser) {
    showToast("Você precisa estar logado para excluir um registro.", "info");
    return;
  }

  const confirmed = await showConfirm(
    "Remover Jogo",
    "Tem certeza que deseja remover este jogo do seu histórico?",
    "Sim, Excluir",
    true
  );
  if (!confirmed) return;

  const targetId = !isNaN(Number(logId)) ? Number(logId) : logId;

  const { error } = await apiLogs.delete(targetId);

  if (error) {
    console.error("Erro ao remover no backend:", error);
    showToast("Erro ao remover do banco: " + error.message, "error");
    return;
  }

  // Deletado com sucesso no banco de dados!
  currentUserLogs = currentUserLogs.filter(l => l.id != targetId);
  updateProfileStats(currentUserLogs);
  renderFilteredProfileLogs();
  showToast("Jogo removido do seu histórico!", "success");
}

function openEditLogModal(logId) {
  const log = currentUserLogs.find(l => l.id == logId);
  if (!log) return;

  document.getElementById('edit-log-id').value = log.id;
  document.getElementById('edit-log-title').innerText = `Editar: ${log.game_title}`;
  document.getElementById('edit-log-status').value = log.status || 'jogando';
  document.getElementById('edit-log-rating').value = (typeof log.rating === 'number' && log.rating >= 0 && log.rating <= 10) ? log.rating : '';
  document.getElementById('edit-log-review').value = log.review || '';

  document.getElementById('edit-log-modal').classList.add('active');
}

function closeEditLogModal() {
  document.getElementById('edit-log-modal').classList.remove('active');
}

async function handleUpdateLog(e) {
  e.preventDefault();
  if (!currentUser) {
    showToast("Você precisa estar logado para editar uma análise.", "info");
    return;
  }

  const logId = document.getElementById('edit-log-id').value;
  const status = document.getElementById('edit-log-status').value;
  const ratingInput = document.getElementById('edit-log-rating').value.trim();
  const review = document.getElementById('edit-log-review').value.trim();

  let cleanRating = null;
  if (ratingInput !== '') {
    const parsed = parseInt(ratingInput, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      showToast("A nota deve ser um número inteiro entre 0 e 10.", "error");
      return;
    }
    cleanRating = parsed;
  }

  const targetId = !isNaN(Number(logId)) ? Number(logId) : logId;

  const { error } = await apiLogs.update({
    id: targetId,
    status: status,
    rating: cleanRating,
    review: review || null
  });

  if (error) {
    console.error("Erro ao atualizar no backend:", error);
    showToast("Erro ao atualizar registro no banco: " + error.message, "error");
    return;
  }

  // Atualizado com sucesso no banco de dados!
  closeEditLogModal();
  const target = currentUserLogs.find(l => l.id == targetId);
  if (target) {
    target.status = status;
    target.rating = cleanRating;
    target.review = review || null;
  }
  updateProfileStats(currentUserLogs);
  renderFilteredProfileLogs();
  showToast("Análise atualizada com sucesso!", "success");
}

// === EDIÇÃO DE PERFIL E UPLOAD DE IMAGEM ===
let selectedAvatarFile = null;
let selectedAvatarDataUrl = null;

function compressAvatarImage(file, maxWidth = 260, maxHeight = 260, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

async function handleAvatarFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).", "error");
    return;
  }

  const statusEl = document.getElementById('avatar-file-status');
  statusEl.innerText = "Processando e otimizando imagem...";

  try {
    const compressedDataUrl = await compressAvatarImage(file);
    selectedAvatarFile = file;
    selectedAvatarDataUrl = compressedDataUrl;

    document.getElementById('avatar-upload-preview').src = compressedDataUrl;
    document.getElementById('edit-profile-avatar').value = compressedDataUrl;

    // Desmarca presets
    document.querySelectorAll('.preset-avatar-img').forEach(img => img.classList.remove('selected'));

    const sizeKb = Math.round(compressedDataUrl.length * 0.75 / 1024);
    statusEl.innerHTML = `✅ <strong>${escapeHtml(file.name)}</strong> pronto para salvar (${sizeKb} KB).`;
  } catch (err) {
    console.error("Erro ao processar imagem:", err);
    statusEl.innerText = "Erro ao processar imagem. Tente outro arquivo.";
  }
}

function openEditProfileModal() {
  if (!currentUser) return;

  selectedAvatarFile = null;
  selectedAvatarDataUrl = null;

  const currentName = currentProfileData?.name || (currentUser.email ? currentUser.email.split('@')[0] : '');
  const currentBio = currentProfileData?.bio || '';
  const currentAvatar = currentProfileData?.avatar_url || '';

  document.getElementById('edit-profile-name').value = currentName;
  document.getElementById('edit-profile-bio').value = currentBio;
  document.getElementById('edit-profile-avatar').value = currentAvatar;

  const previewEl = document.getElementById('avatar-upload-preview');
  previewEl.src = currentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName || 'Gamer')}&background=9d4edd&color=fff`;

  const statusEl = document.getElementById('avatar-file-status');
  statusEl.innerText = "Formatos: PNG, JPG, WebP (será otimizada e salva no banco)";

  document.querySelectorAll('.preset-avatar-img').forEach(img => {
    img.classList.toggle('selected', img.src === currentAvatar);
  });

  document.getElementById('edit-profile-modal').classList.add('active');
}

function closeEditProfileModal() {
  document.getElementById('edit-profile-modal').classList.remove('active');
}

function selectAvatarPreset(url) {
  selectedAvatarFile = null;
  selectedAvatarDataUrl = null;

  document.getElementById('edit-profile-avatar').value = url;
  document.getElementById('avatar-upload-preview').src = url;
  document.getElementById('avatar-file-status').innerText = "Avatar predefinido selecionado.";

  document.querySelectorAll('.preset-avatar-img').forEach(img => {
    img.classList.toggle('selected', img.src === url);
  });
}

async function handleSaveProfile(e) {
  e.preventDefault();
  if (!currentUser) return;

  const name = document.getElementById('edit-profile-name').value.trim();
  const bio = document.getElementById('edit-profile-bio').value.trim();
  let avatar_url = document.getElementById('edit-profile-avatar').value.trim();

  let payload;
  if (selectedAvatarFile) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    formData.append('avatar', selectedAvatarFile);
    payload = formData;
  } else {
    payload = {
      name: name,
      bio: bio,
      avatar_url: avatar_url || selectedAvatarDataUrl || null
    };
  }

  const { data: updatedProfile, error } = await apiProfile.update(payload);

  if (error) {
    console.error("Erro ao salvar perfil:", error);
    showToast("Erro ao salvar perfil no backend: " + error.message, "error");
    return;
  }

  currentProfileData = updatedProfile || { name, bio, avatar_url };
  currentUser = { ...currentUser, ...currentProfileData };

  const displayAvatar = currentProfileData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=9d4edd&color=fff`;
  document.getElementById('profile-avatar').src = displayAvatar;
  document.getElementById('profile-name').innerText = name || currentUser.email;
  document.getElementById('profile-bio').innerText = bio || "Gamer em evolução no SavePoint.";

  closeEditProfileModal();
  showToast("Foto e perfil atualizados com sucesso!", "success");
}

// === LISTAS PERSONALIZADAS (INTEGRADAS AO BANCO PHP) ===

async function renderCustomLists() {
  const container = document.getElementById('profile-custom-lists');
  if (!container) return;

  let lists = [];
  const { data, error } = await apiLists.getAll();
  if (!error && Array.isArray(data)) {
    lists = data;
  }

  if (lists.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.7;">📋</div>
        <p style="color:var(--text-main); font-weight:600; font-size: 0.95rem;">Nenhuma lista criada</p>
        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.3rem;">
          Organize seus jogos em listas personalizadas como "Top RPGs", "Zerar em 2026", "Favoritos", etc.
        </p>
        <button onclick="openCreateListModal()" style="margin-top: 1rem; font-size: 0.85rem; padding: 0.4rem 0.8rem;">+ Criar Minha Primeira Lista</button>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  lists.forEach(l => {
    const createdDate = l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : 'Recentemente';
    container.innerHTML += `
      <div class="card" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; border-left: 3px solid var(--secondary);">
        <div>
          <h4 style="font-size: 1.1rem; color: var(--text-main);">${escapeHtml(l.name)}</h4>
          <p style="color: var(--text-muted); font-size:0.85rem; margin-top: 0.2rem;">${escapeHtml(l.desc || 'Sem descrição')} • Criada em ${createdDate}</p>
        </div>
        <button class="btn-icon delete" title="Excluir lista" onclick="deleteCustomList('${l.id}')">🗑️</button>
      </div>
    `;
  });
}

function openCreateListModal() {
  document.getElementById('new-list-name').value = '';
  document.getElementById('new-list-desc').value = '';
  document.getElementById('create-list-modal').classList.add('active');
}

function closeCreateListModal() {
  document.getElementById('create-list-modal').classList.remove('active');
}

async function handleCreateList(e) {
  e.preventDefault();
  const name = document.getElementById('new-list-name').value.trim();
  const desc = document.getElementById('new-list-desc').value.trim();

  if (!name) return;

  const { data, error } = await apiLists.create({ name, desc });
  if (error) {
    showToast("Erro ao criar lista: " + error.message, "error");
    return;
  }

  closeCreateListModal();
  renderCustomLists();
  showToast("Lista criada com sucesso!", "success");
}

async function deleteCustomList(listId) {
  const confirmed = await showConfirm(
    "Excluir Lista",
    "Deseja realmente excluir esta lista personalizada?",
    "Sim, Excluir",
    true
  );
  if (!confirmed) return;

  const { error } = await apiLists.delete(listId);
  if (error) {
    showToast("Erro ao remover lista: " + error.message, "error");
    return;
  }

  renderCustomLists();
  showToast("Lista removida com sucesso!", "success");
}

// === FORMULÁRIOS & MODAIS DE AUTENTICAÇÃO E REGISTRO ===

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await apiAuth.login(email, password);
  if (error) {
    showToast("Erro ao fazer login: " + error.message, "error");
  } else {
    updateAuthUI(data.user);
    showToast("Login realizado com sucesso! Bem-vindo.", "success");
    navigate('home');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  const { data, error } = await apiAuth.register(name, email, password);

  if (error) {
    showToast("Erro no cadastro da conta: " + error.message, "error");
  } else {
    updateAuthUI(data.user);
    showToast("Cadastro realizado com sucesso! Bem-vindo.", "success", 5000);
    navigate('home');
  }
}

async function handleLogout() {
  await apiAuth.logout();
  updateAuthUI(null);
  showToast("Você saiu da sua conta.", "info");
  navigate('home');
}

function openLogModal() {
  if (!currentUser) {
    showToast("Faça login para poder registrar jogos no seu perfil.", "info");
    return navigate('login');
  }
  // Atualiza o título do modal com o nome do jogo atual
  const game = currentLoadedGames.find(g => g.id === currentGameId)
    || (typeof FALLBACK_GAMES !== 'undefined' && FALLBACK_GAMES.find(g => g.id === currentGameId));
  const titleEl = document.getElementById('log-modal-title');
  if (titleEl && game) titleEl.innerText = `Adicionar ao Log — ${game.title}`;
  document.getElementById('log-modal').classList.add('active');
}

function closeLogModal() {
  const modal = document.getElementById('log-modal');
  if (modal) modal.classList.remove('active');
  const status = document.getElementById('log-status');
  const rating = document.getElementById('log-rating');
  const review = document.getElementById('log-review');
  if (status) status.value = 'jogando';
  if (rating) rating.value = '';
  if (review) review.value = '';
}

async function saveLog() {
  if (!currentUser) return;

  const status = document.getElementById('log-status').value;
  const ratingInput = document.getElementById('log-rating').value.trim();
  const review = document.getElementById('log-review').value.trim();
  const game = currentLoadedGames.find(g => g.id === currentGameId);

  if (!game) {
    showToast("Erro: Jogo não encontrado.", "error");
    return;
  }

  // Validação estrita de nota: entre 0 e 10 (impede notas negativas)
  let cleanRating = null;
  if (ratingInput !== '') {
    const parsed = parseInt(ratingInput, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      showToast("A nota deve ser um número inteiro entre 0 e 10. Notas negativas não são permitidas!", "error");
      return;
    }
    cleanRating = parsed;
  }

  const { error } = await apiLogs.create({
    game_id: game.id,
    game_title: game.title,
    status: status,
    rating: cleanRating,
    review: review || null
  });

  if (error) {
    showToast("Erro ao salvar: " + error.message, "error");
  } else {
    showToast("Jogo salvo no seu backlog com sucesso!", "success");
    closeLogModal();
    renderGameDetails(currentGameId);
  }
}

// Fechar modais ao clicar no backdrop ou apertar Escape
window.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    closeLogModal();
  }
});

// Inicialização
window.onload = () => {
  checkSession();
  renderHome();
};


/**
 * SavePoint - Cliente de API para o Backend Local em PHP
 * Substitui o Supabase por chamadas REST aos endpoints PHP locais com suporte a Sessão
 */

const API_BASE = 'api';

/**
 * Função utilitária para requisições HTTP (GET, POST, etc.)
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  const config = {
    ...options,
    credentials: 'include', // Envia cookies de sessão (PHPSESSID)
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.error || `Erro HTTP ${response.status}`;
      return { data: null, error: new Error(errorMsg) };
    }

    return { data, error: null };
  } catch (err) {
    console.error(`Erro ao requisitar [${url}]:`, err);
    return { data: null, error: err };
  }
}

// ==========================================
// MÓDULO DE AUTENTICAÇÃO
// ==========================================
const apiAuth = {
  async getSession() {
    const { data, error } = await fetchApi('auth.php?action=session');
    if (error || !data || !data.authenticated) {
      return { session: null, user: null };
    }
    return { session: { user: data.user }, user: data.user };
  },

  async login(email, password) {
    return await fetchApi('auth.php?action=login', {
      method: 'POST',
      body: { email, password }
    });
  },

  async register(name, email, password) {
    return await fetchApi('auth.php?action=register', {
      method: 'POST',
      body: { name, email, password }
    });
  },

  async logout() {
    return await fetchApi('auth.php?action=logout', {
      method: 'POST'
    });
  }
};

// ==========================================
// MÓDULO DE PERFIL DE USUÁRIO
// ==========================================
const apiProfile = {
  async get() {
    const { data, error } = await fetchApi('profile.php', { method: 'GET' });
    return { data: data?.profile || null, error };
  },

  async update(profilePayload) {
    let options = { method: 'POST' };

    if (profilePayload instanceof FormData) {
      options.body = profilePayload;
    } else {
      options.body = profilePayload;
    }

    const { data, error } = await fetchApi('profile.php', options);
    return { data: data?.profile || null, error };
  }
};

// ==========================================
// MÓDULO DE REGISTROS DE JOGOS (BACKLOG & REVIEWS)
// ==========================================
const apiLogs = {
  async getRecent() {
    const { data, error } = await fetchApi('logs.php?action=recent', { method: 'GET' });
    return { data: data?.data || [], error };
  },

  async getByGame(gameId) {
    const { data, error } = await fetchApi(`logs.php?action=game&game_id=${encodeURIComponent(gameId)}`, { method: 'GET' });
    return { data: data?.data || [], error };
  },

  async getUserLogs() {
    const { data, error } = await fetchApi('logs.php?action=user', { method: 'GET' });
    return { data: data?.data || [], error };
  },

  async create(logData) {
    return await fetchApi('logs.php', {
      method: 'POST',
      body: logData
    });
  },

  async update(logData) {
    return await fetchApi('logs.php?action=update', {
      method: 'POST',
      body: logData
    });
  },

  async delete(logId) {
    return await fetchApi(`logs.php?action=delete&id=${encodeURIComponent(logId)}`, {
      method: 'POST',
      body: { id: logId }
    });
  }
};

// ==========================================
// MÓDULO DE LISTAS PERSONALIZADAS
// ==========================================
const apiLists = {
  async getAll() {
    const { data, error } = await fetchApi('lists.php', { method: 'GET' });
    return { data: data?.data || [], error };
  },

  async create(listData) {
    const { data, error } = await fetchApi('lists.php', {
      method: 'POST',
      body: listData
    });
    return { data: data?.data || null, error };
  },

  async delete(listId) {
    return await fetchApi(`lists.php?action=delete&id=${encodeURIComponent(listId)}`, {
      method: 'POST',
      body: { id: listId }
    });
  },

  async getItems(listId) {
    const { data, error } = await fetchApi(`lists.php?action=items&list_id=${encodeURIComponent(listId)}`, {
      method: 'GET'
    });
    return { data: data?.data || [], list: data?.list || null, error };
  },

  async addItem(listId, gameId, gameTitle, gameCover = '') {
    return await fetchApi('lists.php?action=add_item', {
      method: 'POST',
      body: { list_id: listId, game_id: gameId, game_title: gameTitle, game_cover: gameCover }
    });
  },

  async removeItem(itemId) {
    return await fetchApi(`lists.php?action=remove_item&id=${encodeURIComponent(itemId)}`, {
      method: 'POST',
      body: { id: itemId }
    });
  }
};

// ==========================================
// INTEGRAÇÃO COM IGDB VIA BACKEND PHP
// ==========================================
async function searchIGDB(query) {
  try {
    const { data, error } = await fetchApi(`igdb.php?action=search&query=${encodeURIComponent(query)}`);
    if (error || !Array.isArray(data)) return [];
    return formatIGDBData(data);
  } catch (error) {
    console.error('Erro ao buscar jogos no backend PHP:', error);
    return [];
  }
}

async function getTopGamesIGDB() {
  try {
    const { data, error } = await fetchApi('igdb.php?action=top');
    if (error || !Array.isArray(data)) return [];
    return formatIGDBData(data);
  } catch (error) {
    console.error('Erro ao buscar destaques no backend PHP:', error);
    return [];
  }
}

function formatIGDBData(igdbArray) {
  if (!Array.isArray(igdbArray)) return [];

  return igdbArray.map(game => {
    let coverUrl = 'https://via.placeholder.com/264x352?text=Sem+Capa';
    if (game.cover && game.cover.url) {
      coverUrl = game.cover.url.replace('t_thumb', 't_cover_big');
      if (coverUrl.startsWith('//')) {
        coverUrl = 'https:' + coverUrl;
      }
    }

    return {
      id: game.id,
      title: game.name,
      cover: coverUrl,
      genre: game.genres ? game.genres.map(g => g.name).join(', ') : 'N/A',
      platform: game.platforms ? game.platforms.map(p => p.name).join(', ') : 'N/A',
      year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : 'N/A',
      synopsis: game.summary || 'Nenhuma sinopse disponível.'
    };
  });
}

# 🎮 SavePoint - Gerenciador de Backlog e Reviews de Jogos

Projeto acadêmico de desenvolvimento Web fullstack desenvolvido com **PHP 8+**, **PDO**, **MySQL/SQLite** e **HTML5/CSS3/JavaScript puro (SPA)**.

O SavePoint permite aos usuários gerenciar sua biblioteca de jogos, organizar seu backlog (*Jogando*, *Concluído*, *Backlog*, *Abandonado*), atribuir notas, escrever críticas/reviews, criar listas personalizadas e consultar dados e capas de jogos integrados via API do IGDB/Twitch.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5 semântico, CSS3 responsivo com variáveis modernas (Design Dark Gamer) e JavaScript ES6+ (SPA - Single Page Application sem frameworks pesados).
- **Backend:** PHP 8+ modular em padrão RESTful, com sessões nativas seguras (`$_SESSION`) e autenticação com hash `bcrypt` (`password_hash`).
- **Banco de Dados:** 
  - **MySQL / MariaDB (Padrão XAMPP):** Conexão via **PDO** com prepared statements (proteção contra SQL Injection). Script completo em `database/schema.sql`.
  - **SQLite (Fallback Automático):** Caso o MySQL do XAMPP não esteja iniciado no momento da execução, o backend automaticamente ativa o SQLite local (`database/savepoint.sqlite`), garantindo que o projeto funcione imediatamente em qualquer máquina sem configuração prévia.
- **Integração Externa:** Proxy local em PHP (`api/igdb.php`) com autenticação OAuth 2.0 e cache de token para consulta ao catálogo mundial do **IGDB / Twitch API**.

---

## 📁 Estrutura de Diretórios

```
SavePointWeb/
│
├── api/                        # Backend REST em PHP 8+
│   ├── config.php              # Conexão PDO (MySQL + fallback SQLite), CORS e utilitários
│   ├── auth.php                # Autenticação (Login, Registro, Sessão e Logout)
│   ├── profile.php             # Gerenciamento de perfil e upload local de fotos
│   ├── logs.php                # CRUD de registros de jogos (Backlog e Avaliações)
│   ├── lists.php               # CRUD de listas personalizadas do usuário
│   └── igdb.php                # Proxy seguro para busca e destaques da IGDB (Twitch)
│
├── database/                   # Scripts e banco de dados
│   ├── schema.sql              # Script SQL para importação no MySQL / phpMyAdmin
│   └── savepoint.sqlite        # Banco de dados local SQLite (gerado automaticamente)
│
├── uploads/                    # Armazenamento local de mídias
│   └── avatars/                # Fotos de perfil enviadas pelos usuários
│
├── api.js                      # Cliente frontend que consome a API PHP via fetch
├── app.js                      # Lógica da interface, navegação SPA, modais e estado
├── index.html                  # Interface gráfica principal
├── style.css                   # Folha de estilos moderna e responsiva
├── iniciar_servidor.bat        # Inicializador em 1 clique para Windows
├── DOCUMENTACAO_BANCO.md       # Modelo conceitual, MER, DER e dicionário de dados
├── RELATORIO_TESTES.md         # Tabela de testes, checklist e roteiro de apresentação
└── README.md                   # Documentação acadêmica principal do projeto
```

---

## 🚀 Como Executar o Projeto

Você pode executar o projeto de duas formas simples:

### Opção 1: Via Servidor Embutido do PHP (Recomendado / 1 Clique)

1. Dê um duplo clique no arquivo **`iniciar_servidor.bat`**;
2. O script detectará o PHP instalado (no XAMPP ou no PATH do Windows), iniciará o servidor local na porta `8000` e abrirá automaticamente o navegador em:
   ```
   http://localhost:8000/index.html
   ```

*Ou manualmente via terminal PowerShell / CMD:*
```powershell
C:\xampp\php\php.exe -S localhost:8000
```

---

### Opção 2: Via XAMPP (Apache + MySQL com phpMyAdmin)

1. Abra o **XAMPP Control Panel** e inicie os módulos **Apache** e **MySQL**;
2. Copie a pasta do projeto `SavePointWeb` para dentro do diretório `htdocs` do XAMPP:
   `C:\xampp\htdocs\SavePointWeb`
3. (Opcional) No navegador, acerte `http://localhost/phpmyadmin`:
   - Crie o banco `savepoint_db` e importe o arquivo `database/schema.sql`.
   - *Nota: Caso prefira não importar manualmente, o backend PHP cria automaticamente o banco e as tabelas na primeira requisição!*
4. Acesse no navegador:
   ```
   http://localhost/SavePointWeb/index.html
   ```

---

## 👤 Credenciais de Teste Pré-cadastradas

Para facilitar a correção e avaliação pelo professor, o sistema já vem populado com um usuário gamer e histórico de demonstração:

- **E-mail:** `arthur@savepoint.com`
- **Senha:** `123456`

*(Você também pode registrar novas contas livremente clicando em **Registrar** na barra de navegação).*

---

## 📋 Endpoints da API (Backend PHP)

| Endpoint | Método | Descrição |
| :--- | :---: | :--- |
| `/api/auth.php?action=login` | `POST` | Autentica o usuário e inicia a sessão PHP |
| `/api/auth.php?action=register` | `POST` | Cadastra novo usuário com senha criptografada |
| `/api/auth.php?action=session` | `GET` | Retorna os dados do usuário autenticado |
| `/api/auth.php?action=logout` | `POST` | Encerra a sessão do usuário |
| `/api/profile.php` | `GET` | Retorna o perfil completo do usuário logado |
| `/api/profile.php` | `POST` | Atualiza nome, bio e salva foto de perfil localmente |
| `/api/logs.php?action=recent` | `GET` | Lista as atividades recentes de todos os usuários (Dashboard) |
| `/api/logs.php?action=game&game_id={id}` | `GET` | Lista as análises e notas de um jogo específico |
| `/api/logs.php?action=user` | `GET` | Lista todos os jogos registrados pelo usuário atual |
| `/api/logs.php` | `POST` | Adiciona um jogo ao backlog/histórico |
| `/api/logs.php?action=update` | `POST` | Atualiza status, nota ou review de um registro existente |
| `/api/logs.php?action=delete&id={id}` | `POST` | Remove um jogo do histórico do usuário |
| `/api/lists.php` | `GET` | Lista as listas personalizadas do usuário |
| `/api/lists.php` | `POST` | Cria uma nova lista personalizada |
| `/api/lists.php?action=delete&id={id}` | `POST` | Exclui uma lista personalizada |
| `/api/igdb.php?action=top` | `GET` | Retorna os jogos em destaque do IGDB |
| `/api/igdb.php?action=search&query={q}` | `GET` | Pesquisa jogos por nome na base da IGDB |

---

## 🔒 Segurança e Boas Práticas

- **Prepared Statements (PDO):** Todas as consultas SQL utilizam parâmetros preparados, eliminando vulnerabilidades de SQL Injection.
- **Criptografia de Senhas:** Senhas armazenadas exclusivamente com hashes seguros utilizando a função nativa `password_hash($senha, PASSWORD_DEFAULT)` com salt automático.
- **Sessões HTTP-Only:** Cookies de sessão configurados com flags `HttpOnly` e `SameSite=Lax`.
- **Upload Seguro:** Validação rigorosa de MIME types no upload de fotos de perfil (permitindo apenas JPG, PNG, WebP e GIF) e armazenamento com nomes sanitizados e aleatórios.
- **Controle de Acesso:** Rotas que alteram dados conferem a propriedade do registro (`WHERE id = ? AND user_id = ?`), impedindo que um usuário edite ou exclua registros de outros.

---

## 📚 Documentação da Etapa Final (IFBA - ADS 2025)

Para atender a todos os critérios de entrega e apresentação estabelecidos pela **Profª. Ana Cristina O. Linhares**, consulte os documentos complementares:

- 🗄️ **[DOCUMENTACAO_BANCO.md](DOCUMENTACAO_BANCO.md):** Modelo Conceitual, MER, DER (Mermaid), Modelo Lógico Relacional e Dicionário de Dados completo (Atende aos itens 7 e 8).
- 🧪 **[RELATORIO_TESTES.md](RELATORIO_TESTES.md):** Tabela oficial de testes de software, checklist de segurança e usabilidade responsiva, e roteiro para a apresentação final (Atende aos itens 9, 10, 11, 12 e 13).
- 💾 **[database/schema.sql](database/schema.sql):** Script DDL e DML para criação e povoamento do banco no MySQL / phpMyAdmin.



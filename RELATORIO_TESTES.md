# 🧪 Relatório de Testes e Validações — SavePoint

**Instituição:** Instituto Federal da Bahia (IFBA) — Campus Eunápolis  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS) — Turma 2025  
**Disciplina:** Programação Web  
**Docente:** Profª. Ana Cristina O. Linhares  
**Projeto:** SavePoint (Etapa 3 - Final)

---

## 1. Tabela Oficial de Testes de Software

Conforme exigido nas diretrizes da disciplina (**Seção 11 do Documento de Avaliação**), abaixo consta o relatório detalhado de execução dos casos de teste:

| ID | Módulo / Operação | Entrada (Dados Testados) | Resultado Esperado | Resultado Obtido | Status |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **T01** | **Cadastro** | Nome: "Lucas Silva", E-mail: "lucas@teste.com", Senha: "senhaForte123" | Cadastro realizado com sucesso no banco e sessão iniciada | Conta criada no banco, usuário autenticado e redirecionado | ✅ Aprovado |
| **T02** | **Cadastro** | Nome: "Ana", E-mail: "email_invalido_sem_arroba", Senha: "123456" | Exibir mensagem de erro de validação de e-mail | Front e Back bloqueiam com "Por favor, informe um e-mail válido." | ✅ Aprovado |
| **T03** | **Cadastro** | E-mail já cadastrado: "arthur@savepoint.com" | Bloquear cadastro por duplicidade de chave única | Resposta HTTP 409: "Este e-mail já está cadastrado no sistema." | ✅ Aprovado |
| **T04** | **Cadastro** | Senha inadequada: "123" (menos de 6 caracteres) | Exibir erro de senha fraca | Bloqueio no front (`minlength="6"`) e back ("mínimo 6 caracteres") | ✅ Aprovado |
| **T05** | **Login** | E-mail: "arthur@savepoint.com", Senha: "123456" (correta) | Acesso permitido, cookie `PHPSESSID` emitido | Login bem-sucedido, menu atualizado para Dashboard e Perfil | ✅ Aprovado |
| **T06** | **Login** | E-mail: "arthur@savepoint.com", Senha: "senhaErrada999" | Acesso negado com mensagem de erro amigável | Resposta HTTP 401: "E-mail ou senha inválidos." | ✅ Aprovado |
| **T07** | **CRUD - Create** | Registrar jogo "Hollow Knight", status "jogando", nota: 10, review preenchida | Inserir no banco de dados na tabela `game_logs` | Registro inserido com sucesso e visível no perfil do usuário | ✅ Aprovado |
| **T08** | **CRUD - Read** | Acessar aba "Dashboard" e aba "Perfil" | Consultar e exibir atividades da comunidade e do usuário | Atividades carregadas com joins relacionais (Nome + Jogo) | ✅ Aprovado |
| **T09** | **CRUD - Update** | Editar jogo: alterar status para "concluido" e nota para 9 | Atualizar linha correspondente no banco | Linha atualizada no banco e estatísticas recalculadas na tela | ✅ Aprovado |
| **T10** | **CRUD - Delete** | Excluir jogo existente por ID | Remover registro correspondente do banco | Registro deletado com sucesso do banco e interface atualizada | ✅ Aprovado |
| **T11** | **Exclusão** | Excluir registro com ID inexistente no banco (ex: ID 99999) | Exibir erro de dado não encontrado | Resposta HTTP 404: "Registro não encontrado." | ✅ Aprovado |
| **T12** | **Segurança** | Usuário deslogado tentando acessar `/api/profile.php` ou `/api/logs.php` | Bloqueio de acesso não autorizado | Resposta HTTP 401: "Você precisa estar logado..." | ✅ Aprovado |
| **T13** | **Segurança** | Usuário A tentando editar/excluir registro pertencente ao Usuário B | Bloqueio por falta de autorização | Query restrita por `WHERE id = ? AND user_id = ?`, impedindo violação | ✅ Aprovado |
| **T14** | **Validação** | Submeter formulário com campos obrigatórios vazios | Bloqueio e notificação de preenchimento | Toast flutuante com aviso de preenchimento obrigatório | ✅ Aprovado |

---

## 2. Checklist de Validação e Segurança (Seção 10)

- [x] **Tratamento de Campos Vazios:** Validação dupla (HTML5 `required` + verificação no PHP).
- [x] **Validação de E-mail:** Uso da função `filter_var($email, FILTER_VALIDATE_EMAIL)` no back-end e `type="email"` no front-end.
- [x] **Prevenção de Dados Duplicados:** Restrição `UNIQUE` na coluna `email` do banco + verificação prévia com `SELECT id FROM users WHERE LOWER(email) = ?`.
- [x] **Armazenamento Seguro de Senhas:** Senhas criptografadas com o algoritmo `bcrypt` via `password_hash($senha, PASSWORD_DEFAULT)`.
- [x] **Tratamento de Dados Inexistentes:** Validação de existência de IDs antes de executar operações de `UPDATE` e `DELETE`.
- [x] **Controle de Acesso e Autorização:** Proteção em todas as rotas sensíveis via função `requireAuth()` e filtragem por `user_id`.
- [x] **Gerenciamento de Sessão:** Uso de sessões nativas PHP (`session_start()`) com cookies configurados com `HttpOnly` e `SameSite=Lax`.

---

## 3. Checklist de Responsividade e Usabilidade (Seção 12)

- [x] **Computador e Celular:** Layout adaptável através de media queries para larguras de desktop, tablet e smartphones.
- [x] **Menu Adaptado:** Navbar responsiva com flex-wrap para telas menores.
- [x] **Textos Legíveis:** Tipografia com fontes *Rajdhani* (títulos gamers) e *Inter* (textos de leitura), garantindo contraste acessível com fundo escuro.
- [x] **Botões Adequados:** Dimensões táteis adequadas para clique em telas touch de celular.
- [x] **Imagens Adaptáveis:** Capas de jogos e fotos de perfil configuradas com `max-width: 100%` e `object-fit: cover`.
- [x] **Mensagens Compreensíveis:** Sistema moderno de notificações toast flutuantes (substituindo alerts nativos do navegador).

---

## 4. Roteiro para a Apresentação Final (Seção 13)

### 1. O Problema
> *"Jogadores modernos acumulam dezenas ou centenas de jogos em diferentes plataformas (Steam, PlayStation, Nintendo Switch, Game Pass). Frequentemente perdem o controle do que já jogaram, do que abandonaram ou do que pretendem jogar a seguir (o famoso 'backlog infinito')."*

### 2. A Solução
> *"O **SavePoint** é uma plataforma web centralizada onde o gamer pode registrar o que está jogando, marcar jogos concluídos, dar notas de 0 a 10, registrar suas críticas e compartilhar com a comunidade suas impressões, além de montar listas personalizadas temáticas."*

### 3. As Tecnologias
- **Front-end:** HTML5 semântico, CSS3 com variáveis e Flexbox/Grid responsivo, JavaScript ES6+ assíncrono (`fetch`, `async/await`).
- **Back-end:** PHP 8+ modular, estruturado em arquitetura RESTful, com gerenciamento seguro de sessões.
- **Banco de Dados:** MySQL / MariaDB via PDO com Prepared Statements contra SQL Injection e integridade referencial.
- **API Externa:** Integração com a base de dados mundial da Twitch/IGDB com token OAuth 2.0 em cache.

### 4. Demonstração Prática (Passo a Passo)
1. **Página Inicial:** Mostrar os jogos em destaque carregados dinamicamente via PHP da API IGDB.
2. **Busca:** Pesquisar por um jogo (ex: "Zelda" ou "Witcher") e abrir a página de detalhes.
3. **Login:** Acessar com a conta pré-cadastrada (`arthur@savepoint.com` / `123456`).
4. **Adicionar ao Backlog:** Abrir o modal, escolher status (*Jogando*), nota 10 e escrever uma crítica.
5. **Dashboard:** Mostrar que a crítica apareceu imediatamente no feed da comunidade com o nome do jogador.
6. **Perfil:** Navegar até o perfil, mostrar o cálculo automático das estatísticas (jogos concluídos, média de notas) e os filtros por abas.
7. **Editar e Excluir:** Demonstrar a edição de uma nota e a exclusão com modal de confirmação estilizado.
8. **Listas Personalizadas:** Criar uma lista (ex: "Zerar em 2026") mostrando a persistência direta no banco de dados.


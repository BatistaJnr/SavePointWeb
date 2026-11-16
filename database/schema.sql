-- ==========================================================
-- PROJETO ACADÊMICO: SavePoint - Gerenciador de Jogos e Backlog
-- BANCO DE DADOS: MySQL / MariaDB (Padrão XAMPP)
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `savepoint_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `savepoint_db`;

-- ----------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (Perfis e Autenticação)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `bio` TEXT DEFAULT NULL,
    `avatar_url` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. TABELA DE REGISTROS DE JOGOS (Backlog, Avaliações e Status)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `game_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `game_id` INT NOT NULL,
    `game_title` VARCHAR(255) NOT NULL,
    `status` ENUM('jogando', 'concluido', 'backlog', 'abandonado') NOT NULL DEFAULT 'jogando',
    `rating` TINYINT UNSIGNED DEFAULT NULL,
    `review` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_logs` (`user_id`),
    INDEX `idx_game_logs` (`game_id`),
    CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. TABELA DE LISTAS PERSONALIZADAS DE JOGOS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `custom_lists` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_lists` (`user_id`),
    CONSTRAINT `fk_lists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- DADOS INICIAIS DE DEMONSTRAÇÃO (Opcional - Útil para apresentação)
-- Senha padrão do usuário de teste: 123456
-- ----------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `bio`, `avatar_url`)
VALUES (
    1,
    'Arthur Gamer',
    'arthur@savepoint.com',
    '$2y$10$eEymA7K01g4oN8Ynly19iO7d6H3rP0Xw5e6PfZU6W312a0sR4m7kG', -- Hash para '123456'
    'Explorando mundos fantásticos e zerando RPGs clássicos desde 1998.',
    'https://api.dicebear.com/7.x/bottts/svg?seed=RetroGamer'
)
ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `game_logs` (`id`, `user_id`, `game_id`, `game_title`, `status`, `rating`, `review`, `created_at`)
VALUES
(1, 1, 119171, "Baldur's Gate III", 'concluido', 10, 'Uma obra-prima incontestável dos RPGs eletrônicos. Narrativa e liberdade impressionantes!', NOW() - INTERVAL 2 DAY),
(2, 1, 1942, 'The Witcher 3: Wild Hunt', 'concluido', 10, 'A trilha sonora e as missões secundárias definiram o padrão para os jogos de mundo aberto.', NOW() - INTERVAL 1 DAY),
(3, 1, 119133, 'Elden Ring', 'jogando', 9, 'Desafiador e fascinante. O design de mundo das Terras Intermédias é sublime.', NOW())
ON DUPLICATE KEY UPDATE `id` = `id`;

INSERT INTO `custom_lists` (`id`, `user_id`, `name`, `description`, `created_at`)
VALUES
(1, 1, 'Top RPGs Inesquecíveis', 'Os jogos que mais marcaram minha jornada gamer.', NOW())
ON DUPLICATE KEY UPDATE `id` = `id`;


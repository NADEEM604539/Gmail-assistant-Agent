drop database gmail_assistant;
CREATE DATABASE IF NOT EXISTS `gmail_assistant` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gmail_assistant`;


-- Users and authentication
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `google_id` VARCHAR(255) NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `profile_picture` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `gmail_accounts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `email_address` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(128) NOT NULL DEFAULT 'google',
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `auto_reply` BOOLEAN NOT NULL DEFAULT TRUE,
  `last_history_id` BIGINT UNSIGNED NULL,
  `last_auto_reply_check_at` DATETIME NULL,
  `connected_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `refresh_token` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_gmail_accounts_email_user` (`email_address`, `user_id`),
  KEY `idx_gmail_accounts_user_id` (`user_id`),
  CONSTRAINT `fk_gmail_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gmail_syncs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    gmail_account_id BIGINT UNSIGNED NOT NULL UNIQUE,
    initial_sync_completed BOOLEAN DEFAULT FALSE,
    imported_email_count INT DEFAULT 0,
    last_history_id BIGINT,
    last_sync_at DATETIME,
    status ENUM(
        'PENDING',
        'COMPLETED'
    ) DEFAULT 'PENDING',
    FOREIGN KEY (gmail_account_id)
        REFERENCES gmail_accounts(id)
        ON DELETE CASCADE
);


-- Search and activity
CREATE TABLE IF NOT EXISTS `search_queries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `query` VARCHAR(1024) NOT NULL,
  `is_ai_query` BOOLEAN NOT NULL DEFAULT FALSE,
  `result_count` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_search_queries_user_id` (`user_id`),
  CONSTRAINT `fk_search_queries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Chat and AI assistant
CREATE TABLE IF NOT EXISTS `chat_threads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `thread_key` VARCHAR(255) NULL UNIQUE,
  `title` VARCHAR(255) NULL,
  `preview` VARCHAR(1024) NULL,
  `message_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_threads_user_id` (`user_id`),
  CONSTRAINT `fk_chat_threads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `thread_id` BIGINT UNSIGNED NOT NULL,
  `role` ENUM('user','assistant','system') NOT NULL DEFAULT 'user',
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_thread_id` (`thread_id`),
  CONSTRAINT `fk_chat_messages_thread` FOREIGN KEY (`thread_id`) REFERENCES `chat_threads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `preference_name` VARCHAR(255) NOT NULL,
  `preference_value` TEXT NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_preference` (`user_id`, `preference_name`),
  KEY `idx_user_preferences_user_id` (`user_id`),
  KEY `idx_user_preferences_enabled` (`user_id`, `enabled`),
  CONSTRAINT `fk_user_preferences_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ai_email_actions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `email_id` VARCHAR(255) NULL,
    `action_type` ENUM(
        'draft_created',
        'draft_updated',
        'reply_generated',
        'email_sent',
        'email_summarized',
        'email_classified',
        'email_labeled',
        'priority_detected',
        'followup_created',
        'email_trashed',
        'email_deleted',
        'email_starred',
        'email_unstarred',
        'email_archived',
        'email_unarchived',
        'email_marked_spam',
        'email_marked_not_spam',
        'email_read_toggled',
        'email_untrashed'
    ) NOT NULL,
    `model_name` VARCHAR(100) NULL,
    `status` ENUM(
        'pending',
        'completed',
        'failed'
    ) DEFAULT 'completed',
    `input_text` LONGTEXT NULL,
    `output_text` LONGTEXT NULL,
    `error_message` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_email_id` (`email_id`),
    KEY `idx_action_type` (`action_type`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_ai_action_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `documents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `purpose` text NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `chunk_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_documents_user_id` (`user_id`), 
    CONSTRAINT `fk_documents_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users`(`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
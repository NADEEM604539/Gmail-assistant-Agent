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

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `email_notifications` BOOLEAN NOT NULL DEFAULT TRUE,
  `ai_suggestions` BOOLEAN NOT NULL DEFAULT TRUE,
  `weekly_report` BOOLEAN NOT NULL DEFAULT TRUE,
  `security_alerts` BOOLEAN NOT NULL DEFAULT TRUE,
  `push_notifications` BOOLEAN NOT NULL DEFAULT FALSE,
  `dark_mode` BOOLEAN NOT NULL DEFAULT FALSE,
  `auto_reply` BOOLEAN NOT NULL DEFAULT FALSE,
  `smart_reply` BOOLEAN NOT NULL DEFAULT TRUE,
  `spam_detection` BOOLEAN NOT NULL DEFAULT TRUE,
  `priority_detection` BOOLEAN NOT NULL DEFAULT TRUE,
  `summaries` BOOLEAN NOT NULL DEFAULT TRUE,
  `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `login_alerts` BOOLEAN NOT NULL DEFAULT TRUE,
  `language` VARCHAR(64) NOT NULL DEFAULT 'English (US)',
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'Pacific Time (PT)',
  `theme` VARCHAR(64) NOT NULL DEFAULT 'System',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_settings_user_id` (`user_id`),
  KEY `idx_user_settings_user_id` (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gmail_accounts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `email_address` VARCHAR(255) NOT NULL,
  `provider` VARCHAR(128) NOT NULL DEFAULT 'google',
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
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


CREATE TABLE IF NOT EXISTS `emails` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `gmail_message_id` VARCHAR(255) NOT NULL,
    `gmail_thread_id` VARCHAR(255) NOT NULL,
    `history_id` BIGINT UNSIGNED NOT NULL,
    `folder` ENUM(
        'inbox',
        'sent',
        'draft',
        'spam',
        'trash',
        'important',
        'starred',
        'archive',
        'promotion',
        'social',
        'updates'
    ) NOT NULL DEFAULT 'inbox',
    `from_name` VARCHAR(255) NULL,
    `from_email` VARCHAR(255) NULL,
    `to_name` VARCHAR(255) NULL,
    `to_email` VARCHAR(255) NULL,
    `subject` VARCHAR(512) NOT NULL,
    `body` LONGTEXT NULL,
    `preview` TEXT NULL,
    `label` VARCHAR(255) NULL,
    `category` VARCHAR(100) NULL,
    `status` ENUM(
        'read',
        'unread',
        'draft',
        'sent',
        'deleted'
    ) DEFAULT 'unread',
    `priority` ENUM(
        'high',
        'medium',
        'low'
    ) DEFAULT 'medium',
    `has_attachment` BOOLEAN DEFAULT FALSE,
    `starred` BOOLEAN DEFAULT FALSE,
    `is_important` BOOLEAN DEFAULT FALSE,
    `ai_summary` TEXT NULL,
    `received_at` DATETIME NULL,
    `sent_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_gmail_message` (`gmail_message_id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_thread` (`gmail_thread_id`),
    KEY `idx_history` (`history_id`),
    KEY `idx_folder` (`folder`),
    KEY `idx_status` (`status`),
    CONSTRAINT `fk_emails_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_recipients` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email_id` BIGINT UNSIGNED NOT NULL,
  `recipient_type` ENUM('to','cc','bcc') NOT NULL,
  `name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NOT NULL,
  `recipient_order` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_email_recipients_email_id` (`email_id`),
  CONSTRAINT `fk_email_recipients_email` FOREIGN KEY (`email_id`) REFERENCES `emails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_labels` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `color` VARCHAR(32) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email_labels_user_name` (`user_id`,`name`),
  KEY `idx_email_labels_user_id` (`user_id`),
  CONSTRAINT `fk_email_labels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_attachments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email_id` BIGINT UNSIGNED NOT NULL,
  `content_id` VARCHAR(255) NULL,
  `filename` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(128) NULL,
  `size_bytes` INT UNSIGNED NULL,
  `storage_url` VARCHAR(1024) NULL,
  `download_url` VARCHAR(1024) NULL,
  `checksum` VARCHAR(128) NULL,
  `is_inline` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_attachments_email_id` (`email_id`),
  CONSTRAINT `fk_email_attachments_email` FOREIGN KEY (`email_id`) REFERENCES `emails` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('ai','security','workflow','email','system') NOT NULL DEFAULT 'email',
  `title` VARCHAR(512) NOT NULL,
  `body` TEXT NULL,
  `priority` ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `metadata` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_id` (`user_id`),
  KEY `idx_notifications_type` (`type`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `key_name` VARCHAR(128) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `description` VARCHAR(512) NULL,
  `earned` BOOLEAN NOT NULL DEFAULT FALSE,
  `earned_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_achievements_user_key` (`user_id`,`key_name`),
  KEY `idx_user_achievements_user_id` (`user_id`),
  CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Workflow automation
CREATE TABLE IF NOT EXISTS `workflows` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `trigger_expression` TEXT NULL,
  `status` ENUM('active','paused','draft') NOT NULL DEFAULT 'draft',
  `runs` INT UNSIGNED NOT NULL DEFAULT 0,
  `last_run_at` DATETIME NULL,
  `category` VARCHAR(128) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workflows_user_id` (`user_id`),
  KEY `idx_workflows_status` (`status`),
  CONSTRAINT `fk_workflows_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_actions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `action_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `description` VARCHAR(512) NOT NULL,
  `parameters` JSON NULL,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_actions_workflow_id` (`workflow_id`),
  CONSTRAINT `fk_workflow_actions_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `workflow_runs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('success','error') NOT NULL DEFAULT 'success',
  `matched_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `actioned_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `run_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_runs_workflow_id` (`workflow_id`),
  CONSTRAINT `fk_workflow_runs_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS `activity_feed` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `verb` VARCHAR(128) NOT NULL,
  `details` TEXT NULL,
  `link` VARCHAR(1024) NULL,
  `activity_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_feed_user_id` (`user_id`),
  CONSTRAINT `fk_activity_feed_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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

SET FOREIGN_KEY_CHECKS = 1;

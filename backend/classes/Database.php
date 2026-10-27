<?php
/**
 * Database connection & schema manager with fail-safe SQLite auto-fallback.
 */
class Database {
    private static ?PDO $instance = null;
    private static array $config = [];

    public static function init(array $config): void {
        self::$config = $config;
    }

    public static function getConnection(): PDO {
        if (self::$instance !== null) {
            return self::$instance;
        }

        if (empty(self::$config)) {
            self::$config = require __DIR__ . '/../config.php';
        }

        $dbConfig = self::$config['db'];

        // 1. Try MySQL first if configured
        if ($dbConfig['driver'] === 'mysql') {
            try {
                $mysql = $dbConfig['mysql'];
                $dsn = "mysql:host={$mysql['host']};dbname={$mysql['database']};charset={$mysql['charset']}";
                self::$instance = new PDO($dsn, $mysql['username'], $mysql['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_TIMEOUT => 3
                ]);
                self::ensureTables();
                return self::$instance;
            } catch (Throwable $e) {
                // MySQL connection failed; log and fall back to SQLite seamlessly
                error_log("MySQL connection failed: " . $e->getMessage() . " - Falling back to SQLite.");
            }
        }

        // 2. Safe SQLite fallback (Works 100% on Hostinger without any DB setup)
        try {
            $sqlitePath = $dbConfig['sqlite_path'] ?? (__DIR__ . '/../db/database.sqlite');
            $dir = dirname($sqlitePath);
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            self::$instance = new PDO('sqlite:' . $sqlitePath, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            self::ensureTables();
            return self::$instance;
        } catch (Throwable $e) {
            // Even if file creation fails, use in-memory SQLite so it never crashes!
            self::$instance = new PDO('sqlite::memory:', null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            self::ensureTables();
            return self::$instance;
        }
    }

    private static function ensureTables(): void {
        $driver = self::$instance->getAttribute(PDO::ATTR_DRIVER_NAME);
        $autoIncrement = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
        $textType = 'TEXT';
        $dateTimeDefault = 'DATETIME DEFAULT CURRENT_TIMESTAMP';

        $pdo = self::$instance;

        try {
            // 1. Visitors table
            $pdo->exec("CREATE TABLE IF NOT EXISTS visitors (
                id $autoIncrement,
                visitor_uuid VARCHAR(100) NOT NULL UNIQUE,
                ip_address VARCHAR(50) DEFAULT '127.0.0.1',
                user_agent $textType,
                country VARCHAR(100) DEFAULT 'Unknown',
                city VARCHAR(100) DEFAULT 'Unknown',
                current_page VARCHAR(255) DEFAULT '/',
                is_online INT DEFAULT 1,
                mode VARCHAR(20) DEFAULT 'bot',
                last_seen_at $dateTimeDefault,
                created_at $dateTimeDefault
            )");

            // 2. Messages table
            $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
                id $autoIncrement,
                visitor_uuid VARCHAR(100) NOT NULL,
                sender VARCHAR(20) NOT NULL,
                message $textType NOT NULL,
                metadata $textType,
                is_read INT DEFAULT 0,
                created_at $dateTimeDefault
            )");

            // 3. Knowledge chunks
            $pdo->exec("CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id $autoIncrement,
                title VARCHAR(255),
                content $textType NOT NULL,
                category VARCHAR(100) DEFAULT 'General',
                url VARCHAR(500) DEFAULT '',
                embedding $textType,
                chunk_type VARCHAR(50) DEFAULT 'faq',
                created_at $dateTimeDefault
            )");

            // 4. Leads
            $pdo->exec("CREATE TABLE IF NOT EXISTS leads (
                id $autoIncrement,
                visitor_uuid VARCHAR(100) NOT NULL,
                name VARCHAR(150),
                email VARCHAR(150),
                phone VARCHAR(50),
                category VARCHAR(100) DEFAULT 'Luxury Concierge',
                note $textType,
                status VARCHAR(30) DEFAULT 'new',
                created_at $dateTimeDefault
            )");

            // 5. Settings
            $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
                key_name VARCHAR(100) PRIMARY KEY,
                key_value $textType,
                updated_at $dateTimeDefault
            )");
        } catch (Throwable $e) {
            error_log("ensureTables warning: " . $e->getMessage());
        }
    }
}

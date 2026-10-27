<?php
/**
 * Visitor Identity & Session Tracking (Tawk.to style: IP + Browser + UUID)
 */
require_once __DIR__ . '/Database.php';

class VisitorManager {
    public static function getClientIP(): string {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];

        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    public static function getOrCreateVisitor(?string $visitorUuid = null, ?string $currentPage = '/'): array {
        $pdo = Database::getConnection();
        $ip = self::getClientIP();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Browser';

        if (empty($visitorUuid)) {
            // Generate a secure unique visitor UUID based on IP + random entropy
            $visitorUuid = 'vis_' . bin2hex(random_bytes(8)) . '_' . substr(md5($ip . $userAgent . microtime()), 0, 6);
        }

        // Check if visitor exists
        $stmt = $pdo->prepare("SELECT * FROM visitors WHERE visitor_uuid = ?");
        $stmt->execute([$visitorUuid]);
        $visitor = $stmt->fetch();

        if (!$visitor) {
            $now = date('Y-m-d H:i:s');
            $insert = $pdo->prepare("INSERT INTO visitors (visitor_uuid, ip_address, user_agent, current_page, is_online, mode, last_seen_at, created_at) 
                                     VALUES (?, ?, ?, ?, 1, 'bot', ?, ?)");
            $insert->execute([$visitorUuid, $ip, $userAgent, $currentPage, $now, $now]);

            $stmt = $pdo->prepare("SELECT * FROM visitors WHERE visitor_uuid = ?");
            $stmt->execute([$visitorUuid]);
            $visitor = $stmt->fetch();
        } else {
            // Update last seen and online status
            $now = date('Y-m-d H:i:s');
            $update = $pdo->prepare("UPDATE visitors SET ip_address = ?, user_agent = ?, current_page = ?, is_online = 1, last_seen_at = ? WHERE visitor_uuid = ?");
            $update->execute([$ip, $userAgent, $currentPage, $now, $visitorUuid]);
        }

        return $visitor;
    }

    public static function setVisitorMode(string $visitorUuid, string $mode): bool {
        if (!in_array($mode, ['bot', 'live'])) {
            return false;
        }
        $pdo = Database::getConnection();
        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("UPDATE visitors SET mode = ?, last_seen_at = ? WHERE visitor_uuid = ?");
        return $stmt->execute([$mode, $now, $visitorUuid]);
    }

    public static function getVisitor(string $visitorUuid): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM visitors WHERE visitor_uuid = ?");
        $stmt->execute([$visitorUuid]);
        $visitor = $stmt->fetch();
        return $visitor ?: null;
    }

    public static function getAllVisitors(int $limit = 50): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT v.*, 
                (SELECT COUNT(*) FROM messages m WHERE m.visitor_uuid = v.visitor_uuid) as message_count,
                (SELECT message FROM messages m WHERE m.visitor_uuid = v.visitor_uuid ORDER BY m.id DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages m WHERE m.visitor_uuid = v.visitor_uuid ORDER BY m.id DESC LIMIT 1) as last_message_time,
                (SELECT sender FROM messages m WHERE m.visitor_uuid = v.visitor_uuid ORDER BY m.id DESC LIMIT 1) as last_sender
            FROM visitors v
            ORDER BY v.last_seen_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
}

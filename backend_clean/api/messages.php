<?php
/**
 * Messages Endpoint: Fetch message history & poll updates for visitor widget or admin console
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/VisitorManager.php';

header('Content-Type: application/json');

$visitorUuid = $_GET['visitor_uuid'] ?? ($_SERVER['HTTP_X_VISITOR_ID'] ?? null);
$afterId = isset($_GET['after_id']) ? (int)$_GET['after_id'] : 0;

if (empty($visitorUuid)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing visitor_uuid parameter.']);
    exit;
}

try {
    $pdo = Database::getConnection();
    $visitor = VisitorManager::getVisitor($visitorUuid);

    if (!$visitor) {
        // Auto register if querying first time
        $visitor = VisitorManager::getOrCreateVisitor($visitorUuid);
    }

    if ($afterId > 0) {
        $stmt = $pdo->prepare("SELECT * FROM messages WHERE visitor_uuid = ? AND id > ? ORDER BY id ASC");
        $stmt->execute([$visitorUuid, $afterId]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM messages WHERE visitor_uuid = ? ORDER BY id ASC LIMIT 100");
        $stmt->execute([$visitorUuid]);
    }

    $messages = $stmt->fetchAll();

    $formatted = array_map(function($m) {
        $meta = json_decode($m['metadata'] ?? '[]', true);
        return [
            'id' => (int)$m['id'],
            'sender' => $m['sender'],
            'message' => $m['message'],
            'citations' => $meta['citations'] ?? [],
            'suggested_questions' => $meta['suggested_questions'] ?? [],
            'fallback_required' => $meta['fallback_required'] ?? false,
            'category' => $meta['category'] ?? 'General',
            'created_at' => $m['created_at']
        ];
    }, $messages);

    echo json_encode([
        'success' => true,
        'visitor' => [
            'uuid' => $visitor['visitor_uuid'],
            'mode' => $visitor['mode'] ?? 'bot',
            'is_online' => (bool)($visitor['is_online'] ?? 1),
            'ip' => $visitor['ip_address'] ?? ''
        ],
        'messages' => $formatted
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

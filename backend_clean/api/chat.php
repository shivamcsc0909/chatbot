<?php
/**
 * Visitor Chat Endpoint: Send Message & Receive AI Concierge / Live Admin Response
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/VisitorManager.php';
require_once __DIR__ . '/../classes/VectorStore.php';
require_once __DIR__ . '/../classes/LLMService.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty(trim($input['message'] ?? ''))) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing message field.']);
    exit;
}

$messageText = trim($input['message']);
$visitorUuid = $input['visitor_uuid'] ?? ($_SERVER['HTTP_X_VISITOR_ID'] ?? null);
$currentPage = $input['current_page'] ?? '/';

try {
    $pdo = Database::getConnection();

    // 1. Get or create anonymous visitor session
    $visitor = VisitorManager::getOrCreateVisitor($visitorUuid, $currentPage);
    $visitorUuid = $visitor['visitor_uuid'];
    $visitorMode = $visitor['mode'] ?? 'bot';

    // 2. Record visitor message in DB
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("INSERT INTO messages (visitor_uuid, sender, message, created_at) VALUES (?, 'visitor', ?, ?)");
    $stmt->execute([$visitorUuid, $messageText, $now]);
    $visitorMsgId = (int)$pdo->lastInsertId();

    $responsePayload = [
        'success' => true,
        'visitor_uuid' => $visitorUuid,
        'mode' => $visitorMode,
        'user_message_id' => $visitorMsgId,
    ];

    // 3. If in AUTO-BOT MODE, generate RAG response immediately
    if ($visitorMode === 'bot') {
        // Fetch recent conversation history
        $histStmt = $pdo->prepare("SELECT sender, message FROM messages WHERE visitor_uuid = ? ORDER BY id DESC LIMIT 6");
        $histStmt->execute([$visitorUuid]);
        $history = array_reverse($histStmt->fetchAll());

        $ragResult = LLMService::generateResponse($messageText, $history);

        // Record bot response in DB
        $botNow = date('Y-m-d H:i:s');
        $botStmt = $pdo->prepare("INSERT INTO messages (visitor_uuid, sender, message, metadata, created_at) VALUES (?, 'bot', ?, ?, ?)");
        $metadataJson = json_encode([
            'citations' => $ragResult['citations'],
            'suggested_questions' => $ragResult['suggested_questions'] ?? [],
            'fallback_required' => $ragResult['fallback_required'],
            'relevance_score' => $ragResult['relevance_score'],
            'category' => $ragResult['category'] ?? 'General'
        ]);
        $botStmt->execute([$visitorUuid, $ragResult['reply'], $metadataJson, $botNow]);
        $botMsgId = (int)$pdo->lastInsertId();

        $responsePayload['reply'] = [
            'id' => $botMsgId,
            'sender' => 'bot',
            'message' => $ragResult['reply'],
            'citations' => $ragResult['citations'],
            'suggested_questions' => $ragResult['suggested_questions'] ?? [],
            'fallback_required' => $ragResult['fallback_required'],
            'category' => $ragResult['category'] ?? 'General',
            'created_at' => date('Y-m-d H:i:s')
        ];
    } else {
        // Visitor is in LIVE ADMIN mode
        $responsePayload['reply'] = [
            'id' => 0,
            'sender' => 'system',
            'message' => 'Your message has been received by our live concierge team. An agent will reply shortly.',
            'citations' => [],
            'fallback_required' => false,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    echo json_encode($responsePayload);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'details' => $e->getMessage()]);
}

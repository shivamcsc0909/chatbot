<?php
/**
 * Visitor Chat Endpoint: Send Message & Receive AI Concierge / Live Admin Response
 */
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/VisitorManager.php';
require_once __DIR__ . '/../classes/VectorStore.php';
require_once __DIR__ . '/../classes/LLMService.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Visitor-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?: $_POST;

$messageText = trim($input['message'] ?? '');
if (empty($messageText)) {
    echo json_encode(['error' => 'Missing message field.']);
    exit;
}

$visitorUuid = $input['visitor_uuid'] ?? ($_SERVER['HTTP_X_VISITOR_ID'] ?? null);
$currentPage = $input['current_page'] ?? '/';

try {
    // 1. Generate RAG / FAQ response first
    $ragResult = LLMService::generateResponse($messageText, []);

    // 2. Safe Session & DB tracking
    $visitor = VisitorManager::getOrCreateVisitor($visitorUuid, $currentPage);
    $visitorUuid = $visitor['visitor_uuid'] ?? ($visitorUuid ?: 'vis_guest_' . time());
    $visitorMode = $visitor['mode'] ?? 'bot';

    $pdo = Database::getConnection();
    $now = date('Y-m-d H:i:s');

    // Save visitor message
    try {
        $stmt = $pdo->prepare("INSERT INTO messages (visitor_uuid, sender, message, created_at) VALUES (?, 'visitor', ?, ?)");
        $stmt->execute([$visitorUuid, $messageText, $now]);
        $visitorMsgId = (int)$pdo->lastInsertId();
    } catch (Throwable $e) {
        $visitorMsgId = 1;
    }

    $responsePayload = [
        'success' => true,
        'visitor_uuid' => $visitorUuid,
        'mode' => $visitorMode,
        'user_message_id' => $visitorMsgId,
    ];

    if ($visitorMode === 'bot') {
        try {
            $botStmt = $pdo->prepare("INSERT INTO messages (visitor_uuid, sender, message, metadata, created_at) VALUES (?, 'bot', ?, ?, ?)");
            $metadataJson = json_encode([
                'citations' => $ragResult['citations'],
                'suggested_questions' => $ragResult['suggested_questions'] ?? [],
                'fallback_required' => $ragResult['fallback_required'],
                'relevance_score' => $ragResult['relevance_score'],
                'category' => $ragResult['category'] ?? 'General'
            ]);
            $botStmt->execute([$visitorUuid, $ragResult['reply'], $metadataJson, $now]);
            $botMsgId = (int)$pdo->lastInsertId();
        } catch (Throwable $e) {
            $botMsgId = 2;
        }

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
        $responsePayload['reply'] = [
            'id' => 0,
            'sender' => 'system',
            'message' => 'Your message has been received by our live concierge team. An agent will reply shortly.',
            'citations' => [],
            'suggested_questions' => [],
            'fallback_required' => false,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    echo json_encode($responsePayload);
} catch (Throwable $e) {
    // Fail-safe response with 50 FAQs lookup
    $ragResult = LLMService::generateResponse($messageText, []);
    echo json_encode([
        'success' => true,
        'visitor_uuid' => $visitorUuid ?: 'guest',
        'mode' => 'bot',
        'reply' => [
            'id' => time(),
            'sender' => 'bot',
            'message' => $ragResult['reply'],
            'citations' => $ragResult['citations'],
            'suggested_questions' => $ragResult['suggested_questions'],
            'fallback_required' => $ragResult['fallback_required'],
            'category' => $ragResult['category'],
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
}

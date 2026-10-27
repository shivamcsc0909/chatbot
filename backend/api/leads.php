<?php
/**
 * Leads & Contact Inquiries API: Capture customer details on fallback or VIP requests
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/VisitorManager.php';

header('Content-Type: application/json');

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $visitorUuid = $input['visitor_uuid'] ?? ($_SERVER['HTTP_X_VISITOR_ID'] ?? 'guest');
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $category = trim($input['category'] ?? 'Luxury Concierge Inquiry');
    $note = trim($input['note'] ?? '');

    if (empty($name) || (empty($email) && empty($phone))) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Please provide your name and at least an email or phone number.'
        ]);
        exit;
    }

    try {
        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("INSERT INTO leads (visitor_uuid, name, email, phone, category, note, status, created_at) 
                               VALUES (?, ?, ?, ?, ?, ?, 'new', ?)");
        $stmt->execute([$visitorUuid, $name, $email, $phone, $category, $note, $now]);
        $leadId = (int)$pdo->lastInsertId();

        // Also add confirmation message to chat transcript
        $confirmMsg = "Thank you, {$name}. Your inquiry regarding '{$category}' has been securely recorded. Our senior lifestyle editorial team will connect with you via {$email} or {$phone} shortly.";
        $pdo->prepare("INSERT INTO messages (visitor_uuid, sender, message, created_at) VALUES (?, 'bot', ?, ?)")
            ->execute([$visitorUuid, $confirmMsg, $now]);

        echo json_encode([
            'success' => true,
            'lead_id' => $leadId,
            'message' => 'Your contact details have been received by our concierge team.'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    // Admin list of leads
    try {
        $status = $_GET['status'] ?? null;
        if ($status) {
            $stmt = $pdo->prepare("SELECT * FROM leads WHERE status = ? ORDER BY id DESC");
            $stmt->execute([$status]);
        } else {
            $stmt = $pdo->query("SELECT * FROM leads ORDER BY id DESC");
        }
        $leads = $stmt->fetchAll();
        echo json_encode(['success' => true, 'leads' => $leads]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    // Admin update status
    $input = json_decode(file_get_contents('php://input'), true);
    $leadId = (int)($input['id'] ?? 0);
    $status = $input['status'] ?? 'contacted';

    if ($leadId > 0 && in_array($status, ['new', 'contacted', 'closed'])) {
        $stmt = $pdo->prepare("UPDATE leads SET status = ? WHERE id = ?");
        $stmt->execute([$status, $leadId]);
        echo json_encode(['success' => true, 'message' => "Lead #{$leadId} status changed to {$status}"]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid lead ID or status']);
    }
}

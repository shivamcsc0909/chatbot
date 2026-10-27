<?php
/**
 * Scraping & Knowledge Management API
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/VectorStore.php';
require_once __DIR__ . '/../classes/Scraper.php';

header('Content-Type: application/json');

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $url = trim($input['url'] ?? 'https://www.awayinstyle.com/');
    $category = trim($input['category'] ?? 'Editorial Discovery');

    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid URL provided']);
        exit;
    }

    try {
        $result = Scraper::ingestUrl($url, $category);
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    $type = $_GET['type'] ?? 'all';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;

    try {
        if ($type !== 'all') {
            $stmt = $pdo->prepare("SELECT id, title, category, url, chunk_type, created_at, length(content) as content_length FROM knowledge_chunks WHERE chunk_type = ? ORDER BY id DESC LIMIT ?");
            $stmt->execute([$type, $limit]);
        } else {
            $stmt = $pdo->prepare("SELECT id, title, category, url, chunk_type, created_at, length(content) as content_length FROM knowledge_chunks ORDER BY id DESC LIMIT ?");
            $stmt->execute([$limit]);
        }
        $chunks = $stmt->fetchAll();
        echo json_encode(['success' => true, 'chunks' => $chunks, 'total' => count($chunks)]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id > 0) {
        $stmt = $pdo->prepare("DELETE FROM knowledge_chunks WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => "Knowledge chunk #$id deleted"]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid chunk ID']);
    }
}

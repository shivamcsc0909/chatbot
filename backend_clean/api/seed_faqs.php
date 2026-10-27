<?php
/**
 * Seed 50 Essential Luxury Concierge Q&As into Vector Knowledge Base
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/VectorStore.php';

header('Content-Type: application/json');

try {
    $pdo = Database::getConnection();
    $faqFile = __DIR__ . '/../data/50_faqs.json';

    if (!file_exists($faqFile)) {
        echo json_encode(['success' => false, 'error' => '50_faqs.json not found']);
        exit;
    }

    $faqs = json_decode(file_get_contents($faqFile), true);
    if (!is_array($faqs)) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON in 50_faqs.json']);
        exit;
    }

    // Clear existing FAQ chunks to prevent duplication on re-seed
    $pdo->exec("DELETE FROM knowledge_chunks WHERE chunk_type = 'faq'");

    $count = 0;
    foreach ($faqs as $faq) {
        $title = $faq['question'];
        $content = "Question: " . $faq['question'] . "\nAnswer: " . $faq['answer'];
        $category = $faq['category'] ?? 'General';
        $url = $faq['url'] ?? 'https://www.awayinstyle.com/';

        VectorStore::addChunk($title, $content, $category, $url, 'faq');
        $count++;
    }

    echo json_encode([
        'success' => true,
        'message' => "Successfully seeded $count Luxury Concierge Q&As into Vector Knowledge Store",
        'count' => $count
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

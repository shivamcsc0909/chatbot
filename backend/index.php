<?php
/**
 * Main API Index & Service Status
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'service' => 'Away In Style AI Lifestyle Concierge API',
    'version' => '1.0.0',
    'status' => 'operational',
    'endpoints' => [
        'POST /api/chat.php' => 'Send visitor message & receive AI RAG or live agent response',
        'GET  /api/messages.php?visitor_uuid={uuid}' => 'Fetch or poll message stream',
        'POST /api/leads.php' => 'Submit contact details for luxury follow-up',
        'GET  /api/leads.php' => 'Admin view captured inquiries',
        'POST /api/admin.php' => 'Admin login, live takeover & force messaging',
        'POST /api/scrape.php' => 'Scrape & index awayinstyle.com content',
        'GET  /api/seed_faqs.php' => 'Seed 50 essential concierge FAQs'
    ],
    'timestamp' => date('Y-m-d H:i:s')
]);

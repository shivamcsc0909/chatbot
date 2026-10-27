<?php
/**
 * Configuration for Away In Style Concierge Chatbot Backend
 * Designed for seamless deployment on Hostinger Shared Hosting or any standard PHP 8+ environment.
 */

// Global headers for CORS & JSON in Web SAPI
if (php_sapi_name() !== 'cli' && !headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Visitor-Id, X-Admin-Token');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

return [
    // Database configuration
    // Configured for Hostinger MySQL with your provided credentials
    'db' => [
        'driver' => 'mysql', // Using MySQL on Hostinger
        'sqlite_path' => __DIR__ . '/db/database.sqlite',
        'mysql' => [
            'host' => 'localhost',
            'database' => 'u834013214_khajd',
            'username' => 'u834013214_anbvjah',
            'password' => 'Cser@1234',
            'charset' => 'utf8mb4'
        ]
    ],

    // LLM Provider Settings (Supports Google Gemini API or OpenAI API, plus Smart Fallback Vector Search)
    'ai' => [
        'provider' => 'gemini', // 'gemini' | 'openai' | 'hybrid_local'
        'gemini_api_key' => getenv('GEMINI_API_KEY') ?: '', // Set via env or paste key here
        'gemini_model' => 'gemini-1.5-flash', // fast & generous free tier
        'openai_api_key' => getenv('OPENAI_API_KEY') ?: '',
        'openai_model' => 'gpt-4o-mini',
        'similarity_threshold' => 0.42, // Vector search relevance cutoff
        'max_context_chunks' => 5
    ],

    // Admin Credentials for Live Takeover Dashboard
    'admin' => [
        'username' => 'admin',
        'password' => 'AwayInStyle2026!', // Default password
        'jwt_secret' => 'away_in_style_luxury_concierge_super_secret_jwt_key_2026'
    ],

    // Concierge Brand Persona Configuration
    'brand' => [
        'name' => 'Away In Style',
        'assistant_name' => 'AI Lifestyle Concierge',
        'website_url' => 'https://www.awayinstyle.com/',
        'support_email' => 'anshrochan@gmail.com',
        'categories' => [
            'Luxury Travel',
            'Hotels & Resorts',
            'Fine Dining',
            'Fashion & Beauty',
            'Wellness & Spas',
            'Art, Culture & Events',
            'Brand Partnerships'
        ]
    ]
];

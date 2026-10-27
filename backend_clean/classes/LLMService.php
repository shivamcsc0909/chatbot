<?php
/**
 * RAG Concierge Engine with 50 FAQs Matching, Context Injection, and Dynamic Follow-up Suggestions
 */
require_once __DIR__ . '/VectorStore.php';

class LLMService {
    private static array $config = [];
    private static ?array $allFaqs = null;

    public static function init(array $config): void {
        self::$config = $config;
    }

    private static function getFaqs(): array {
        if (self::$allFaqs === null) {
            $faqFile = __DIR__ . '/../data/50_faqs.json';
            if (file_exists($faqFile)) {
                self::$allFaqs = json_decode(file_get_contents($faqFile), true) ?: [];
            } else {
                self::$allFaqs = [];
            }
        }
        return self::$allFaqs;
    }

    /**
     * Generate Concierge Response with RAG, Direct FAQ match, and contextual follow-up questions
     */
    public static function generateResponse(string $userMessage, array $conversationHistory = []): array {
        if (empty(self::$config)) {
            self::$config = require __DIR__ . '/../config.php';
        }

        $faqs = self::getFaqs();
        $lowerMsg = strtolower(trim($userMessage));

        // 1. Check for Direct Exact / Fuzzy Match in the 50 FAQs
        $directMatch = null;
        foreach ($faqs as $f) {
            $qLower = strtolower($f['question']);
            if ($qLower === $lowerMsg || strpos($lowerMsg, $qLower) !== false || strpos($qLower, $lowerMsg) !== false) {
                $directMatch = $f;
                break;
            }
        }

        // 2. Perform Vector Semantic Search
        $relevantChunks = VectorStore::search($userMessage, 4, 0.20);
        
        $citations = [];
        $contextTexts = [];
        $highestScore = 0.0;
        $matchedCategory = $directMatch ? ($directMatch['category'] ?? 'General') : 'General';

        if ($directMatch) {
            $reply = $directMatch['answer'];
            $highestScore = 0.98;
            $citations[] = [
                'title' => $directMatch['question'],
                'url' => $directMatch['url'] ?? 'https://www.awayinstyle.com/',
                'category' => $directMatch['category'] ?? 'Editorial'
            ];
        } else {
            foreach ($relevantChunks as $chunk) {
                $contextTexts[] = "[Source: {$chunk['title']}] [Category: {$chunk['category']}]\n{$chunk['content']}";
                if (!empty($chunk['url'])) {
                    $citations[] = [
                        'title' => $chunk['title'],
                        'url' => $chunk['url'],
                        'category' => $chunk['category']
                    ];
                }
                if ($chunk['score'] > $highestScore) {
                    $highestScore = $chunk['score'];
                    $matchedCategory = $chunk['category'];
                }
            }

            // Check LLM API or Local Synthesis
            $aiConfig = self::$config['ai'];
            $reply = null;
            if (!empty($aiConfig['gemini_api_key'])) {
                $reply = self::callGemini($userMessage, $contextTexts, $conversationHistory);
            } elseif (!empty($aiConfig['openai_api_key'])) {
                $reply = self::callOpenAI($userMessage, $contextTexts, $conversationHistory);
            }

            if (!$reply) {
                $needsFallback = ($highestScore < 0.25 && count($relevantChunks) === 0);
                $reply = self::synthesizeLocalResponse($userMessage, $relevantChunks, $needsFallback);
            }
        }

        // 3. Deduplicate citations
        $uniqueCitations = [];
        $seenUrls = [];
        foreach ($citations as $cit) {
            if (!in_array($cit['url'], $seenUrls)) {
                $seenUrls[] = $cit['url'];
                $uniqueCitations[] = $cit;
            }
        }

        // 4. Generate Dynamic Suggested Follow-up Questions from the 50 FAQs
        $suggestedQuestions = self::getFollowUpSuggestions($matchedCategory, $userMessage);

        $isExplicitHumanRequest = (bool)preg_match('/\b(human|agent|talk to real person|contact|support|call me|reach out|admin|representative|executive|submit press release|brand partnership inquiry)\b/i', $userMessage);
        $needsFallback = ($highestScore < 0.22 && count($relevantChunks) === 0) || $isExplicitHumanRequest;

        return [
            'reply' => $reply,
            'citations' => array_slice($uniqueCitations, 0, 3),
            'suggested_questions' => $suggestedQuestions,
            'fallback_required' => $needsFallback,
            'relevance_score' => $highestScore,
            'category' => $matchedCategory
        ];
    }

    /**
     * Get 3-4 contextually relevant follow-up questions from the 50 FAQs
     */
    public static function getFollowUpSuggestions(string $category, string $currentQuery): array {
        $faqs = self::getFaqs();
        $suggestions = [];
        $currentLower = strtolower($currentQuery);

        // First find questions in the same category
        foreach ($faqs as $f) {
            if (strcasecmp($f['category'], $category) === 0) {
                if (strtolower($f['question']) !== $currentLower) {
                    $suggestions[] = $f['question'];
                }
            }
        }

        // If not enough, pick diverse popular luxury questions from other pillars
        if (count($suggestions) < 3) {
            $popularPicks = [
                "Where should I go for my next luxury holiday?",
                "Can you recommend Michelin-starred restaurants?",
                "What is the Away In Style Brand Partnership Membership?",
                "Can you help me plan a luxury itinerary?",
                "Where can I find the best luxury spas?",
                "What are the latest luxury fashion trends?"
            ];
            foreach ($popularPicks as $p) {
                if (!in_array($p, $suggestions) && strtolower($p) !== $currentLower) {
                    $suggestions[] = $p;
                }
            }
        }

        // Shuffle slightly and return top 3
        return array_slice($suggestions, 0, 3);
    }

    private static function getSystemPrompt(array $contextTexts): string {
        $context = implode("\n\n---\n\n", $contextTexts);
        return <<<PROMPT
You are the AI Lifestyle Concierge for "Away In Style" (founded in Hong Kong in 2009) — an independent luxury lifestyle media platform covering luxury hotels, travel, Michelin-starred fine dining, fashion, wellness, jewellery, watches, art, and brand partnerships.

CONCIERGE TONE & PRINCIPLES:
1. Write with sophistication, warmth, discretion, and polish — like a high-end private luxury concierge. Never sound robotic or generic.
2. Ground your answers strictly in the provided Away In Style editorial context when available.
3. If specific travel dates, budgets, or destinations are needed, ask a polite, concise follow-up question.
4. When discussing brand partnership tiers, reference Chic, Luxe, and Icon packages.

EDITORIAL KNOWLEDGE CONTEXT:
{$context}
PROMPT;
    }

    private static function callGemini(string $userMessage, array $contextTexts, array $history): ?string {
        $key = self::$config['ai']['gemini_api_key'];
        $model = self::$config['ai']['gemini_model'] ?? 'gemini-1.5-flash';
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";

        $systemPrompt = self::getSystemPrompt($contextTexts);
        
        $contents = [];
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => "System Instructions:\n" . $systemPrompt . "\n\nUser Query:\n" . $userMessage]]
        ];

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 600
            ]
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 15
        ]);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if (PHP_VERSION_ID < 80500) { @curl_close($ch); }

        if ($code === 200 && $res) {
            $json = json_decode($res, true);
            return $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
        }

        return null;
    }

    private static function callOpenAI(string $userMessage, array $contextTexts, array $history): ?string {
        $key = self::$config['ai']['openai_api_key'];
        $model = self::$config['ai']['openai_model'] ?? 'gpt-4o-mini';

        $systemPrompt = self::getSystemPrompt($contextTexts);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userMessage]
        ];

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.4,
                'max_tokens' => 600
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $key
            ],
            CURLOPT_TIMEOUT => 15
        ]);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if (PHP_VERSION_ID < 80500) { @curl_close($ch); }

        if ($code === 200 && $res) {
            $json = json_decode($res, true);
            return $json['choices'][0]['message']['content'] ?? null;
        }

        return null;
    }

    private static function synthesizeLocalResponse(string $userMessage, array $chunks, bool $needsFallback): string {
        if ($needsFallback || count($chunks) === 0) {
            return "Thank you for reaching out to Away In Style. While I am curating our latest luxury editorial features on this subject, our private concierge team would be delighted to assist you personally.\n\nPlease share your contact details below, and a member of our lifestyle and partnerships team will connect with you promptly.";
        }

        $topChunk = $chunks[0];
        $content = $topChunk['content'];

        if (preg_match('/Answer:\s*(.+)/s', $content, $match)) {
            return trim($match[1]);
        }

        return $content;
    }
}

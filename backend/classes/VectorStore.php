<?php
/**
 * Vector Storage, Text Chunking, Embeddings, and Cosine Semantic Search
 */
require_once __DIR__ . '/Database.php';

class VectorStore {
    private static array $config = [];

    public static function init(array $config): void {
        self::$config = $config;
    }

    /**
     * Chunk text into overlapping segments
     */
    public static function chunkText(string $text, int $chunkSize = 600, int $overlap = 100): array {
        $text = trim(preg_replace('/\s+/', ' ', $text));
        if (mb_strlen($text) <= $chunkSize) {
            return [$text];
        }

        $chunks = [];
        $length = mb_strlen($text);
        $start = 0;

        while ($start < $length) {
            $end = min($start + $chunkSize, $length);
            if ($end < $length) {
                // Try to split on sentence or word boundary
                $lastPeriod = mb_strrpos(mb_substr($text, $start, $chunkSize), '.');
                $lastSpace = mb_strrpos(mb_substr($text, $start, $chunkSize), ' ');
                if ($lastPeriod !== false && $lastPeriod > $chunkSize * 0.6) {
                    $end = $start + $lastPeriod + 1;
                } elseif ($lastSpace !== false && $lastSpace > $chunkSize * 0.6) {
                    $end = $start + $lastSpace;
                }
            }

            $chunk = trim(mb_substr($text, $start, $end - $start));
            if (!empty($chunk)) {
                $chunks[] = $chunk;
            }

            if ($end >= $length) {
                break;
            }
            $start = $end - $overlap;
        }

        return $chunks;
    }

    /**
     * Generate embedding vector. Uses Gemini / OpenAI if API key available, 
     * or fallback to fast lightweight character/subword term vector for instant zero-dependency execution.
     */
    public static function generateEmbedding(string $text): array {
        if (empty(self::$config)) {
            self::$config = require __DIR__ . '/../config.php';
        }

        $ai = self::$config['ai'];

        // Option 1: Gemini text-embedding-004
        if (!empty($ai['gemini_api_key'])) {
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=' . $ai['gemini_api_key'];
            $payload = [
                'model' => 'models/text-embedding-004',
                'content' => ['parts' => [['text' => mb_substr($text, 0, 2048)]]]
            ];

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_TIMEOUT => 10
            ]);
            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if (PHP_VERSION_ID < 80500) { @curl_close($ch); }

            if ($httpCode === 200 && $res) {
                $json = json_decode($res, true);
                if (isset($json['embedding']['values'])) {
                    return $json['embedding']['values'];
                }
            }
        }

        // Option 2: OpenAI text-embedding-3-small
        if (!empty($ai['openai_api_key'])) {
            $ch = curl_init('https://api.openai.com/v1/embeddings');
            $payload = [
                'model' => 'text-embedding-3-small',
                'input' => mb_substr($text, 0, 2048)
            ];
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $ai['openai_api_key']
                ],
                CURLOPT_TIMEOUT => 10
            ]);
            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && $res) {
                $json = json_decode($res, true);
                if (isset($json['data'][0]['embedding'])) {
                    return $json['data'][0]['embedding'];
                }
            }
        }

        // Option 3: Built-in Subword N-Gram & Keyword Semantic Hash Vector (128 Dimensions)
        return self::generateLocalSemanticVector($text);
    }

    /**
     * Zero-dependency deterministic semantic vector (128-dim) using hashed n-grams & TF frequencies
     */
    public static function generateLocalSemanticVector(string $text): array {
        $dim = 128;
        $vector = array_fill(0, $dim, 0.0);
        $clean = strtolower(preg_replace('/[^a-z0-9\s]/', ' ', $text));
        $words = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY);

        foreach ($words as $word) {
            // Word hash
            $hash = crc32($word) % $dim;
            if ($hash < 0) $hash += $dim;
            $vector[$hash] += 2.0;

            // Character tri-grams
            $len = strlen($word);
            for ($i = 0; $i <= $len - 3; $i++) {
                $trigram = substr($word, $i, 3);
                $thash = crc32($trigram) % $dim;
                if ($thash < 0) $thash += $dim;
                $vector[$thash] += 0.5;
            }
        }

        // Normalize vector to unit length (L2 norm)
        $norm = 0.0;
        foreach ($vector as $v) {
            $norm += $v * $v;
        }
        $norm = sqrt($norm);
        if ($norm > 0) {
            for ($i = 0; $i < $dim; $i++) {
                $vector[$i] /= $norm;
            }
        }

        return $vector;
    }

    /**
     * Compute cosine similarity between two float vectors
     */
    public static function cosineSimilarity(array $vecA, array $vecB): float {
        $count = min(count($vecA), count($vecB));
        if ($count === 0) return 0.0;

        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $count; $i++) {
            $a = (float)$vecA[$i];
            $b = (float)$vecB[$i];
            $dotProduct += $a * $b;
            $normA += $a * $a;
            $normB += $b * $b;
        }

        $denominator = sqrt($normA) * sqrt($normB);
        return $denominator > 0 ? ($dotProduct / $denominator) : 0.0;
    }

    /**
     * Add or update knowledge chunk
     */
    public static function addChunk(string $title, string $content, string $category = 'General', string $url = '', string $chunkType = 'faq'): int {
        $pdo = Database::getConnection();
        $embedding = self::generateEmbedding($title . ' ' . $content);
        $embeddingJson = json_encode($embedding);

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("INSERT INTO knowledge_chunks (title, content, category, url, embedding, chunk_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $content, $category, $url, $embeddingJson, $chunkType, $now]);
        return (int)$pdo->lastInsertId();
    }

    /**
     * Search relevant knowledge chunks using hybrid vector similarity + keyword matching
     */
    public static function search(string $query, int $topK = 4, float $minScore = 0.25): array {
        $pdo = Database::getConnection();
        $queryEmbedding = self::generateEmbedding($query);
        $queryWords = preg_split('/\s+/', strtolower($query), -1, PREG_SPLIT_NO_EMPTY);

        $stmt = $pdo->query("SELECT id, title, content, category, url, embedding, chunk_type FROM knowledge_chunks");
        $allChunks = $stmt->fetchAll();

        $results = [];

        foreach ($allChunks as $chunk) {
            $chunkEmbedding = json_decode($chunk['embedding'] ?? '[]', true);
            $vecSim = 0.0;
            if (is_array($chunkEmbedding) && count($chunkEmbedding) > 0) {
                $vecSim = self::cosineSimilarity($queryEmbedding, $chunkEmbedding);
            }

            // Keyword boost
            $contentLower = strtolower($chunk['title'] . ' ' . $chunk['content'] . ' ' . $chunk['category']);
            $keywordScore = 0.0;
            foreach ($queryWords as $word) {
                if (strlen($word) > 2 && strpos($contentLower, $word) !== false) {
                    $keywordScore += 0.15;
                }
            }

            $totalScore = ($vecSim * 0.75) + min(0.35, $keywordScore);

            if ($totalScore >= $minScore) {
                $results[] = [
                    'id' => $chunk['id'],
                    'title' => $chunk['title'],
                    'content' => $chunk['content'],
                    'category' => $chunk['category'],
                    'url' => $chunk['url'],
                    'chunk_type' => $chunk['chunk_type'],
                    'score' => round($totalScore, 4)
                ];
            }
        }

        // Sort by relevance score descending
        usort($results, fn($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($results, 0, $topK);
    }
}

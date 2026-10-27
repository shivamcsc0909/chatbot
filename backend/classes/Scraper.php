<?php
/**
 * Web Scraper for Away In Style (https://www.awayinstyle.com/) and luxury editorial links
 */
require_once __DIR__ . '/VectorStore.php';

class Scraper {
    /**
     * Fetch HTML from URL
     */
    public static function fetchUrl(string $url): ?string {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 AwayInStyleConciergeBot/1.0'
        ]);

        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        if (PHP_VERSION_ID < 80500) {
            @curl_close($ch);
        }

        if ($httpCode >= 200 && $httpCode < 400 && $html) {
            return $html;
        }

        return null;
    }

    /**
     * Clean and extract main article text and structure from HTML
     */
    public static function extractContent(string $html): array {
        // Suppress HTML5 parsing warnings in DOMDocument
        libxml_use_internal_errors(true);
        $doc = new DOMDocument();
        $doc->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));
        libxml_clear_errors();

        $xpath = new DOMXPath($doc);

        // Remove script, style, nav, footer, header tags
        $nodesToRemove = $xpath->query('//script|//style|//nav|//footer|//header|//iframe|//noscript|//svg');
        foreach ($nodesToRemove as $node) {
            $node->parentNode->removeChild($node);
        }

        // Get title
        $titleNode = $xpath->query('//title')->item(0);
        $title = $titleNode ? trim($titleNode->textContent) : 'Away In Style Editorial';

        // Check for og:title or h1
        $h1Node = $xpath->query('//h1')->item(0);
        if ($h1Node && mb_strlen(trim($h1Node->textContent)) > 5) {
            $title = trim($h1Node->textContent);
        }

        // Extract paragraphs and headings
        $contentParts = [];
        $contentNodes = $xpath->query('//article//p | //article//h2 | //article//h3 | //main//p | //main//h2 | //main//h3 | //div[contains(@class, "content") or contains(@class, "entry") or contains(@class, "post") or contains(@class, "article")]//p | //p');

        foreach ($contentNodes as $node) {
            $text = trim(preg_replace('/\s+/', ' ', $node->textContent));
            if (mb_strlen($text) >= 40) { // filter out short disclaimers and cookie notices
                $contentParts[] = $text;
            }
        }

        $fullText = implode("\n\n", $contentParts);
        return [
            'title' => $title,
            'text' => $fullText
        ];
    }

    /**
     * Ingest a URL: Fetch, extract, chunk, generate embeddings, and save
     */
    public static function ingestUrl(string $url, string $category = 'Editorial Discovery'): array {
        $html = self::fetchUrl($url);
        if (!$html) {
            return [
                'success' => false,
                'error' => "Failed to fetch content from $url. Please ensure URL is accessible."
            ];
        }

        $extracted = self::extractContent($html);
        if (empty($extracted['text'])) {
            return [
                'success' => false,
                'error' => "No readable article content found at $url."
            ];
        }

        $chunks = VectorStore::chunkText($extracted['text'], 600, 100);
        $chunkCount = 0;

        foreach ($chunks as $chunk) {
            VectorStore::addChunk($extracted['title'], $chunk, $category, $url, 'scraped');
            $chunkCount++;
        }

        return [
            'success' => true,
            'title' => $extracted['title'],
            'url' => $url,
            'category' => $category,
            'chunks_created' => $chunkCount,
            'total_characters' => mb_strlen($extracted['text'])
        ];
    }
}

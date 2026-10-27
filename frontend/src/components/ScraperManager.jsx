import React, { useState, useEffect } from 'react';
import { 
  Globe, Download, Search, Trash2, Database, Sparkles, 
  ExternalLink, CheckCircle2, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { scrapeUrl, getKnowledgeChunks, deleteChunk, testSemanticSearch } from '../services/api';

export default function ScraperManager() {
  const [url, setUrl] = useState('https://www.awayinstyle.com/');
  const [category, setCategory] = useState('Editorial Discovery');
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);

  const [chunks, setChunks] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'faq', 'scraped'
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Semantic search tester state
  const [testQuery, setTestQuery] = useState('luxury beachfront hotels with private pools');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadChunks();
  }, [filterType]);

  const loadChunks = async () => {
    setLoadingChunks(true);
    try {
      const res = await getKnowledgeChunks(filterType);
      if (res.success) {
        setChunks(res.chunks);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!url.trim() || scraping) return;

    setScraping(true);
    setScrapeResult(null);

    try {
      const res = await scrapeUrl(url, category);
      setScrapeResult(res);
      if (res.success) {
        loadChunks();
      }
    } catch (err) {
      setScrapeResult({ success: false, error: 'Network error during scraping.' });
    } finally {
      setScraping(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete knowledge chunk #${id}?`)) return;
    try {
      const res = await deleteChunk(id);
      if (res.success) {
        setChunks(chunks.filter(c => c.id !== id));
      }
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleTestSearch = async (e) => {
    e?.preventDefault();
    if (!testQuery.trim() || searching) return;

    setSearching(true);
    try {
      const res = await testSemanticSearch(testQuery);
      if (res.success) {
        setSearchResults(res.results);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Web Scraper Form */}
      <div className="p-5 bg-obsidian-900 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold-400" />
            <h3 className="text-sm font-bold text-zinc-100 font-luxury tracking-wide">
              Away In Style Web Crawler & Knowledge Extractor
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded">
            Auto-Chunking + Vector Embeddings
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Ingest any article or URL from <strong className="text-gold-300">https://www.awayinstyle.com/</strong>. The crawler will extract editorial text, divide it into semantic chunks with overlap, generate vector embeddings, and store them into SQLite/MySQL.
        </p>

        <form onSubmit={handleScrape} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">Target URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.awayinstyle.com/..."
              className="w-full px-3.5 py-2 text-xs bg-obsidian-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] text-zinc-400 font-medium block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-obsidian-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-gold-400"
            >
              <option value="Editorial Discovery">Editorial Discovery</option>
              <option value="Luxury Travel & Hotels">Luxury Travel & Hotels</option>
              <option value="Fine Dining & Gastronomy">Fine Dining & Gastronomy</option>
              <option value="Fashion & Beauty">Fashion & Beauty</option>
              <option value="Watches & Jewellery">Watches & Jewellery</option>
              <option value="Wellness & Spas">Wellness & Spas</option>
              <option value="Culture & Events">Culture & Events</option>
              <option value="Brand Partnerships">Brand Partnerships</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={scraping}
              className="w-full py-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:brightness-110 text-obsidian-950 text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow"
            >
              {scraping ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Crawling...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Scrape & Index</span>
                </>
              )}
            </button>
          </div>
        </form>

        {scrapeResult && (
          <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
            scrapeResult.success ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-200' : 'bg-red-950/50 border border-red-500/30 text-red-200'
          }`}>
            {scrapeResult.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Successfully Indexed:</strong> {scrapeResult.title}
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Created {scrapeResult.chunks_created} vector chunks ({scrapeResult.total_characters} characters).
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Scraping Notice:</strong> {scrapeResult.error}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Middle Section: Semantic Vector Search Tester */}
      <div className="p-5 bg-obsidian-900 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <h3 className="text-sm font-bold text-zinc-100 font-luxury tracking-wide">
              RAG Semantic Search & Cosine Vector Tester
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            Hybrid Cosine Math
          </span>
        </div>

        <form onSubmit={handleTestSearch} className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="Type any natural query (e.g. Michelin restaurants, brand membership tiers, Maldives resorts)..."
            className="flex-1 px-3.5 py-2 text-xs bg-obsidian-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-gold-400"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-obsidian-800 hover:bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Test Vector Similarity</span>
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
              Top Matched Vector Chunks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchResults.map((res, i) => (
                <div key={i} className="p-3 bg-obsidian-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gold-300 font-semibold truncate max-w-[200px]">{res.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-gold-500/20 text-gold-300 rounded font-mono font-bold">
                      Score: {(res.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-3 whitespace-pre-wrap">{res.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Chunks Table */}
      <div className="p-5 bg-obsidian-900 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-zinc-100 font-luxury tracking-wide">
              Knowledge Base Chunks Repository ({chunks.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded ${filterType === 'all' ? 'bg-gold-500 text-obsidian-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('faq')}
              className={`px-2.5 py-1 text-xs rounded ${filterType === 'faq' ? 'bg-gold-500 text-obsidian-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
            >
              50 FAQs
            </button>
            <button
              onClick={() => setFilterType('scraped')}
              className={`px-2.5 py-1 text-xs rounded ${filterType === 'scraped' ? 'bg-gold-500 text-obsidian-950 font-bold' : 'bg-zinc-800 text-zinc-300'}`}
            >
              Scraped Articles
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-obsidian-850 text-zinc-400 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Title / Question</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Editorial URL</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loadingChunks ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500">
                    Loading knowledge chunks...
                  </td>
                </tr>
              ) : chunks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500">
                    No knowledge chunks found.
                  </td>
                </tr>
              ) : (
                chunks.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/40">
                    <td className="p-2.5 font-mono text-zinc-500">#{c.id}</td>
                    <td className="p-2.5 font-medium text-zinc-100 max-w-[280px] truncate">{c.title}</td>
                    <td className="p-2.5 text-gold-300/80">{c.category}</td>
                    <td className="p-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                        c.chunk_type === 'faq' ? 'bg-gold-950 text-gold-300 border border-gold-500/30' : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                      }`}>
                        {c.chunk_type}
                      </span>
                    </td>
                    <td className="p-2.5 text-zinc-400 font-mono text-[11px] truncate max-w-[160px]">
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer" className="text-gold-400 hover:underline flex items-center gap-1">
                          <span>Link</span> <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition"
                        title="Delete chunk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * API Service for Concierge Chatbot & Admin Dashboard
 */
import { findLocalFaqAnswer } from '../data/luxuryFaqs';

const API_BASE = '/api';

export function getVisitorId() {
  let vid = localStorage.getItem('awayinstyle_visitor_uuid');
  if (!vid) {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const timestampHex = Date.now().toString(16);
    vid = `vis_${randomHex}_${timestampHex}`;
    localStorage.setItem('awayinstyle_visitor_uuid', vid);
  }
  return vid;
}

/**
 * Send chat message from visitor with instant resilient fallback
 */
export async function sendChatMessage(message, currentPage = '/') {
  const visitorUuid = getVisitorId();
  const local = findLocalFaqAnswer(message);

  try {
    const res = await fetch(`${API_BASE}/chat.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-Id': visitorUuid
      },
      body: JSON.stringify({
        message,
        visitor_uuid: visitorUuid,
        current_page: currentPage
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.reply) {
        return json;
      }
    }
  } catch (err) {
    console.warn('Backend fetch failed, using instant local FAQ intelligence:', err);
  }

  // Resilient fallback returning 50 FAQs answer + suggestions
  if (local) {
    return {
      success: true,
      visitor_uuid: visitorUuid,
      mode: 'bot',
      reply: {
        id: Date.now(),
        sender: 'bot',
        message: local.answer,
        citations: [{ title: local.question, url: local.url, category: local.category }],
        suggested_questions: local.followUps,
        fallback_required: false,
        category: local.category,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    };
  }

  return {
    success: true,
    visitor_uuid: visitorUuid,
    mode: 'bot',
    reply: {
      id: Date.now(),
      sender: 'bot',
      message: "Away In Style is an independent luxury lifestyle media platform founded in Hong Kong in 2009. We bring together inspiring editorial, exceptional destinations, leading brands and curated lifestyle experiences.\n\nPlease explore one of our featured lifestyle questions below:",
      citations: [{ title: 'Away In Style Discovery', url: 'https://www.awayinstyle.com/', category: 'Platform Information' }],
      suggested_questions: [
        "Where should I go for my next luxury holiday?",
        "Can you recommend Michelin-starred restaurants?",
        "What is the Away In Style Brand Partnership Membership?"
      ],
      fallback_required: false,
      category: 'General',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  };
}

export async function fetchMessages(afterId = 0) {
  const visitorUuid = getVisitorId();
  try {
    const res = await fetch(`${API_BASE}/messages.php?visitor_uuid=${encodeURIComponent(visitorUuid)}&after_id=${afterId}`);
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    // silent
  }
  return { success: true, messages: [] };
}

export async function fetchVisitorMessages(visitorUuid, afterId = 0) {
  try {
    const res = await fetch(`${API_BASE}/messages.php?visitor_uuid=${encodeURIComponent(visitorUuid)}&after_id=${afterId}`);
    if (res.ok) return res.json();
  } catch (e) {
    // silent
  }
  return { success: true, messages: [] };
}

export async function submitLead(data) {
  const visitorUuid = getVisitorId();
  try {
    const res = await fetch(`${API_BASE}/leads.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Visitor-Id': visitorUuid
      },
      body: JSON.stringify({
        ...data,
        visitor_uuid: visitorUuid
      })
    });
    if (res.ok) return res.json();
  } catch (e) {
    // silent
  }
  return { success: true, message: 'Inquiry received' };
}

export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin.php?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return res.json();
}

export async function getAdminStats(token) {
  const res = await fetch(`${API_BASE}/admin.php?action=stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function getAdminVisitors(token) {
  const res = await fetch(`${API_BASE}/admin.php?action=visitors`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function setVisitorMode(visitorUuid, mode, token) {
  const res = await fetch(`${API_BASE}/admin.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      action: 'set_mode',
      visitor_uuid: visitorUuid,
      mode
    })
  });
  return res.json();
}

export async function sendAdminMessage(visitorUuid, message, token) {
  const res = await fetch(`${API_BASE}/admin.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      action: 'send_message',
      visitor_uuid: visitorUuid,
      message
    })
  });
  return res.json();
}

export async function scrapeUrl(url, category, token) {
  const res = await fetch(`${API_BASE}/scrape.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ url, category })
  });
  return res.json();
}

export async function getKnowledgeChunks(type = 'all', token) {
  const res = await fetch(`${API_BASE}/scrape.php?type=${type}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function deleteChunk(id, token) {
  const res = await fetch(`${API_BASE}/scrape.php?id=${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function getLeads(status = '', token) {
  const url = status ? `${API_BASE}/leads.php?status=${status}` : `${API_BASE}/leads.php`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function updateLeadStatus(id, status, token) {
  const res = await fetch(`${API_BASE}/leads.php`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ id, status })
  });
  return res.json();
}

export async function testSemanticSearch(query, token) {
  const res = await fetch(`${API_BASE}/admin.php?action=test_search&q=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

(function() {
  // Away In Style Standalone Luxury Concierge Chat Widget Embedder
  if (window.AwayInStyleChatLoaded) return;
  window.AwayInStyleChatLoaded = true;

  const currentScript = document.currentScript;
  const apiEndpoint = currentScript ? (currentScript.getAttribute('data-api-endpoint') || '/api') : '/api';

  // Create iframe or container
  const container = document.createElement('div');
  container.id = 'awayinstyle-concierge-root';
  document.body.appendChild(container);

  // Inject luxury font styles
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(fontLink);

  console.log('[Away In Style Concierge] Widget initialized with endpoint:', apiEndpoint);
})();

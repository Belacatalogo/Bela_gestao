const CANDIDATE_DOCUMENTS = [
  { label: 'root atual /index.html', url: '/index.html', source: 'same-origin' },
  { label: 'parent ../index.html', url: '../index.html', source: 'same-origin' },
  { label: 'GitHub lab index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela_gestao/rewrite-bela-gestao-lab/index.html', source: 'github-raw-lab' },
  { label: 'GitHub main index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela_gestao/main/index.html', source: 'github-raw-main' },
];

const PRODUCT_FIELD_PATTERNS = [
  /\bname\s*:/gi,
  /\bnome\s*:/gi,
  /\bbrand\s*:/gi,
  /\bmarca\s*:/gi,
  /\bprice\s*:/gi,
  /\bpreco\s*:/gi,
  /\bfoto\s*:/gi,
  /\bfotos\s*:/gi,
  /\bcategory\s*:/gi,
  /\bcategories\s*:/gi,
  /\bcatalogTab\s*:/gi,
  /\bcatalogTabs\s*:/gi,
];

function countMatches(text, regex) {
  return (String(text || '').match(regex) || []).length;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractLocalStorageKeys(text) {
  const keys = [];
  const patterns = [
    /localStorage\.(?:getItem|setItem|removeItem)\(\s*['\"]([^'\"]+)['\"]/g,
    /localStorage\[['\"]([^'\"]+)['\"]\]/g,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text))) keys.push(match[1]);
  });
  return unique(keys);
}

function extractFirebasePathHints(text) {
  const hints = [];
  const patterns = [
    /(?:ref|child)\(\s*(?:database|db)?\s*,?\s*['\"]([^'\"]+)['\"]\s*\)/g,
    /(?:database|db)\.ref\(\s*['\"]([^'\"]+)['\"]\s*\)/g,
    /['\"]\/(?:produtos|products|precos|catalog|catalogo|carrossel|backup|config)[^'\"]*['\"]/gi,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text))) hints.push((match[1] || match[0]).replaceAll('"', '').replaceAll("'", ''));
  });
  return unique(hints);
}

function extractScriptSources(html, baseUrl) {
  const sources = [];
  const pattern = /<script[^>]+src=['\"]([^'\"]+)['\"][^>]*>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    try {
      sources.push(new URL(match[1], baseUrl).href);
    } catch {
      sources.push(match[1]);
    }
  }
  return unique(sources);
}

function estimateProductObjects(text) {
  const productLikeObjectPattern = /\{[^{}]{0,1200}(?:name|nome|brand|marca|price|preco|foto|fotos|category|catalogTab|catalogTabs)\s*:[^{}]{0,1200}\}/gi;
  const objectMatches = String(text || '').match(productLikeObjectPattern) || [];
  const strongProductMatches = objectMatches.filter((chunk) => {
    const score = [
      /(?:name|nome)\s*:/i,
      /(?:price|preco)\s*:/i,
      /(?:foto|fotos|image|imageUrl)\s*:/i,
      /(?:category|categories|catalogTab|catalogTabs|sub)\s*:/i,
    ].filter((regex) => regex.test(chunk)).length;
    return score >= 2;
  });
  return {
    productLikeObjects: objectMatches.length,
    strongProductLikeObjects: strongProductMatches.length,
    sample: strongProductMatches.slice(0, 5).map((item) => item.slice(0, 260)),
  };
}

function extractArrayHints(text) {
  const hints = [];
  const patterns = [
    /(?:const|let|var)\s+([A-Za-z0-9_$]*(?:prod|product|catalog|catalogo|preco|price)[A-Za-z0-9_$]*)\s*=\s*\[/gi,
    /([A-Za-z0-9_$]*(?:prod|product|catalog|catalogo|preco|price)[A-Za-z0-9_$]*)\s*:\s*\[/gi,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text))) hints.push(match[1]);
  });
  return unique(hints);
}

function extractObjectHints(text) {
  const hints = [];
  const patterns = [
    /(?:const|let|var)\s+([A-Za-z0-9_$]*(?:prod|product|catalog|catalogo|preco|price)[A-Za-z0-9_$]*)\s*=\s*\{/gi,
    /([A-Za-z0-9_$]*(?:prod|product|catalog|catalogo|preco|price)[A-Za-z0-9_$]*)\s*:\s*\{/gi,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text))) hints.push(match[1]);
  });
  return unique(hints);
}

function analyzeText(label, url, text) {
  const fieldCounts = Object.fromEntries(PRODUCT_FIELD_PATTERNS.map((regex) => [regex.source.replace('\\b', '').replace('\\s*:', '').replace('/gi', ''), countMatches(text, regex)]));
  const productEstimate = estimateProductObjects(text);
  const localStorageKeys = extractLocalStorageKeys(text);
  const firebasePathHints = extractFirebasePathHints(text);
  const arrayHints = extractArrayHints(text);
  const objectHints = extractObjectHints(text);
  const scriptSources = label.includes('index') || /<html/i.test(text) ? extractScriptSources(text, url) : [];

  const score = productEstimate.strongProductLikeObjects
    + arrayHints.length * 5
    + objectHints.length * 3
    + localStorageKeys.filter((key) => /prod|catalog|preco|price|bela/i.test(key)).length * 4
    + firebasePathHints.length * 2;

  return {
    label,
    url,
    bytes: text.length,
    fieldCounts,
    productEstimate,
    localStorageKeys,
    firebasePathHints,
    arrayHints,
    objectHints,
    scriptSources,
    score,
    likelyContainsCatalogProducts: score >= 20 || productEstimate.strongProductLikeObjects >= 20,
  };
}

async function fetchText(candidate) {
  const response = await fetch(candidate.url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function analyzeCandidate(candidate) {
  try {
    const text = await fetchText(candidate);
    return { ok: true, ...analyzeText(candidate.label, candidate.url, text) };
  } catch (error) {
    return {
      ok: false,
      label: candidate.label,
      url: candidate.url,
      error: String(error?.message || error),
    };
  }
}

async function analyzeScriptSources(sourceAnalysis) {
  const scripts = [];
  for (const source of sourceAnalysis.scriptSources.slice(0, 8)) {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const text = await response.text();
      scripts.push({ ok: true, ...analyzeText(`script ${source.split('/').pop()}`, source, text) });
    } catch (error) {
      scripts.push({ ok: false, label: `script ${source.split('/').pop()}`, url: source, error: String(error?.message || error) });
    }
  }
  return scripts;
}

export async function discoverCatalogRealSource() {
  const analyzed = [];
  for (const candidate of CANDIDATE_DOCUMENTS) {
    const result = await analyzeCandidate(candidate);
    analyzed.push(result);
  }

  const scriptResults = [];
  for (const result of analyzed.filter((item) => item.ok && item.scriptSources?.length)) {
    const scripts = await analyzeScriptSources(result);
    scriptResults.push(...scripts);
  }

  const allResults = [...analyzed, ...scriptResults];
  const successful = allResults.filter((item) => item.ok);
  const ranked = successful.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  const best = ranked[0] || null;
  const likelySources = ranked.filter((item) => item.likelyContainsCatalogProducts).slice(0, 5);

  const localStorageKeys = unique(successful.flatMap((item) => item.localStorageKeys || []));
  const firebasePathHints = unique(successful.flatMap((item) => item.firebasePathHints || []));
  const arrayHints = unique(successful.flatMap((item) => item.arrayHints || []));
  const objectHints = unique(successful.flatMap((item) => item.objectHints || []));

  return {
    ok: successful.length > 0,
    writeBlocked: true,
    catalogWriteExecuted: false,
    firebaseWriteExecuted: false,
    analyzed: allResults,
    best,
    likelySources,
    hints: {
      localStorageKeys,
      firebasePathHints,
      arrayHints,
      objectHints,
    },
    conclusion: best?.likelyContainsCatalogProducts
      ? `Fonte provável encontrada: ${best.label}. Próximo passo: exportar/parsear essa fonte para JSON.`
      : 'Ainda não foi encontrada uma fonte única com aparência forte de catálogo completo. Próximo passo: exportador do HTML renderizado/localStorage do catálogo.',
    message: 'Descoberta de fonte do catálogo concluída sem alterar o catálogo real.',
  };
}

// Realistic handwriting processing and organic jitter engine

// Simple seeded PRNG for consistent yet re-seedable organic jitter
export class SeededRandom {
  constructor(seed = 12345) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }
}

/**
 * Transforms raw markdown-like text into structured, styled HTML
 * with organic handwriting jitter, realistic pen ink pressure variations,
 * and support for strikeouts (~text~), highlights (==text==), and bold (**text**).
 */
export function formatHandwrittenContent(rawText, options = {}) {
  const {
    jitterIntensity = 0.5, // 0 to 1
    baselineWobble = 0.5,  // 0 to 1
    inkOpacity = 0.94,
    inkColor = '#1a3c8e',
    rng = new SeededRandom(42),
    enableMistakes = true,
    fontFamily = "'Bad Script', cursive"
  } = options;

  if (!rawText || rawText.trim() === '') {
    return '<p class="hw-paragraph empty-notice">Начните вводить текст слева...</p>';
  }

  // Split into paragraphs (keeping empty lines as spacers)
  const lines = rawText.split('\n');
  const renderedParagraphs = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed === '') {
      renderedParagraphs.push('<div class="hw-line-spacer"></div>');
      return;
    }

    // Process line formatting tokens
    const paragraphHtml = processLineToHandwrittenHtml(line, {
      jitterIntensity,
      baselineWobble,
      rng,
      enableMistakes
    });

    renderedParagraphs.push(`<p class="hw-paragraph">${paragraphHtml}</p>`);
  });

  return renderedParagraphs.join('\n');
}

/**
 * Parses markdown inline styles and wraps words in micro-jittered spans
 */
function processLineToHandwrittenHtml(lineText, { jitterIntensity, baselineWobble, rng, enableMistakes }) {
  // Regex tokens:
  // **bold** -> <strong>
  // ~strike~ -> <del class="hw-mistake">
  // ==highlight== -> <mark class="hw-highlight">
  // Bullet points: • or - at start
  let isBullet = false;
  let text = lineText;

  if (text.startsWith('• ') || text.startsWith('- ')) {
    isBullet = true;
    text = text.substring(2);
  }

  // Tokenize string while preserving markdown delimiters
  // We can tokenize by regex matching special wrappers
  const tokens = [];
  const tokenRegex = /(\*\*[^*]+\*\*|~[^~]+~|==[^=]+==|[^\s*~=]+|\s+)/g;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    tokens.push(match[0]);
  }

  // If regex missed anything, fallback
  if (tokens.length === 0) {
    tokens.push(text);
  }

  // Build jittered HTML
  let outputHtml = isBullet ? '<span class="hw-bullet">• </span>' : '';

  // Organic line baseline drift for this whole line
  const lineTilt = rng.range(-0.4, 0.4) * baselineWobble;

  tokens.forEach((token) => {
    if (/^\s+$/.test(token)) {
      // Space or tab
      outputHtml += ' ';
      return;
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      outputHtml += `<strong class="hw-bold">${renderJitteredWords(inner, { jitterIntensity, lineTilt, rng })}</strong>`;
    } else if (token.startsWith('~') && token.endsWith('~')) {
      const inner = token.slice(1, -1);
      outputHtml += `<del class="hw-mistake" title="Помарка/исправление">${renderJitteredWords(inner, { jitterIntensity, lineTilt, rng })}</del>`;
    } else if (token.startsWith('==') && token.endsWith('==')) {
      const inner = token.slice(2, -2);
      outputHtml += `<mark class="hw-highlight">${renderJitteredWords(inner, { jitterIntensity, lineTilt, rng })}</mark>`;
    } else {
      outputHtml += renderJitteredWords(token, { jitterIntensity, lineTilt, rng });
    }
  });

  return outputHtml;
}

/**
 * Wraps individual words in micro-jitter CSS transforms for authentic human variation
 */
function renderJitteredWords(wordStr, { jitterIntensity, lineTilt, rng }) {
  // Words split by space
  const words = wordStr.split(' ');
  return words
    .map((word) => {
      if (!word) return '';

      // Random micro-rotations and offsets
      const maxRot = 1.6 * jitterIntensity;
      const rot = rng.range(-maxRot, maxRot) + lineTilt;
      
      const maxShiftY = 1.2 * jitterIntensity;
      const shiftY = rng.range(-maxShiftY, maxShiftY);
      
      const maxShiftX = 0.4 * jitterIntensity;
      const shiftX = rng.range(-maxShiftX, maxShiftX);

      // Micro letter-spacing variation
      const letterSpacingVar = rng.range(-0.3, 0.5) * jitterIntensity;

      // Micro ink pressure variation (simulates pen pressure on paper)
      const opacity = rng.range(0.92, 1.0);

      const style = `display:inline-block; transform: translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px) rotate(${rot.toFixed(2)}deg); letter-spacing: ${letterSpacingVar.toFixed(2)}px; opacity: ${opacity.toFixed(2)};`;

      return `<span class="hw-word" style="${style}">${escapeHtml(word)}</span>`;
    })
    .join(' ');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

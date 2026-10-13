import './style.css';
import { HANDWRITING_FONTS, INK_PRESETS, PAPER_PRESETS } from './fonts.js';
import { SAMPLE_TEXTS } from './samples.js';
import { SeededRandom, formatHandwrittenContent } from './realism.js';
import { paginateText, A4_WIDTH_PX, A4_HEIGHT_PX } from './paginator.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// State Management
const state = {
  text: SAMPLE_TEXTS[0].text,
  fontId: SAMPLE_TEXTS[0].font,
  fontSize: SAMPLE_TEXTS[0].fontSize,
  lineHeight: 1.6,
  inkColor: '#1a3c8e',
  inkOpacity: 0.94,
  paperId: SAMPLE_TEXTS[0].paper,
  hasMargin: true,
  marginPosMm: 30,
  paraIndent: 30,
  jitterIntensity: 0.5,
  baselineWobble: 0.4,
  enableMistakes: true,
  showDate: true,
  dateText: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
  showPageNumbers: true,
  headerTitle: 'Конспект № 1',
  showHeaderTitle: false,
  zoomLevel: 0.75, // Default scale for comfortable screen view
  seed: 42,
  activeTab: 'text',
};

// Main DOM Shell Injection
const appContainer = document.querySelector('#app');

appContainer.innerHTML = `
  <header class="app-header">
    <div class="brand">
      <div class="brand-icon">✍️</div>
      <div>
        <div class="brand-title">
          Рукопись А4
          <span class="brand-badge">Печатный лист</span>
        </div>
        <div class="brand-tagline">Генератор рукописных конспектов и документов А4</div>
      </div>
    </div>

    <div class="header-actions">
      <button id="btn-reseed" class="btn btn-secondary" title="Пересчитать случайные вариации наклона и нажима">
        <span>🔄</span> Перегенерировать нажим
      </button>

      <button id="btn-download-png" class="btn btn-secondary" title="Сохранить текущую страницу в высоком качестве (PNG)">
        <span>🖼️</span> Скачать PNG
      </button>

      <button id="btn-download-pdf" class="btn btn-secondary" title="Сохранить документ в файл PDF">
        <span>📄</span> Скачать PDF
      </button>

      <button id="btn-print" class="btn btn-primary" title="Открыть окно печати готового листа А4">
        <span>🖨️</span> Распечатать А4
      </button>
    </div>
  </header>

  <main class="workspace">
    <!-- SIDEBAR WITH CONTROLS -->
    <aside class="sidebar">
      <nav class="tab-nav">
        <button class="tab-btn active" data-tab="text">📝 Текст</button>
        <button class="tab-btn" data-tab="handwriting">✍️ Почерк</button>
        <button class="tab-btn" data-tab="paper">📄 Бумага</button>
        <button class="tab-btn" data-tab="realism">⚡ Реализм</button>
      </nav>

      <div class="tab-content-container">
        <!-- TAB 1: TEXT INPUT -->
        <div class="tab-panel active" id="tab-text">
          <div class="control-group">
            <div class="control-label">
              <span>Готовые шаблоны</span>
            </div>
            <select id="select-preset" class="select-custom">
              ${SAMPLE_TEXTS.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
              <option value="custom">✏️ Свой текст...</option>
            </select>
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Ваш текст для рукописи</span>
              <span id="text-counter" class="control-val">0 слов</span>
            </div>
            <textarea id="input-text" class="input-textarea" placeholder="Вставьте сюда любой текст...">${escapeHtml(state.text)}</textarea>
            
            <div class="cheat-badges">
              <span class="cheat-tag" data-tag="**жирный**" title="Сделать текст жирным">**жирный**</span>
              <span class="cheat-tag" data-tag="~помарка~" title="Сделать реалистичное зачеркивание-помарку">~помарка~</span>
              <span class="cheat-tag" data-tag="==маркер==" title="Выделить текст цветным текстовыделителем">==маркер==</span>
              <span class="cheat-tag" data-tag="\n---\n" title="Вставить принудительный разрыв страницы А4">--- разрыв</span>
            </div>
            <div class="control-help">Поддерживается выделение маркером <code>==текст==</code>, помарки <code>~слово~</code> и разрывы страниц <code>---</code>.</div>
          </div>

          <div class="control-group" style="display: flex; gap: 8px;">
            <button id="btn-clear-text" class="btn btn-secondary" style="flex: 1;">🗑️ Очистить</button>
            <button id="btn-insert-break" class="btn btn-secondary" style="flex: 1;">📄 Новый лист (---)</button>
          </div>
        </div>

        <!-- TAB 2: HANDWRITING SETTINGS -->
        <div class="tab-panel" id="tab-handwriting">
          <div class="control-group">
            <div class="control-label">
              <span>Шрифт почерка (с поддержкой кириллицы)</span>
            </div>
            <select id="select-font" class="select-custom">
              ${HANDWRITING_FONTS.map(f => `<option value="${f.id}" ${f.id === state.fontId ? 'selected' : ''}>${f.label}</option>`).join('')}
            </select>
            <div id="font-description" class="control-help"></div>
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Размер почерка</span>
              <span id="font-size-val" class="control-val">${state.fontSize} px</span>
            </div>
            <input type="range" id="range-font-size" class="range-slider" min="14" max="28" value="${state.fontSize}">
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Межстрочный интервал</span>
              <span id="line-height-val" class="control-val">${state.lineHeight}</span>
            </div>
            <input type="range" id="range-line-height" class="range-slider" min="1.2" max="2.3" step="0.05" value="${state.lineHeight}">
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Цвет чернил ручки</span>
              <span id="ink-name-val" class="control-val">Синяя</span>
            </div>
            <div class="color-grid">
              ${INK_PRESETS.map(ink => `
                <div class="color-swatch ${ink.color === state.inkColor ? 'active' : ''}" 
                     data-color="${ink.color}" 
                     data-name="${ink.name}"
                     style="background: ${ink.color};" 
                     title="${ink.name}">
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; color: var(--text-muted);">Свой цвет:</span>
              <input type="color" id="input-custom-ink" value="${state.inkColor}" style="border: none; background: transparent; cursor: pointer; height: 26px;">
            </div>
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Плотность нажима чернил</span>
              <span id="ink-opacity-val" class="control-val">${Math.round(state.inkOpacity * 100)}%</span>
            </div>
            <input type="range" id="range-ink-opacity" class="range-slider" min="0.75" max="1.0" step="0.01" value="${state.inkOpacity}">
          </div>
        </div>

        <!-- TAB 3: PAPER SETTINGS -->
        <div class="tab-panel" id="tab-paper">
          <div class="control-group">
            <div class="control-label">
              <span>Тип бумаги</span>
            </div>
            <div class="paper-tiles-grid">
              ${PAPER_PRESETS.map(paper => `
                <div class="paper-tile ${paper.id === state.paperId ? 'active' : ''}" data-paper="${paper.id}">
                  <div class="paper-preview-thumb ${paper.bgClass}"></div>
                  <div class="paper-tile-info">
                    <div class="paper-tile-title">${paper.name}</div>
                    <div class="paper-tile-sub">${paper.subtext}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="control-group">
            <div class="toggle-row" id="toggle-margin">
              <span>Красные поля (Тетрадная линия слева)</span>
              <div class="toggle-switch ${state.hasMargin ? 'active' : ''}">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>

          <div class="control-group" id="group-margin-pos" style="${state.hasMargin ? '' : 'display:none;'}">
            <div class="control-label">
              <span>Ширина полей</span>
              <span id="margin-pos-val" class="control-val">${state.marginPosMm} мм</span>
            </div>
            <input type="range" id="range-margin-pos" class="range-slider" min="20" max="45" value="${state.marginPosMm}">
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Красная строка (Отступ абзаца)</span>
              <span id="para-indent-val" class="control-val">${state.paraIndent} px</span>
            </div>
            <input type="range" id="range-para-indent" class="range-slider" min="0" max="60" value="${state.paraIndent}">
          </div>

          <div class="control-group">
            <div class="toggle-row" id="toggle-date">
              <span>Дата в правом верхнем углу</span>
              <div class="toggle-switch ${state.showDate ? 'active' : ''}">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <input type="text" id="input-date-text" class="input-text" style="margin-top: 8px; ${state.showDate ? '' : 'display:none;'}" value="${state.dateText}" placeholder="Например: 13 октября 2026 г.">
          </div>

          <div class="control-group">
            <div class="toggle-row" id="toggle-page-nums">
              <span>Нумерация страниц</span>
              <div class="toggle-switch ${state.showPageNumbers ? 'active' : ''}">
                <div class="toggle-thumb"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: REALISM SETTINGS -->
        <div class="tab-panel" id="tab-realism">
          <div class="control-group">
            <div class="control-label">
              <span>Случайный наклон и смещение букв (Jitter)</span>
              <span id="jitter-val" class="control-val">${Math.round(state.jitterIntensity * 100)}%</span>
            </div>
            <input type="range" id="range-jitter" class="range-slider" min="0" max="1" step="0.05" value="${state.jitterIntensity}">
            <div class="control-help">Имитирует естественные микро-повороты кисти руки при письме. Каждое слово получает уникальный угол и нажим.</div>
          </div>

          <div class="control-group">
            <div class="control-label">
              <span>Неровность строк (Дрожание руки)</span>
              <span id="wobble-val" class="control-val">${Math.round(state.baselineWobble * 100)}%</span>
            </div>
            <input type="range" id="range-wobble" class="range-slider" min="0" max="1" step="0.05" value="${state.baselineWobble}">
            <div class="control-help">Строки слегка отклоняются от идеально ровной линейки, как при реальном ведении ручки.</div>
          </div>

          <div class="control-group">
            <div class="toggle-row" id="toggle-mistakes">
              <span>Помарки и зачеркивания слов (~текст~)</span>
              <div class="toggle-switch ${state.enableMistakes ? 'active' : ''}">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <div class="control-help">Слова, обрамленные в <code>~тильды~</code>, будут реалистично зачеркнуты ручкой, как случайная ошибка студента.</div>
          </div>

          <div class="control-group" style="margin-top: 24px;">
            <button id="btn-reseed-tab" class="btn btn-secondary" style="width: 100%;">
              <span>🎲</span> Перегенерировать случайные вариации
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- PREVIEW & A4 SHEET CANVAS -->
    <section class="preview-container">
      <div class="preview-toolbar">
        <div class="zoom-controls">
          <span>Масштаб:</span>
          <button class="btn btn-ghost btn-icon" id="btn-zoom-out" title="Уменьшить">➖</button>
          <span id="zoom-val" style="min-width: 48px; text-align: center; font-weight: 500;">75%</span>
          <button class="btn btn-ghost btn-icon" id="btn-zoom-in" title="Увеличить">➕</button>
          <button class="btn btn-secondary" id="btn-zoom-fit" style="padding: 4px 10px; font-size: 12px;">По ширине</button>
          <button class="btn btn-secondary" id="btn-zoom-100" style="padding: 4px 10px; font-size: 12px;">100%</button>
        </div>

        <div class="preview-stats">
          <span id="page-count-badge">📄 Страниц: 1</span>
          <span>Формат: А4 (210 × 297 мм)</span>
        </div>
      </div>

      <div class="sheet-scroll-arena" id="sheet-scroll-arena">
        <div class="sheet-scaler" id="sheet-scaler" style="transform: scale(${state.zoomLevel});">
          <!-- A4 sheets will be injected here dynamically -->
        </div>
      </div>
    </section>
  </main>
`;

// Helper for HTML Escaping
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Update font description display
function updateFontDescription() {
  const fontMeta = HANDWRITING_FONTS.find(f => f.id === state.fontId);
  const descEl = document.querySelector('#font-description');
  if (descEl && fontMeta) {
    descEl.textContent = fontMeta.description;
  }
}

// Render dynamic A4 Pages
function renderPages() {
  const scaler = document.querySelector('#sheet-scaler');
  if (!scaler) return;

  const fontMeta = HANDWRITING_FONTS.find(f => f.id === state.fontId) || HANDWRITING_FONTS[0];
  const paperMeta = PAPER_PRESETS.find(p => p.id === state.paperId) || PAPER_PRESETS[0];

  // Paginate text
  const pagesText = paginateText(state.text, {
    fontSize: state.fontSize,
    lineHeight: state.lineHeight,
    paddingTop: 50,
    paddingBottom: 50,
    headerHeight: state.showDate ? 45 : 20,
    footerHeight: state.showPageNumbers ? 40 : 20
  });

  // Update page badge
  const pageBadge = document.querySelector('#page-count-badge');
  if (pageBadge) {
    pageBadge.textContent = `📄 Страниц: ${pagesText.length}`;
  }

  // Update word/char counter
  const textCounter = document.querySelector('#text-counter');
  if (textCounter) {
    const words = state.text.trim() ? state.text.trim().split(/\s+/).length : 0;
    const chars = state.text.length;
    textCounter.textContent = `${words} слов (${chars} симв.)`;
  }

  // Convert mm to px for margins (1mm ~ 3.7795px at 96 DPI)
  const marginPx = Math.round(state.marginPosMm * 3.78);

  let sheetsHtml = '';

  pagesText.forEach((pageContent, idx) => {
    const pageNum = idx + 1;
    // Each page gets a slightly derived seed so all pages feel organic
    const pageRng = new SeededRandom(state.seed + idx * 1013);
    const renderedHtml = formatHandwrittenContent(pageContent, {
      jitterIntensity: state.jitterIntensity,
      baselineWobble: state.baselineWobble,
      inkOpacity: state.inkOpacity,
      inkColor: state.inkColor,
      rng: pageRng,
      enableMistakes: state.enableMistakes,
      fontFamily: fontMeta.cssFamily
    });

    sheetsHtml += `
      <div class="a4-sheet ${paperMeta.bgClass}" id="page-${pageNum}" 
           style="font-family: ${fontMeta.cssFamily}; 
                  font-size: ${state.fontSize}px; 
                  line-height: ${state.lineHeight};
                  --ink-color: ${state.inkColor};
                  --margin-pos: ${marginPx}px;
                  --para-indent: ${state.paraIndent}px;
                  opacity: ${state.inkOpacity};">
        
        <!-- Red margin line -->
        ${state.hasMargin ? `<div class="margin-line" style="left: ${marginPx}px;"></div>` : ''}

        <!-- Page Header -->
        <div class="sheet-header">
          <div></div>
          ${state.showDate && state.dateText ? `<div class="sheet-date">${escapeHtml(state.dateText)}</div>` : ''}
        </div>

        <!-- Main Handwritten Content -->
        <div class="sheet-content ${state.hasMargin ? 'with-margin' : ''}" style="${state.hasMargin ? `padding-left: ${marginPx + 20}px;` : ''}">
          ${renderedHtml}
        </div>

        <!-- Page Footer -->
        <div class="sheet-footer">
          ${state.showPageNumbers ? `<div class="sheet-page-num">${pageNum}</div>` : ''}
        </div>

        <!-- UI Screen badge -->
        <div class="page-badge-pill">Стр. ${pageNum} из ${pagesText.length}</div>
      </div>
    `;
  });

  scaler.innerHTML = sheetsHtml;
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Tabs Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      const targetPanel = document.getElementById(`tab-${tabId}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Textarea input
  const textInput = document.querySelector('#input-text');
  if (textInput) {
    textInput.addEventListener('input', (e) => {
      state.text = e.target.value;
      renderPages();
    });
  }

  // Preset Selector
  const presetSelect = document.querySelector('#select-preset');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId === 'custom') return;
      const sample = SAMPLE_TEXTS.find(s => s.id === selectedId);
      if (sample) {
        state.text = sample.text;
        state.fontId = sample.font;
        state.paperId = sample.paper;
        state.fontSize = sample.fontSize;
        state.hasMargin = sample.hasMargin;

        const ink = INK_PRESETS.find(i => i.id === sample.ink);
        if (ink) state.inkColor = ink.color;

        // Synchronize UI inputs
        if (textInput) textInput.value = sample.text;
        syncControlsWithState();
        renderPages();
      }
    });
  }

  // Clear text
  document.querySelector('#btn-clear-text')?.addEventListener('click', () => {
    state.text = '';
    if (textInput) {
      textInput.value = '';
      textInput.focus();
    }
    renderPages();
  });

  // Insert page break
  document.querySelector('#btn-insert-break')?.addEventListener('click', () => {
    insertAtCursor(textInput, '\n---\n');
  });

  // Cheat tag insertion
  document.querySelectorAll('.cheat-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      insertAtCursor(textInput, tag.dataset.tag);
    });
  });

  // Font Selection
  const fontSelect = document.querySelector('#select-font');
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      state.fontId = e.target.value;
      const fontMeta = HANDWRITING_FONTS.find(f => f.id === state.fontId);
      if (fontMeta) {
        state.fontSize = fontMeta.defaultSize;
        state.lineHeight = fontMeta.defaultLineHeight;
        document.querySelector('#range-font-size').value = state.fontSize;
        document.querySelector('#font-size-val').textContent = `${state.fontSize} px`;
        document.querySelector('#range-line-height').value = state.lineHeight;
        document.querySelector('#line-height-val').textContent = state.lineHeight;
      }
      updateFontDescription();
      renderPages();
    });
  }

  // Font Size Slider
  document.querySelector('#range-font-size')?.addEventListener('input', (e) => {
    state.fontSize = parseInt(e.target.value, 10);
    document.querySelector('#font-size-val').textContent = `${state.fontSize} px`;
    renderPages();
  });

  // Line Height Slider
  document.querySelector('#range-line-height')?.addEventListener('input', (e) => {
    state.lineHeight = parseFloat(e.target.value);
    document.querySelector('#line-height-val').textContent = state.lineHeight;
    renderPages();
  });

  // Ink Color Swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      state.inkColor = swatch.dataset.color;
      document.querySelector('#ink-name-val').textContent = swatch.dataset.name;
      document.querySelector('#input-custom-ink').value = state.inkColor;
      renderPages();
    });
  });

  // Custom Ink Input
  document.querySelector('#input-custom-ink')?.addEventListener('input', (e) => {
    state.inkColor = e.target.value;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    document.querySelector('#ink-name-val').textContent = 'Свой цвет';
    renderPages();
  });

  // Ink Opacity Slider
  document.querySelector('#range-ink-opacity')?.addEventListener('input', (e) => {
    state.inkOpacity = parseFloat(e.target.value);
    document.querySelector('#ink-opacity-val').textContent = `${Math.round(state.inkOpacity * 100)}%`;
    renderPages();
  });

  // Paper Tiles
  document.querySelectorAll('.paper-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      document.querySelectorAll('.paper-tile').forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      state.paperId = tile.dataset.paper;
      renderPages();
    });
  });

  // Margin Toggle
  document.querySelector('#toggle-margin')?.addEventListener('click', () => {
    state.hasMargin = !state.hasMargin;
    document.querySelector('#toggle-margin .toggle-switch').classList.toggle('active', state.hasMargin);
    document.querySelector('#group-margin-pos').style.display = state.hasMargin ? 'block' : 'none';
    renderPages();
  });

  // Margin Position Slider
  document.querySelector('#range-margin-pos')?.addEventListener('input', (e) => {
    state.marginPosMm = parseInt(e.target.value, 10);
    document.querySelector('#margin-pos-val').textContent = `${state.marginPosMm} мм`;
    renderPages();
  });

  // Paragraph Indent Slider
  document.querySelector('#range-para-indent')?.addEventListener('input', (e) => {
    state.paraIndent = parseInt(e.target.value, 10);
    document.querySelector('#para-indent-val').textContent = `${state.paraIndent} px`;
    renderPages();
  });

  // Date Toggle & Input
  document.querySelector('#toggle-date')?.addEventListener('click', () => {
    state.showDate = !state.showDate;
    document.querySelector('#toggle-date .toggle-switch').classList.toggle('active', state.showDate);
    document.querySelector('#input-date-text').style.display = state.showDate ? 'block' : 'none';
    renderPages();
  });

  document.querySelector('#input-date-text')?.addEventListener('input', (e) => {
    state.dateText = e.target.value;
    renderPages();
  });

  // Page Numbers Toggle
  document.querySelector('#toggle-page-nums')?.addEventListener('click', () => {
    state.showPageNumbers = !state.showPageNumbers;
    document.querySelector('#toggle-page-nums .toggle-switch').classList.toggle('active', state.showPageNumbers);
    renderPages();
  });

  // Jitter Slider
  document.querySelector('#range-jitter')?.addEventListener('input', (e) => {
    state.jitterIntensity = parseFloat(e.target.value);
    document.querySelector('#jitter-val').textContent = `${Math.round(state.jitterIntensity * 100)}%`;
    renderPages();
  });

  // Baseline Wobble Slider
  document.querySelector('#range-wobble')?.addEventListener('input', (e) => {
    state.baselineWobble = parseFloat(e.target.value);
    document.querySelector('#wobble-val').textContent = `${Math.round(state.baselineWobble * 100)}%`;
    renderPages();
  });

  // Mistakes Toggle
  document.querySelector('#toggle-mistakes')?.addEventListener('click', () => {
    state.enableMistakes = !state.enableMistakes;
    document.querySelector('#toggle-mistakes .toggle-switch').classList.toggle('active', state.enableMistakes);
    renderPages();
  });

  // Re-seed Randomness
  const reseedFn = () => {
    state.seed = Math.floor(Math.random() * 1000000);
    renderPages();
  };
  document.querySelector('#btn-reseed')?.addEventListener('click', reseedFn);
  document.querySelector('#btn-reseed-tab')?.addEventListener('click', reseedFn);

  // Zoom Handlers
  const scaler = document.querySelector('#sheet-scaler');
  const zoomVal = document.querySelector('#zoom-val');

  const setZoom = (zoom) => {
    state.zoomLevel = Math.max(0.35, Math.min(1.5, zoom));
    scaler.style.transform = `scale(${state.zoomLevel})`;
    zoomVal.textContent = `${Math.round(state.zoomLevel * 100)}%`;
  };

  document.querySelector('#btn-zoom-in')?.addEventListener('click', () => setZoom(state.zoomLevel + 0.1));
  document.querySelector('#btn-zoom-out')?.addEventListener('click', () => setZoom(state.zoomLevel - 0.1));
  document.querySelector('#btn-zoom-100')?.addEventListener('click', () => setZoom(1.0));
  document.querySelector('#btn-zoom-fit')?.addEventListener('click', () => {
    const arena = document.querySelector('#sheet-scroll-arena');
    if (arena) {
      const availWidth = arena.clientWidth - 60;
      const fitZoom = Math.min(1.0, availWidth / A4_WIDTH_PX);
      setZoom(fitZoom);
    }
  });

  // PRINT ACTION
  document.querySelector('#btn-print')?.addEventListener('click', () => {
    window.print();
  });

  // DOWNLOAD PNG ACTION
  document.querySelector('#btn-download-png')?.addEventListener('click', async () => {
    const firstPage = document.querySelector('.a4-sheet');
    if (!firstPage) return;

    const btn = document.querySelector('#btn-download-png');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Экспорт...';
    btn.disabled = true;

    try {
      // Hide screen badges temporarily
      document.querySelectorAll('.page-badge-pill').forEach(b => b.style.display = 'none');

      const canvas = await html2canvas(firstPage, {
        scale: 2, // 2x high resolution
        useCORS: true,
        backgroundColor: null
      });

      document.querySelectorAll('.page-badge-pill').forEach(b => b.style.display = '');

      const link = document.createElement('a');
      link.download = `rukopis-a4-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
      alert('Ошибка при экспорте изображения: ' + err.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  // DOWNLOAD PDF ACTION
  document.querySelector('#btn-download-pdf')?.addEventListener('click', async () => {
    const pages = document.querySelectorAll('.a4-sheet');
    if (pages.length === 0) return;

    const btn = document.querySelector('#btn-download-pdf');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Генерация PDF...';
    btn.disabled = true;

    try {
      document.querySelectorAll('.page-badge-pill').forEach(b => b.style.display = 'none');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        if (i > 0) pdf.addPage('a4', 'portrait');

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      document.querySelectorAll('.page-badge-pill').forEach(b => b.style.display = '');
      pdf.save(`rukopis-a4-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Ошибка при экспорте PDF: ' + err.message);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

// Helper to insert markdown tokens at cursor in textarea
function insertAtCursor(textarea, textToInsert) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + textToInsert + text.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
  textarea.focus();

  state.text = textarea.value;
  renderPages();
}

// Synchronize all UI controls with state
function syncControlsWithState() {
  const fontSelect = document.querySelector('#select-font');
  if (fontSelect) fontSelect.value = state.fontId;
  
  const fontSizeRange = document.querySelector('#range-font-size');
  if (fontSizeRange) fontSizeRange.value = state.fontSize;
  document.querySelector('#font-size-val').textContent = `${state.fontSize} px`;

  const paperTiles = document.querySelectorAll('.paper-tile');
  paperTiles.forEach(t => t.classList.toggle('active', t.dataset.paper === state.paperId));

  const marginSwitch = document.querySelector('#toggle-margin .toggle-switch');
  if (marginSwitch) marginSwitch.classList.toggle('active', state.hasMargin);
  document.querySelector('#group-margin-pos').style.display = state.hasMargin ? 'block' : 'none';

  const swatches = document.querySelectorAll('.color-swatch');
  swatches.forEach(s => s.classList.toggle('active', s.dataset.color === state.inkColor));

  updateFontDescription();
}

// Initialize application
function init() {
  setupEventListeners();
  updateFontDescription();
  renderPages();
}

init();

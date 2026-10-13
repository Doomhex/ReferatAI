// Handwriting fonts metadata with Cyrillic support
export const HANDWRITING_FONTS = [
  {
    id: 'Bad Script',
    name: 'Bad Script',
    label: 'Школьный конспект (Bad Script)',
    category: 'Студенческий / Реалистичный',
    cssFamily: "'Bad Script', cursive",
    defaultSize: 18,
    defaultLineHeight: 1.65,
    tilt: 0,
    description: 'Идеален для конспектов лекций и тетрадей, выглядит как живой почерк студента.'
  },
  {
    id: 'Caveat',
    name: 'Caveat',
    label: 'Быстрый почерк (Caveat)',
    category: 'Свободный / Быстрый',
    cssFamily: "'Caveat', cursive",
    defaultSize: 22,
    defaultLineHeight: 1.45,
    tilt: -2,
    description: 'Разборчивый, беглый современный почерк с естественными росчерками.'
  },
  {
    id: 'Marck Script',
    name: 'Marck Script',
    label: 'Аккуратная каллиграфия (Marck Script)',
    category: 'Каллиграфический / Аккуратный',
    cssFamily: "'Marck Script', cursive",
    defaultSize: 19,
    defaultLineHeight: 1.6,
    tilt: 1,
    description: 'Элегантный связный курсив, аккуратный почерк отличника.'
  },
  {
    id: 'Neucha',
    name: 'Neucha',
    label: 'Четкий почерк (Neucha)',
    category: 'Разборчивый / Печатный',
    cssFamily: "'Neucha', cursive",
    defaultSize: 19,
    defaultLineHeight: 1.5,
    tilt: 0,
    description: 'Более прямой, легкий для чтения почерк с округлыми формами.'
  },
  {
    id: 'Pangolin',
    name: 'Pangolin',
    label: 'Округлый почерк (Pangolin)',
    category: 'Округлый / Мягкий',
    cssFamily: "'Pangolin', cursive",
    defaultSize: 18,
    defaultLineHeight: 1.55,
    tilt: 0,
    description: 'Спокойный округлый рукописный шрифт, отлично подходит для заметок.'
  },
  {
    id: 'Shantell Sans',
    name: 'Shantell Sans',
    label: 'Рукописный печатный (Shantell Sans)',
    category: 'Печатный от руки',
    cssFamily: "'Shantell Sans', cursive",
    defaultSize: 17,
    defaultLineHeight: 1.6,
    tilt: 0,
    description: 'Четкие раздельные буквы от руки, как в чертежах и технических конспектах.'
  }
];

export const INK_PRESETS = [
  { id: 'blue-ballpoint', name: 'Синяя шариковая', color: '#1a3c8e', opacity: 0.94, shadow: 'rgba(26, 60, 142, 0.25)' },
  { id: 'dark-blue', name: 'Темно-синяя (паста)', color: '#11255e', opacity: 0.95, shadow: 'rgba(17, 37, 94, 0.2)' },
  { id: 'black-gel', name: 'Черная гелевая', color: '#1c1c1f', opacity: 0.96, shadow: 'rgba(28, 28, 31, 0.2)' },
  { id: 'purple-fountain', name: 'Фиолетовые чернила', color: '#2d1e63', opacity: 0.93, shadow: 'rgba(45, 30, 99, 0.25)' },
  { id: 'pencil', name: 'Простой карандаш', color: '#4a4b52', opacity: 0.88, shadow: 'rgba(74, 75, 82, 0.15)' },
  { id: 'red-pen', name: 'Красная ручка', color: '#a61b1b', opacity: 0.93, shadow: 'rgba(166, 27, 27, 0.25)' },
  { id: 'green-pen', name: 'Зеленая ручка', color: '#1a6e38', opacity: 0.92, shadow: 'rgba(26, 110, 56, 0.25)' }
];

export const PAPER_PRESETS = [
  {
    id: 'grid',
    name: 'Тетрадь в клетку (5 мм)',
    subtext: 'Классическая школьная/студенческая клетка',
    bgClass: 'paper-grid',
    gridSize: 19, // ~5mm in standard 96dpi
    lineSnap: true
  },
  {
    id: 'ruled',
    name: 'Тетрадь в линейку (8 мм)',
    subtext: 'Линии с полями для аккуратного конспекта',
    bgClass: 'paper-ruled',
    gridSize: 30, // ~8mm in standard 96dpi
    lineSnap: true
  },
  {
    id: 'blank',
    name: 'Чистый белый лист А4',
    subtext: 'Стандартный офисный лист для заявлений и документов',
    bgClass: 'paper-blank',
    gridSize: 0,
    lineSnap: false
  },
  {
    id: 'crumpled',
    name: 'Помятый лист с текстурой',
    subtext: 'Максимальный реализм с волокнами и легкими складками',
    bgClass: 'paper-crumpled',
    gridSize: 0,
    lineSnap: false
  },
  {
    id: 'vintage',
    name: 'Винтаж / Крафт бумага',
    subtext: 'Теплый оттенок крафтовой состаренной бумаги',
    bgClass: 'paper-vintage',
    gridSize: 0,
    lineSnap: false
  }
];

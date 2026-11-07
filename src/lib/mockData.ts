// 30 ПИТАНЬ З ІСТОРІЇ УКРАЇНИ
export const mockQuestions = [
  { id: 1, subject: 'Історія', text: 'У якому році відбулося Хрещення Русі?', options: [{ text: '988', isCorrect: true }, { text: '882', isCorrect: false }, { text: '1054', isCorrect: false }, { text: '1240', isCorrect: false }] },
  { id: 2, subject: 'Історія', text: 'Хто був першим президентом незалежної України?', options: [{ text: 'Леонід Кравчук', isCorrect: true }, { text: 'Леонід Кучма', isCorrect: false }, { text: 'Віктор Ющенко', isCorrect: false }, { text: 'Михайло Грушевський', isCorrect: false }] },
  { id: 3, subject: 'Історія', text: 'У якому році відбулася Полтавська битва?', options: [{ text: '1709', isCorrect: true }, { text: '1648', isCorrect: false }, { text: '1654', isCorrect: false }, { text: '1775', isCorrect: false }] },
  { id: 4, subject: 'Історія', text: 'Хто очолив Національно-визвольну війну 1648-1657 рр.?', options: [{ text: 'Богдан Хмельницький', isCorrect: true }, { text: 'Іван Мазепа', isCorrect: false }, { text: 'Петро Дорошенко', isCorrect: false }, { text: 'Іван Виговський', isCorrect: false }] },
  { id: 5, subject: 'Історія', text: 'Коли було проголошено незалежність України?', options: [{ text: '24 серпня 1991', isCorrect: true }, { text: '16 липня 1990', isCorrect: false }, { text: '1 грудня 1991', isCorrect: false }, { text: '28 червня 1996', isCorrect: false }] },
  { id: 6, subject: 'Історія', text: 'Яка подія відбулася у 1986 році?', options: [{ text: 'Аварія на ЧАЕС', isCorrect: true }, { text: 'Помаранчева революція', isCorrect: false }, { text: 'Революція Гідності', isCorrect: false }, { text: 'Проголошення незалежності', isCorrect: false }] },
  { id: 7, subject: 'Історія', text: 'Хто був коронований як Король Русі?', options: [{ text: 'Данило Романович', isCorrect: true }, { text: 'Ярослав Мудрий', isCorrect: false }, { text: 'Володимир Великий', isCorrect: false }, { text: 'Роман Мстиславич', isCorrect: false }] },
  { id: 8, subject: 'Історія', text: 'У якому році була підписана Люблінська унія?', options: [{ text: '1569', isCorrect: true }, { text: '1385', isCorrect: false }, { text: '1596', isCorrect: false }, { text: '1648', isCorrect: false }] },
  { id: 9, subject: 'Історія', text: 'Коли було ліквідовано Запорізьку Січ?', options: [{ text: '1775', isCorrect: true }, { text: '1709', isCorrect: false }, { text: '1648', isCorrect: false }, { text: '1917', isCorrect: false }] },
  { id: 10, subject: 'Історія', text: 'У якому році скасували кріпацтво в Російській імперії?', options: [{ text: '1861', isCorrect: true }, { text: '1848', isCorrect: false }, { text: '1905', isCorrect: false }, { text: '1917', isCorrect: false }] },
  { id: 11, subject: 'Історія', text: 'Хто очолював Українську Центральну Раду?', options: [{ text: 'Михайло Грушевський', isCorrect: true }, { text: 'Симон Петлюра', isCorrect: false }, { text: 'Павло Скоропадський', isCorrect: false }, { text: 'Володимир Винниченко', isCorrect: false }] },
  { id: 12, subject: 'Історія', text: 'Яким Універсалом було проголошено незалежність УНР?', options: [{ text: 'IV Універсалом', isCorrect: true }, { text: 'I Універсалом', isCorrect: false }, { text: 'III Універсалом', isCorrect: false }, { text: 'II Універсалом', isCorrect: false }] },
  { id: 13, subject: 'Історія', text: 'У які роки відбувся Голодомор в Україні?', options: [{ text: '1932-1933', isCorrect: true }, { text: '1921-1922', isCorrect: false }, { text: '1946-1947', isCorrect: false }, { text: '1917-1920', isCorrect: false }] },
  { id: 14, subject: 'Історія', text: 'У якому році було ухвалено Декларацію про державний суверенітет України?', options: [{ text: '1990', isCorrect: true }, { text: '1991', isCorrect: false }, { text: '1989', isCorrect: false }, { text: '1996', isCorrect: false }] },
  { id: 15, subject: 'Історія', text: 'Хто був гетьманом після Богдана Хмельницького?', options: [{ text: 'Іван Виговський', isCorrect: true }, { text: 'Юрій Хмельницький', isCorrect: false }, { text: 'Іван Мазепа', isCorrect: false }, { text: 'Петро Дорошенко', isCorrect: false }] },
  { id: 16, subject: 'Історія', text: 'У якому році відбулася битва на Калці?', options: [{ text: '1223', isCorrect: true }, { text: '1240', isCorrect: false }, { text: '1187', isCorrect: false }, { text: '1362', isCorrect: false }] },
  { id: 17, subject: 'Історія', text: 'Хто заснував Київ за легендою?', options: [{ text: 'Кий', isCorrect: true }, { text: 'Олег', isCorrect: false }, { text: 'Аскольд', isCorrect: false }, { text: 'Дир', isCorrect: false }] },
  { id: 18, subject: 'Історія', text: 'У якому році відбулася Помаранчева революція?', options: [{ text: '2004', isCorrect: true }, { text: '2005', isCorrect: false }, { text: '2014', isCorrect: false }, { text: '1991', isCorrect: false }] },
  { id: 19, subject: 'Історія', text: 'У якому році відбулася Революція Гідності?', options: [{ text: '2014', isCorrect: true }, { text: '2013', isCorrect: false }, { text: '2004', isCorrect: false }, { text: '2019', isCorrect: false }] },
  { id: 20, subject: 'Історія', text: 'Хто був князем під час Хрещення Русі?', options: [{ text: 'Володимир Великий', isCorrect: true }, { text: 'Ярослав Мудрий', isCorrect: false }, { text: 'Святослав Хоробрий', isCorrect: false }, { text: 'Олег Віщий', isCorrect: false }] },
  
  { id: 21, subject: 'Історія', text: 'Встановіть відповідність між гетьманом та роком його обрання: (1. Б. Хмельницький, 2. І. Виговський, 3. П. Дорошенко, 4. І. Мазепа)', options: [{ text: '1 - 1648, 2 - 1657, 3 - 1665, 4 - 1687', isCorrect: true }, { text: '1 - 1657, 2 - 1648, 3 - 1687, 4 - 1665', isCorrect: false }, { text: '1 - 1648, 2 - 1665, 3 - 1657, 4 - 1687', isCorrect: false }] },
  { id: 22, subject: 'Історія', text: 'Встановіть відповідність між князем та містом: (1. Олег, 2. Святослав, 3. Володимир, 4. Ярослав)', options: [{ text: '1 - Київ, 2 - Переяславець, 3 - Корсунь, 4 - Новгород', isCorrect: true }, { text: '1 - Новгород, 2 - Київ, 3 - Переяславець, 4 - Корсунь', isCorrect: false }, { text: '1 - Корсунь, 2 - Новгород, 3 - Київ, 4 - Переяславець', isCorrect: false }] },
  { id: 23, subject: 'Історія', text: 'Встановіть відповідність між подією та роком: (1. Берестецька битва, 2. Переяславська рада, 3. Конотопська битва, 4. Батуринська різанина)', options: [{ text: '1 - 1651, 2 - 1654, 3 - 1659, 4 - 1708', isCorrect: true }, { text: '1 - 1654, 2 - 1651, 3 - 1708, 4 - 1659', isCorrect: false }, { text: '1 - 1659, 2 - 1708, 3 - 1651, 4 - 1654', isCorrect: false }] },
  { id: 24, subject: 'Історія', text: 'Встановіть відповідність між державою та столицею: (1. УНР, 2. ЗУНР, 3. Гетьманщина, 4. Кримське ханство)', options: [{ text: '1 - Київ, 2 - Львів, 3 - Чигирин, 4 - Бахчисарай', isCorrect: true }, { text: '1 - Львів, 2 - Київ, 3 - Бахчисарай, 4 - Чигирин', isCorrect: false }, { text: '1 - Чигирин, 2 - Бахчисарай, 3 - Київ, 4 - Львів', isCorrect: false }] },
  
  { id: 25, subject: 'Історія', text: 'Установіть хронологічну послідовність правління князів:', options: [{ text: 'Олег - Ігор - Ольга - Святослав', isCorrect: true }, { text: 'Ігор - Олег - Святослав - Ольга', isCorrect: false }, { text: 'Ольга - Олег - Ігор - Святослав', isCorrect: false }] },
  { id: 26, subject: 'Історія', text: 'Установіть хронологічну послідовність битв:', options: [{ text: 'Калка - Сині Води - Берестечко - Полтава', isCorrect: true }, { text: 'Берестечко - Полтава - Калка - Сині Води', isCorrect: false }, { text: 'Сині Води - Калка - Полтава - Берестечко', isCorrect: false }] },
  { id: 27, subject: 'Історія', text: 'Установіть хронологічну послідовність президентів України:', options: [{ text: 'Кравчук - Кучма - Ющенко - Янукович', isCorrect: true }, { text: 'Кучма - Кравчук - Янукович - Ющенко', isCorrect: false }, { text: 'Ющенко - Кравчук - Кучма - Янукович', isCorrect: false }] },
  { id: 28, subject: 'Історія', text: 'Установіть хронологічну послідовність Універсалів УЦР:', options: [{ text: 'I - II - III - IV', isCorrect: true }, { text: 'II - I - IV - III', isCorrect: false }, { text: 'IV - III - II - I', isCorrect: false }] },
  
  { id: 29, subject: 'Історія', text: 'Які з цих міст входили до складу Галицько-Волинського князівства?', options: [{ text: 'Галич', isCorrect: true }, { text: 'Володимир', isCorrect: true }, { text: 'Холм', isCorrect: true }, { text: 'Київ', isCorrect: false }, { text: 'Полтава', isCorrect: false }, { text: 'Харків', isCorrect: false }, { text: 'Одеса', isCorrect: false }] },
  { id: 30, subject: 'Історія', text: 'Які битви відбулися за часів Богдана Хмельницького?', options: [{ text: 'Жовтоводська', isCorrect: true }, { text: 'Корсунська', isCorrect: true }, { text: 'Пилявецька', isCorrect: true }, { text: 'Полтавська', isCorrect: false }, { text: 'Батізька', isCorrect: false }, { text: 'Конотопська', isCorrect: false }, { text: 'Цецорська', isCorrect: false }] }
];

export const mockSession = {
  id: 'HIST-30',
  title: 'Пробний тест НМТ: Історія України (30 питань)',
  tag: 'Пробний',
  studentsCount: 7,
  date: 'Сьогодні',
  status: 'Активна',
  questions: mockQuestions,
  durationMinutes: 60,
  mode: 'active',
  isLive: true,
  showResults: true,
  showErrors: true,
  showCorrectAnswers: true
};

export const mockStudentsData = [
  { id: 1, name: 'Аня Романюк', scorePercent: 83, answers: Array.from({ length: 30 }, () => Math.random() > 0.2) },
  { id: 2, name: 'Арсен Клімарчук', scorePercent: 43, answers: Array.from({ length: 30 }, () => Math.random() > 0.6) },
  { id: 3, name: 'Величко Михайло', scorePercent: 17, answers: Array.from({ length: 30 }, () => Math.random() > 0.8) },
  { id: 4, name: 'Іван Лагода', scorePercent: 37, answers: Array.from({ length: 30 }, () => Math.random() > 0.7) },
  { id: 5, name: 'Ілля Довжик', scorePercent: 50, answers: Array.from({ length: 30 }, () => Math.random() > 0.5) },
  { id: 6, name: 'Кузьмич Максим', scorePercent: 83, answers: Array.from({ length: 30 }, () => Math.random() > 0.1) },
  { id: 7, name: 'Лагоди Денис', scorePercent: 77, answers: Array.from({ length: 30 }, () => Math.random() > 0.3) }
];
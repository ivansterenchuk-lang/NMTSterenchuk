import type { PublicTest } from './search';

export const COMMUNITY_TESTS: PublicTest[] = [
  {
    id: 'c1',
    title: 'Українська революція 1917–1921 рр.',
    author: 'Олена Коваленко',
    subject: 'history',
    tags: ['НМТ', 'УНР', 'Універсали'],
    updated: '28 жовт. 2026 р.',
    questions: [
      {
        id: 9101,
        subject: 'history',
        kind: 'single',
        title: 'Який універсал Центральної Ради проголосив незалежність УНР?',
        options: ['І Універсал', 'ІІ Універсал', 'ІІІ Універсал', 'IV Універсал'],
        correct: 3
      },
      {
        id: 9102,
        subject: 'history',
        kind: 'single',
        title: 'Хто був головою Директорії УНР, створеної у листопаді 1918 р.?',
        options: ['Павло Скоропадський', 'Володимир Винниченко', 'Євген Петрушевич', 'Михайло Грушевський'],
        correct: 1
      },
      {
        id: 9103,
        subject: 'history',
        kind: 'sequence',
        title: 'Установіть правильну послідовність подій Української революції.',
        items: [
          'Проголошення І Універсалу Центральної Ради',
          'Проголошення ІІІ Універсалу та створення УНР',
          'Проголошення IV Універсалу',
          'Гетьманський переворот Павла Скоропадського'
        ],
        displayOrder: [2, 0, 3, 1]
      },
      {
        id: 9104,
        subject: 'history',
        kind: 'matching',
        title: 'Установіть відповідність між подією та її датою.',
        rows: ['Битва під Крутами', 'Акт Злуки УНР і ЗУНР', 'Варшавський договір', 'Перший Зимовий похід армії УНР'],
        cols: [
          '29 січня 1918 р.',
          '22 січня 1919 р.',
          '21–24 квітня 1920 р.',
          '6 грудня 1919 – 6 травня 1920 рр.',
          '1 листопада 1918 р.'
        ],
        correct: [0, 1, 2, 3]
      }
    ]
  },
  {
    id: 'c2',
    title: 'Козацька доба: Національно-визвольна війна XVII ст.',
    author: 'Марія Шевчук',
    subject: 'history',
    tags: ['НМТ', 'Козаччина', 'Хмельниччина'],
    updated: '25 жовт. 2026 р.',
    questions: [
      {
        id: 9201,
        subject: 'history',
        kind: 'single',
        title: 'Яка битва 1648 р. стала першою великою перемогою війська Богдана Хмельницького?',
        options: ['Жовті Води', 'Берестечко', 'Зборів', 'Батіг'],
        correct: 0
      },
      {
        id: 9202,
        subject: 'history',
        kind: 'single',
        title: 'У якому році було укладено Зборівський договір?',
        options: ['1648', '1649', '1651', '1654'],
        correct: 1
      },
      {
        id: 9203,
        subject: 'history',
        kind: 'multi',
        title: 'Оберіть події, що відбулися за гетьманування Івана Мазепи.',
        options: [
          'Укладення Коломацьких статей',
          'Переяславська рада',
          'Розгром Батурина російськими військами',
          'Укладення Конституції Пилипа Орлика',
          'Полтавська битва',
          'Підписання Андрусівського перемир\u2019я'
        ],
        correct: [0, 2, 4]
      }
    ]
  },
  {
    id: 'c3',
    title: 'Математика: числа, степені та рівняння',
    author: 'Андрій Бондаренко',
    subject: 'math',
    tags: ['НМТ', 'Рівняння', 'Логарифми'],
    updated: '30 жовт. 2026 р.',
    questions: [
      {
        id: 9301,
        subject: 'math',
        kind: 'single',
        title: 'Розв\u2019яжіть рівняння 2x − 7 = 11.',
        options: ['2', '9', '4', '18', '−9'],
        correct: 1
      },
      {
        id: 9302,
        subject: 'math',
        kind: 'single',
        title: 'Чому дорівнює значення виразу 3² + 4²?',
        options: ['7', '12', '25', '49', '5'],
        correct: 2
      },
      {
        id: 9303,
        subject: 'math',
        kind: 'matching',
        title: 'Установіть відповідність між виразом і його значенням.',
        rows: ['log₂ 8', '√49', '2⁵'],
        cols: ['3', '7', '32', '16', '5'],
        correct: [0, 1, 2]
      },
      {
        id: 9304,
        subject: 'math',
        kind: 'open',
        title: 'Знайдіть корінь рівняння 5x + 3 = 28.',
        answers: ['5'],
        points: 2
      }
    ]
  },
  {
    id: 'c4',
    title: 'Українська мова: частини мови',
    author: 'Ірина Мельник',
    subject: 'ukrainian',
    tags: ['НМТ', 'Морфологія'],
    updated: '20 жовт. 2026 р.',
    questions: [
      {
        id: 9401,
        subject: 'ukrainian',
        kind: 'single',
        title: 'Визначте рядок, у якому всі слова є прикметниками.',
        options: [
          'добрий, високий, синій',
          'добро, високо, синьо',
          'добрість, висота, синява',
          'добрішати, синіти, височіти'
        ],
        correct: 0
      },
      {
        id: 9402,
        subject: 'ukrainian',
        kind: 'matching',
        title: 'Установіть відповідність між словом і частиною мови.',
        rows: ['швидко', 'швидкий', 'швидкість', 'швидшати'],
        cols: ['іменник', 'прикметник', 'дієслово', 'прислівник', 'займенник'],
        correct: [3, 1, 0, 2]
      }
    ]
  },
  {
    id: 'c5',
    title: 'English: grammar and reading basics',
    author: 'Софія Лисенко',
    subject: 'english',
    tags: ['НМТ', 'Grammar', 'Reading'],
    updated: '18 жовт. 2026 р.',
    questions: [
      {
        id: 9501,
        subject: 'english',
        kind: 'single',
        title: 'How does Tom get to school?',
        passage: 'Tom gets up at 7 a.m. every day. He has breakfast, then goes to school by bus.',
        options: ['By car', 'By bus', 'On foot', 'By bike'],
        correct: 1
      },
      {
        id: 9502,
        subject: 'english',
        kind: 'single',
        title: 'Choose the correct form: She ___ to the cinema yesterday.',
        options: ['go', 'goes', 'went', 'has gone'],
        correct: 2
      }
    ]
  }
];
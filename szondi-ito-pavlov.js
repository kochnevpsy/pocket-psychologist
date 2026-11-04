/*
 * szondi-ito-pavlov.js
 * ---------------------------------------------------------------------------
 * Пересчёт 16 шкал теста Сонди (два плана) в положение точки на круге ИТО
 * и в краткое описание типа ВНД по Павлову.
 *
 * Версия: 1.0.0
 * Лицензия: использовать в проекте «Тест Сонди» по решению автора проекта.
 *
 * Модуль не зависит от DOM и работает и в браузере (window.SzondiITOPavlov),
 * и в Node.js (module.exports).
 *
 * ВАЖНО: это экспертный алгоритм, а не валидированный психодиагностический
 * инструмент. Подробные ограничения — в методичке.
 * ---------------------------------------------------------------------------
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SzondiITOPavlov = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  var POLES = [
    'h+', 'h-', 's+', 's-',
    'e+', 'e-', 'hy+', 'hy-',
    'k+', 'k-', 'p+', 'p-',
    'd+', 'd-', 'm+', 'm-'
  ];

  var FACTORS = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];

  var FACTOR_ORDER = { h: 0, s: 1, e: 2, hy: 3, k: 4, p: 5, d: 6, m: 7 };

  var FACTOR_META = {
    h: {
      code: 'h',
      label: 'теплота и дистанция',
      plus: 'теплота и близость',
      minus: 'сдержанность и личное пространство'
    },
    s: {
      code: 's',
      label: 'активность и уступчивость',
      plus: 'активность и напор',
      minus: 'мягкость и готовность уступать'
    },
    e: {
      code: 'e',
      label: 'тревожность и стеничность',
      plus: 'тревожность и внутренний контроль',
      minus: 'стеничность и прямое отстаивание'
    },
    hy: {
      code: 'hy',
      label: 'выразительность и скромность',
      plus: 'выразительность и потребность быть замеченным',
      minus: 'скромность и закрытость'
    },
    k: {
      code: 'k',
      label: 'порядок и гибкость',
      plus: 'порядок и самоконтроль',
      minus: 'гибкость и открытость опыту'
    },
    p: {
      code: 'p',
      label: 'масштаб и реализм',
      plus: 'масштаб идей и интуиция',
      minus: 'реализм и проверка'
    },
    d: {
      code: 'd',
      label: 'новое и устойчивость',
      plus: 'интерес к новому и мобильность',
      minus: 'устойчивость и привязанность'
    },
    m: {
      code: 'm',
      label: 'открытость и автономия',
      plus: 'открытость людям',
      minus: 'автономия и избирательность'
    }
  };

  /*
   * Тексты намеренно короткие и осторожные. Они опираются на документ
   * «Интерпретация шкал теста Сонди (система для выгрузки)»: сначала ресурс,
   * затем зона внимания, без клинических ярлыков и категоричных выводов.
   */
  var POLE_TEXT = {
    'h+': {
      label: 'h+ — теплота и близость',
      shortLabel: 'потребность в тепле и близости (h+)',
      resource: 'умение быть рядом, создавать доверие и атмосферу тепла',
      attention: 'чужая холодность или пауза в общении могут переживаться сильнее, чем хотелось бы',
      sentence: 'В профиле заметна потребность в тепле и близких отношениях: это ресурс — вы умеете быть рядом и создавать доверие; иногда полезно напоминать себе, что забота о себе не разрушает связь.',
      weakSentence: 'Слабо заметен тёплый, ориентированный на контакт полюс: он может проявляться в близких отношениях, но пока не является ведущим.'
    },
    'h-': {
      label: 'h− — сдержанность и личное пространство',
      shortLabel: 'потребность в личном пространстве (h−)',
      resource: 'самостоятельность, устойчивость и уважение к личным границам',
      attention: 'близким может не хватать сигналов расположения, а вам бывает труднее попросить о поддержке',
      sentence: 'Вам важно личное пространство и право самому решать, когда приближаться: это помогает сохранять устойчивость; иногда стоит проговаривать близким, что сдержанность — не холодность, а ваш способ заботиться о контакте.',
      weakSentence: 'Слабо заметна потребность в дистанции: она может включаться ситуативно, когда контакт становится слишком интенсивным.'
    },
    's+': {
      label: 's+ — активность и напор',
      shortLabel: 'активность и готовность действовать (s+)',
      resource: 'энергичность, инициатива и способность доводить начатое до результата',
      attention: 'в напряжённые периоды напор может становиться резче, чем вы сами того хотите',
      sentence: 'В профиле заметна активность и готовность действовать: это сильный ресурс там, где нужна инициатива; полезно иногда проверять, слышат ли вас другие в этом темпе, и оставлять место для паузы.',
      weakSentence: 'Слабо заметна наступательная энергия: возможно, вы чаще действуете осторожно или уступаете инициативу другим.'
    },
    's-': {
      label: 's− — мягкость и готовность уступать',
      shortLabel: 'мягкость и готовность уступать (s−)',
      resource: 'деликатность, умение слушать, терпение и способность сохранять отношения',
      attention: 'бывает трудно вовремя сказать «нет», а раздражение может накапливаться',
      sentence: 'Вам свойственно бережное отношение к людям и стремление избегать лишних столкновений: это делает вас надёжным и приятным в общении; иногда важно замечать момент, когда уступка становится слишком дорогой.',
      weakSentence: 'Слабо заметна готовность уступать: вероятно, вы чаще склонны отстаивать свою позицию, чем сглаживать конфликт.'
    },
    'e+': {
      label: 'e+ — тревожность и внутренний контроль',
      shortLabel: 'тревожность и внутренний контроль (e+)',
      resource: 'чувствительность к риску, способность замечать угрозу и строго придерживаться правил',
      attention: 'внутреннее напряжение и склонность брать на себя слишком много контроля',
      sentence: 'В профиле заметна тревожность и внутренний контроль: вы умеете замечать риск и строго придерживаться правил; иногда напряжение может становиться слишком сильным, и тогда полезно возвращать себе опору и паузу.',
      weakSentence: 'Слабо заметна тревожная, контролирующая тенденция: возможно, вы легче сохраняете спокойствие и реже фиксируетесь на рисках.'
    },
    'e-': {
      label: 'e− — стеничность и прямое отстаивание',
      shortLabel: 'стеничность и прямое отстаивание (e−)',
      resource: 'энергия отстаивания, смелость называть вещи своими именами',
      attention: 'если напряжение долго не находит выхода, реакция может быть резче, чем планировалось',
      sentence: 'В профиле заметна стеничность — энергия отстаивания и готовность прямо реагировать на несправедливость; это ценное качество, если давать напряжению выход до того, как оно станет взрывным.',
      weakSentence: 'Слабо заметна стеничная, отстаивающая тенденция: возможно, вы чаще сглаживаете конфликт или уступаете.'
    },
    'hy+': {
      label: 'hy+ — выразительность и потребность быть замеченным',
      shortLabel: 'выразительность и потребность в отклике (hy+)',
      resource: 'живость, артистичность, умение создавать контакт и вдохновлять',
      attention: 'когда вас не замечают, это может переживаться особенно болезненно',
      sentence: 'В профиле заметна живость и потребность в отклике: вы умеете быть заразительно ярким и создавать атмосферу; полезно помнить, что ваша ценность не зависит от того, насколько сильно вас сегодня заметили.',
      weakSentence: 'Слабо заметна потребность быть на виду: вероятно, вы реже нуждаетесь во внешнем отклике и легче остаётесь в тени.'
    },
    'hy-': {
      label: 'hy− — скромность и закрытость',
      shortLabel: 'скромность и закрытость (hy−)',
      resource: 'тактичность, глубина и уважение к чужому пространству',
      attention: 'важные слова о себе могут оставаться несказанными, а заслуги — незамеченными',
      sentence: 'Вам свойственно не выставлять себя на первый план: это позволяет сохранять глубину и тактичность; иногда полезно напоминать себе, что говорить о своих достижениях — не хвастовство, а способ быть понятым.',
      weakSentence: 'Слабо заметна склонность оставаться в тени: возможно, вы легче проявляетесь и реже избегаете внимания.'
    },
    'k+': {
      label: 'k+ — порядок и самоконтроль',
      shortLabel: 'опора на порядок и самоконтроль (k+)',
      resource: 'дисциплина, последовательность и способность выдерживать неопределённость через план',
      attention: 'в стрессе самоконтроль может становиться жёстким, и трудно позволить себе спонтанность',
      sentence: 'В профиле заметна опора на порядок и самоконтроль: вы умеете быть собранным и надёжным; иногда полезно давать себе право на паузу без анализа — это не потеря контроля, а забота о ресурсе.',
      weakSentence: 'Слабо заметна опора на жёсткий порядок: возможно, вы легче переносите неопределённость и чаще меняете способ действий.'
    },
    'k-': {
      label: 'k− — гибкость и открытость опыту',
      shortLabel: 'гибкость и открытость опыту (k−)',
      resource: 'пластичность, чуткость к контексту и умение находить неожиданные решения',
      attention: 'из-за гибкости может теряться опора и бывает труднее сказать «стоп»',
      sentence: 'Вы хорошо чувствуете контекст и умеете быть гибким: это помогает в переменах; иногда полезно опираться на несколько собственных «твёрдых правил», которые вы не меняете, даже когда вокруг всё меняется.',
      weakSentence: 'Слабо заметна гибкость: возможно, вы чаще предпочитаете устойчивый, проверенный способ действий и не спешите менять подход.'
    },
    'p+': {
      label: 'p+ — масштаб идей и интуиция',
      shortLabel: 'масштаб идей и интуиция (p+)',
      resource: 'творческое мышление, способность видеть перспективу и верить в свой замысел',
      attention: 'когда реальность не поспевает за замыслом, может приходить разочарование',
      sentence: 'В профиле заметна способность видеть большую картину и верить в свой замысел: это источник вдохновения; полезно время от времени переводить идею в маленькие проверяемые шаги.',
      weakSentence: 'Слабо заметна тяга к большим замыслам: возможно, вы реже уходите в масштабные идеи и больше опираетесь на конкретные задачи.'
    },
    'p-': {
      label: 'p− — реализм и проверка',
      shortLabel: 'реализм и трезвая проверка (p−)',
      resource: 'практичность, критическое мышление и умение проверять гипотезы',
      attention: 'осторожность может оборачиваться неверием в свои возможности',
      sentence: 'Вы умеете быть реалистом и проверять идеи на прочность: это защищает от риска; иногда полезно разрешать себе сначала попробовать маленький шаг, не требуя полной гарантии результата.',
      weakSentence: 'Слабо заметна критическая проверка: возможно, вы легче доверяете замыслу и реже останавливаете себя сомнениями.'
    },
    'd+': {
      label: 'd+ — интерес к новому и мобильность',
      shortLabel: 'интерес к новому и мобильность (d+)',
      resource: 'любознательность, лёгкость на подъём и открытость новым впечатлениям',
      attention: 'труднее удерживать интерес к начатому, возможна торопливость',
      sentence: 'Вам важен вкус к новому и живое движение: это даёт энергию и широту взгляда; иногда полезно оставлять в жизни несколько «якорей» — дел и отношений, которые вы выбираете сохранять.',
      weakSentence: 'Слабо заметна тяга к новому: возможно, вы реже ищете перемены и больше цените привычный уклад.'
    },
    'd-': {
      label: 'd− — устойчивость и привязанность',
      shortLabel: 'устойчивость и привязанность (d−)',
      resource: 'надёжность, постоянство и способность выстраивать долгие отношения',
      attention: 'бывает сложно отпускать то, что уже не работает, и начинать новое',
      sentence: 'Вы умеете быть надёжным и ценить постоянство: это делает ваши связи глубокими; полезно напоминать себе, что небольшие изменения не обязательно разрушают опору — иногда они её обновляют.',
      weakSentence: 'Слабо заметна привязанность к привычному: возможно, вы легче расстаётесь с прошлым и быстрее включаетесь в новое.'
    },
    'm+': {
      label: 'm+ — открытость людям',
      shortLabel: 'открытость людям и включённость (m+)',
      resource: 'жизнерадостность, готовность делиться и умение создавать команду',
      attention: 'одиночество может переживаться тяжелее, чем хотелось бы',
      sentence: 'В профиле заметна открытость людям и потребность быть вместе: это даёт тепло и поддержку. Но иногда полезно оставлять себе время на тишину, чтобы восстанавливать ресурс, а не только отдавать его.',
      weakSentence: 'Слабо заметна потребность быть вместе: возможно, вы легче переносите уединение и реже ищете широкий круг общения.'
    },
    'm-': {
      label: 'm− — автономия и избирательность',
      shortLabel: 'автономия и избирательность (m−)',
      resource: 'самодостаточность, глубина и избирательность в контактах',
      attention: 'окружающие могут воспринимать закрытость как дистанцию',
      sentence: 'Вам важно личное пространство и небольшой круг по-настоящему близких людей: это позволяет сохранять глубину; иногда полезно говорить близким прямо, что пауза — не отдаление, а способ восстановиться.',
      weakSentence: 'Слабо заметна потребность в автономии: возможно, вы легче включаетесь в общий круг и реже устаёте от контактов.'
    }
  };

  /*
   * Парные сочетания — сжатые формулировки из раздела 5 документа
   * «Интерпретация шкал теста Сонди».
   */
  var PAIR_TEXT = {
    'h+/s+': 'теплота вместе с активностью: ресурс — инициатива в отношениях; зона внимания — не подавлять другого своей энергией.',
    'h+/s-': 'теплота вместе с уступчивостью: ресурс — мягкость; зона внимания — не терять себя в желании сохранить мир.',
    'h-/s+': 'самостоятельность вместе с напором: ресурс — независимость и воля; зона внимания — не превращать дистанцию в стену.',
    'h-/s-': 'сдержанность вместе с уступчивостью: ресурс — такт и терпение; зона внимания — вовремя заявлять о своих потребностях.',
    'e+/hy+': 'ответственность вместе с выразительностью: ресурс — харизма и надёжность; зона внимания — не брать на себя слишком много «за всех».',
    'e+/hy-': 'ответственность вместе со скромностью: ресурс — надёжность без пафоса; зона внимания — замечать свои заслуги и не копить усталость.',
    'e-/hy+': 'чувствительность к несправедливости вместе с выразительностью: ресурс — смелость и энергия; зона внимания — давать эмоциям выход до того, как они станут взрывными.',
    'e-/hy-': 'чувствительность к несправедливости вместе с закрытостью: ресурс — глубина и принципиальность; зона внимания — не оставлять напряжение без разговора и поддержки.',
    'k+/p+': 'порядок вместе с масштабом: ресурс — стратегичность; зона внимания — не требовать от себя идеального результата сразу.',
    'k+/p-': 'порядок вместе с реализмом: ресурс — устойчивость; зона внимания — не отказываться от смелых идей только потому, что они новые.',
    'k-/p+': 'гибкость вместе с масштабом: ресурс — творческая адаптивность; зона внимания — удерживать завершение начатого.',
    'k-/p-': 'гибкость вместе с реализмом: ресурс — практичность; зона внимания — сохранять собственную линию и не терять ориентир.',
    'd+/m+': 'новизна вместе с открытостью: ресурс — широкая сеть контактов и энергия; зона внимания — глубина и завершённость отдельных связей.',
    'd+/m-': 'новизна вместе с автономией: ресурс — самостоятельность в переменах; зона внимания — не оставаться с переменами в одиночестве.',
    'd-/m+': 'устойчивость вместе с открытостью: ресурс — надёжная среда и тепло; зона внимания — оставлять место для обновления и новых встреч.',
    'd-/m-': 'устойчивость вместе с автономией: ресурс — глубина и постоянство; зона внимания — не закрывать дверь перед теми, кто хочет быть рядом.'
  };

  var TYPE_TEXT = {
    sanguine: {
      code: 'sanguine',
      label: 'Живой тип',
      classical: 'сангвинический',
      subtype: 'сильный, уравновешенный, подвижный',
      description: 'Живой тип (сангвинический): сильная, уравновешенная, подвижная нервная система. Помогает быстро включаться, легко переключаться и сохранять работоспособность; в стрессе возможны торопливость и поверхностность.',
      sectors: ['Экстраверсия', 'Лабильность'],
      sectorHint: 'экстраверсия / лабильность',
      strength: { code: 'strong', label: 'сильная нервная система' },
      balance: { code: 'balanced', label: 'уравновешенный' },
      mobility: { code: 'mobile', label: 'подвижный' }
    },
    choleric: {
      code: 'choleric',
      label: 'Безудержный тип',
      classical: 'холерический',
      subtype: 'сильный, неуравновешенный, возбудимый',
      description: 'Безудержный тип (холерический): сильная, неуравновешенная нервная система с преобладанием возбуждения. Даёт энергию, быстроту и напор; в стрессе — резкость и трудность вовремя остановиться.',
      sectors: ['Стеничность', 'Спонтанность'],
      sectorHint: 'стеничность / спонтанность',
      strength: { code: 'strong', label: 'сильная нервная система' },
      balance: { code: 'excitation', label: 'неуравновешенный, с преобладанием возбуждения' },
      mobility: { code: 'mobile', label: 'подвижный, но истощаемый' }
    },
    calm: {
      code: 'calm',
      label: 'Спокойный тип',
      classical: 'инертный',
      subtype: 'сильный, уравновешенный, инертный',
      description: 'Спокойный (инертный) тип: сильная, уравновешенная, инертная нервная система. Даёт устойчивость, основательность и способность долго держать нагрузку; в стрессе — трудность переключения и внешняя медлительность. Это не флегматик: по Павлову это спокойный, инертный тип.',
      sectors: ['Интроверсия', 'Ригидность'],
      sectorHint: 'интроверсия / ригидность',
      strength: { code: 'strong', label: 'сильная нервная система' },
      balance: { code: 'balanced', label: 'уравновешенный' },
      mobility: { code: 'inert', label: 'инертный' }
    },
    melancholic: {
      code: 'melancholic',
      label: 'Слабый тип',
      classical: 'меланхолический',
      subtype: 'слабый, высокочувствительный',
      description: 'Слабый тип (меланхолический): слабая, высокочувствительная нервная система. Даёт тонкую чувствительность, глубину и осторожность; в стрессе — истощение, тревожность и уход в себя. «Слабый» здесь означает не слабость характера, а более высокую чувствительность и меньший запас устойчивости к длительным перегрузкам.',
      sectors: ['Тревожность', 'Сензитивность'],
      sectorHint: 'тревожность / сензитивность',
      strength: { code: 'weak', label: 'относительно более слабая, высокочувствительная нервная система' },
      balance: { code: 'unstable', label: 'неустойчивый, чувствительный к перегрузке' },
      mobility: { code: 'slow', label: 'замедленная, истощаемая' }
    }
  };

  var SECTORS = [
    {
      name: 'Экстраверсия',
      short: 'экстраверсия',
      angle: 0,
      sub: 'соц. активность',
      description: 'направленность вовне, социальная активность, контактность и интерес к людям'
    },
    {
      name: 'Спонтанность',
      short: 'спонтанность',
      angle: 315,
      description: 'готовность действовать по внутреннему импульсу, без долгой подготовки'
    },
    {
      name: 'Стеничность',
      short: 'стеничность',
      angle: 270,
      sub: '',
      description: 'стеничность, энергия отстаивания, напор и готовность к сопротивлению'
    },
    {
      name: 'Ригидность',
      short: 'ригидность',
      angle: 225,
      description: 'устойчивость установок, опора на порядок и проверенное'
    },
    {
      name: 'Интроверсия',
      short: 'интроверсия',
      angle: 180,
      sub: 'соц. пассивность',
      description: 'социальная пассивность, направленность внутрь, потребность в дистанции'
    },
    {
      name: 'Сензитивность',
      short: 'сензитивность',
      angle: 135,
      description: 'чувствительность к нюансам, осторожность и ориентация на отношения'
    },
    {
      name: 'Тревожность',
      short: 'тревожность',
      angle: 90,
      description: 'настороженность, чувствительность к угрозе и потребность в определённости'
    },
    {
      name: 'Лабильность',
      short: 'лабильность',
      angle: 45,
      description: 'эмоциональная подвижность, лабильность и живой отклик на впечатления'
    }
  ];

  /*
   * Позиции 16 полюсов на круге — по схеме Сонди (фото пользователя).
   * Угол: 0° — экстраверсия, 90° — тревожность, 180° — интроверсия,
   * 270° — стеничность. Вес отражает, насколько полюс «чистый»:
   * осевые полюса (e, d, s) — 1.0; смешанные (h, k, m, p, hy) — меньше.
   */
  var POLE_GEOMETRY = {
    'd+':  { angle: 0,   weight: 1.0 },
    'm+':  { angle: 30,  weight: 0.8 },
    'hy+': { angle: 70,  weight: 0.6 },
    'e+':  { angle: 90,  weight: 1.0 },
    'hy-': { angle: 110, weight: 0.6 },
    'h+':  { angle: 120, weight: 0.7 },
    's-':  { angle: 135, weight: 1.0 },
    'h-':  { angle: 155, weight: 0.7 },
    'k-':  { angle: 165, weight: 0.8 },
    'd-':  { angle: 180, weight: 1.0 },
    'k+':  { angle: 200, weight: 0.8 },
    'p-':  { angle: 250, weight: 0.7 },
    'e-':  { angle: 270, weight: 1.0 },
    'p+':  { angle: 290, weight: 0.7 },
    's+':  { angle: 315, weight: 1.0 },
    'm-':  { angle: 160, weight: 0.8 }
  };

  /* Оси: EI — экстраверсия/интроверсия, AS — тревожность/стеничность,
     SS — спонтанность/сензитивность, RL — ригидность/лабильность. */
  var AXIS_ANGLES = { EI: 0, AS: 90, SS: 315, RL: 225 };

  var TYPE_BY_SECTOR = {
    'Экстраверсия': 'sanguine',
    'Лабильность': 'sanguine',
    'Тревожность': 'melancholic',
    'Сензитивность': 'melancholic',
    'Интроверсия': 'calm',
    'Ригидность': 'calm',
    'Стеничность': 'choleric',
    'Спонтанность': 'choleric'
  };

  /* Максимально возможная проекция каждой оси (для нормировки в −1…+1). */
  var AXIS_MAX = (function () {
    var max = { EI: 0, AS: 0, SS: 0, RL: 0 };
    for (var i = 0; i < POLES.length; i++) {
      var geometry = POLE_GEOMETRY[POLES[i]];
      for (var axis in AXIS_ANGLES) {
        if (!Object.prototype.hasOwnProperty.call(AXIS_ANGLES, axis)) continue;
        var rad = (geometry.angle - AXIS_ANGLES[axis]) * Math.PI / 180;
        max[axis] += geometry.weight * Math.abs(Math.cos(rad));
      }
    }
    for (var key in max) {
      if (Object.prototype.hasOwnProperty.call(max, key)) {
        max[key] = Math.round(max[key] * 6 * 10000) / 10000;
      }
    }
    return max;
  })();

  var DEFAULT_CONFIG = {
    /* Порог первого плана: шкала считается ведущей с 3 баллов. */
    FIRST_THRESHOLD: 3,
    /* Порог второго плана: шкала берётся в расчёт с 4 баллов. */
    SECOND_THRESHOLD: 4,
    /* 4 балла второго плана = 2.75 балла первого плана. */
    SECOND_ANCHOR: 4,
    SECOND_EQUIV: 2.75,
    /*
     * Как объединять первый и второй план для одной и той же шкалы:
     *   'max'   — max(P1, Q): консервативно, без двойного счёта (по умолчанию);
     *   'bonus' — min(6, P1 + 0.5 * Q): второй план слегка усиливает первый;
     *   'sum'   — min(6, P1 + Q): второй план суммируется с первым.
     */
    COMBINE_MODE: 'max',
    /* Масштаб отображения радиуса: 95-й процентиль случайных валидных профилей. */
    R_REF: 8.0,
    /* Усиление проекций осей для читаемых значений в тексте. */
    AXIS_GAIN: 3.0,
    /* Насколько близко к границе типов считается «смешанный» профиль. */
    TYPE_BOUNDARY_DEGREES: 12,
    MAX_LEADING: 3,
    MAX_BACKGROUND: 2,
    /* Значения оси меньше этого по модулю считаются «без смещения». */
    AXIS_DEADZONE: 0.08
  };

  var DISCLAIMER =
    'Результат теста — это не диагноз и не окончательная характеристика. ' +
    'Он показывает, какие тенденции могут быть заметны в вашей жизни сейчас. ' +
    'Если описание откликается и хочется разобраться глубже, обсудите его ' +
    'со специалистом, которому вы доверяете.';

  var SQRT2 = Math.SQRT2;

  function makeConfig(overrides) {
    var cfg = {};
    var key;
    for (key in DEFAULT_CONFIG) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) {
        cfg[key] = DEFAULT_CONFIG[key];
      }
    }
    if (overrides && typeof overrides === 'object') {
      for (key in overrides) {
        if (Object.prototype.hasOwnProperty.call(overrides, key)) {
          cfg[key] = overrides[key];
        }
      }
    }
    return cfg;
  }

  function numberOr(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  function zeros() {
    var out = {};
    for (var i = 0; i < POLES.length; i++) out[POLES[i]] = 0;
    return out;
  }

  function clone(obj) {
    var out = {};
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
    }
    return out;
  }

  function normalizeScores(scores) {
    var out = zeros();
    if (!scores || typeof scores !== 'object') return out;
    for (var i = 0; i < POLES.length; i++) {
      var pole = POLES[i];
      var value = numberOr(scores[pole], 0);
      if (value < 0) value = 0;
      if (value > 6) value = 6;
      out[pole] = value;
    }
    return out;
  }

  function sumScores(scores) {
    var total = 0;
    for (var i = 0; i < POLES.length; i++) total += scores[POLES[i]] || 0;
    return Math.round(total * 1000) / 1000;
  }

  function poleFactor(pole) {
    return pole.slice(0, -1);
  }

  function pairKey(first, second) {
    return first + '/' + second;
  }

  /* -----------------------------------------------------------------------
   * 1. Второй план: калибровка 4 → 2.75
   * --------------------------------------------------------------------- */
  function convertSecond(p2, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    var out = zeros();
    var k = cfg.SECOND_EQUIV / cfg.SECOND_ANCHOR;
    for (var i = 0; i < POLES.length; i++) {
      var pole = POLES[i];
      var value = p2[pole] || 0;
      out[pole] = value >= cfg.SECOND_THRESHOLD ? value * k : 0;
    }
    return out;
  }

  /* -----------------------------------------------------------------------
   * 2. Отбор шкал
   *
   * Основное правило:
   *   - первый план: P1 >= 3;
   *   - второй план: P2 >= 4;
   *   - шкалы P1 < 3 попадают в анализ только в «сглаженном» профиле,
   *     когда нет ни одной шкалы P1 >= 3 и ни одной шкалы P2 >= 4.
   * --------------------------------------------------------------------- */
  function selectScales(p1, p2, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    var core = [];
    var background = [];
    var both = [];
    var weak = [];
    var fallback = false;
    var i;

    for (i = 0; i < POLES.length; i++) {
      if (p1[POLES[i]] >= cfg.FIRST_THRESHOLD) core.push(POLES[i]);
      if (p2[POLES[i]] >= cfg.SECOND_THRESHOLD) background.push(POLES[i]);
    }
    for (i = 0; i < core.length; i++) {
      if (background.indexOf(core[i]) !== -1) both.push(core[i]);
    }

    if (core.length === 0 && background.length === 0) {
      var maxFirst = 0;
      for (i = 0; i < POLES.length; i++) {
        if (p1[POLES[i]] > maxFirst) maxFirst = p1[POLES[i]];
      }
      if (maxFirst >= 1) {
        fallback = true;
        for (i = 0; i < POLES.length; i++) {
          if (p1[POLES[i]] === maxFirst) weak.push(POLES[i]);
        }
      }
    }

    var selected = [];
    [core, background, weak].forEach(function (list) {
      list.forEach(function (pole) {
        if (selected.indexOf(pole) === -1) selected.push(pole);
      });
    });

    return {
      core: core,
      background: background,
      both: both,
      weak: weak,
      fallback: fallback,
      selected: selected
    };
  }

  /* -----------------------------------------------------------------------
   * 3. Эффективные баллы
   *
   * Q — калиброванный второй план.
   * Для ведущей шкалы первого плана:
   *   max   — max(P1, Q);
   *   bonus — min(6, P1 + 0.5 Q);
   *   sum   — min(6, P1 + Q).
   * Для шкалы, которая есть только на втором плане: Q.
   * В сглаженном профиле: P1 без изменений.
   * --------------------------------------------------------------------- */
  function effectiveScores(p1, p2, selection, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    var q = convertSecond(p2, cfg);
    var e = zeros();
    var i;

    for (i = 0; i < POLES.length; i++) {
      var pole = POLES[i];
      var inCore = selection.core.indexOf(pole) !== -1;
      var inBackground = selection.background.indexOf(pole) !== -1;
      var inWeak = selection.weak.indexOf(pole) !== -1;

      if (selection.fallback && inWeak) {
        e[pole] = p1[pole];
      } else if (inCore) {
        if (cfg.COMBINE_MODE === 'sum') {
          e[pole] = Math.min(6, p1[pole] + q[pole]);
        } else if (cfg.COMBINE_MODE === 'bonus') {
          e[pole] = Math.min(6, p1[pole] + 0.5 * q[pole]);
        } else {
          e[pole] = Math.max(p1[pole], q[pole]);
        }
      } else if (inBackground) {
        e[pole] = q[pole];
      }
    }

    return { q: q, e: e };
  }

  /* -----------------------------------------------------------------------
   * 4. Геометрия 16 полюсов и четыре оси ИТО
   *
   * Каждый полюс имеет позицию на круге (POLE_GEOMETRY). Оси — это
   * проекции общего облака полюсов:
   *   EI = X, AS = Y, SS = (X − Y)/√2, RL = (−X − Y)/√2.
   * --------------------------------------------------------------------- */
  function computeAxes(e, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    var x = 0;
    var y = 0;
    for (var i = 0; i < POLES.length; i++) {
      var pole = POLES[i];
      var geometry = POLE_GEOMETRY[pole];
      var score = e[pole] || 0;
      var rad = geometry.angle * Math.PI / 180;
      x += geometry.weight * score * Math.cos(rad);
      y += geometry.weight * score * Math.sin(rad);
    }

    /*
     * Оси — это проекции одного и того же облака полюсов:
     *   EI — вправо (экстраверсия), AS — вверх (тревожность),
     *   SS — вправо-вниз (спонтанность), RL — влево-вниз (ригидность).
     */
    var raw = {
      EI: x,
      AS: y,
      SS: (x - y) / SQRT2,
      RL: (-x - y) / SQRT2
    };

    var gain = cfg.AXIS_GAIN == null ? 3.0 : cfg.AXIS_GAIN;
    var norm = {
      EI: clamp(raw.EI / AXIS_MAX.EI * gain, -1, 1),
      AS: clamp(raw.AS / AXIS_MAX.AS * gain, -1, 1),
      SS: clamp(raw.SS / AXIS_MAX.SS * gain, -1, 1),
      RL: clamp(raw.RL / AXIS_MAX.RL * gain, -1, 1)
    };

    return {
      poleVector: { x: round(x, 4), y: round(y, 4) },
      raw: {
        EI: round(raw.EI, 4),
        AS: round(raw.AS, 4),
        SS: round(raw.SS, 4),
        RL: round(raw.RL, 4)
      },
      max: AXIS_MAX,
      norm: {
        EI: round(norm.EI, 4),
        AS: round(norm.AS, 4),
        SS: round(norm.SS, 4),
        RL: round(norm.RL, 4)
      }
    };
  }

  /* -----------------------------------------------------------------------
   * 5. Точка на круге ИТО
   *
   * Четыре оси расположены по диагоналям круга:
   *   справа — экстраверсия / слева — интроверсия;
   *   справа-снизу — спонтанность / слева-сверху — сензитивность;
   *   снизу — стеничность / сверху — тревожность;
   *   слева-снизу — ригидность / справа-сверху — лабильность.
   *
   * Точка — векторная сумма взвешенных позиций полюсов.
   * --------------------------------------------------------------------- */
  function computeCircle(axes, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    /*
     * Расположение по образцу ИТО (по часовой стрелке):
     *   I  Экстраверсия — справа
     *   II Спонтанность — справа-снизу
     *   III Стеничность — снизу
     *   IV Ригидность — слева-снизу
     *   V  Интроверсия — слева
     *   VI Сензитивность — слева-сверху
     *   VII Тревожность — сверху
     *   VIII Лабильность — справа-сверху
     * Точка — векторная сумма взвешенных позиций 16 полюсов.
     */
    var x = axes.poleVector.x;
    var y = axes.poleVector.y;
    var rRaw = Math.sqrt(x * x + y * y);
    var angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    var nearest = nearestSector(angle);
    var second = secondNearestSector(angle, nearest.index);
    /*
     * Мягкая нормировка: rRaw / R_REF — линейный масштаб, tanh — насыщение
     * у границы. Радиус никогда не «прилипает» к 1 и сохраняет различие
     * между очень выраженными профилями.
     */
    var r = Math.tanh(rRaw / cfg.R_REF);
    var blend = second.distance < 15;

    return {
      x: round(x, 4),
      y: round(y, 4),
      rRaw: round(rRaw, 4),
      r: round(r, 4),
      score9: round(r * 9, 1),
      angle: round(angle, 1),
      sector: nearest,
      second: second,
      blend: blend
    };
  }

  function nearestSector(angle) {
    var best = null;
    for (var i = 0; i < SECTORS.length; i++) {
      var dist = angularDistance(angle, SECTORS[i].angle);
      if (!best || dist < best.distance) {
        best = {
          index: i,
          name: SECTORS[i].name,
          short: SECTORS[i].short,
          angle: SECTORS[i].angle,
          description: SECTORS[i].description,
          distance: round(dist, 1)
        };
      }
    }
    return best;
  }

  function secondNearestSector(angle, excludeIndex) {
    var best = null;
    for (var i = 0; i < SECTORS.length; i++) {
      if (i === excludeIndex) continue;
      var dist = angularDistance(angle, SECTORS[i].angle);
      if (!best || dist < best.distance) {
        best = {
          index: i,
          name: SECTORS[i].name,
          short: SECTORS[i].short,
          angle: SECTORS[i].angle,
          distance: round(dist, 1)
        };
      }
    }
    return best;
  }

  function angularDistance(a, b) {
    var d = Math.abs(((a - b + 540) % 360) - 180);
    return d;
  }

  /* -----------------------------------------------------------------------
   * 6. Тип ВНД по Павлову
   *
   * Пороги исходного алгоритма заданы на шкале −4…+4, поэтому знаковые
   * факторы линейно пересчитываются из 0…6 в −4…+4 (умножение на 4/6).
   * --------------------------------------------------------------------- */
  function classifyPavlov(circle, cfg) {
    cfg = cfg || DEFAULT_CONFIG;
    var sector = circle.sector.name;
    var typeCode = TYPE_BY_SECTOR[sector] || 'melancholic';
    var type = TYPE_TEXT[typeCode];

    /*
     * Границы четырёх типов проходят по диагоналям: 45°, 135°, 225°, 315°.
     * Если точка стоит близко к такой границе, тип считается смешанным.
     */
    var boundaries = [45, 135, 225, 315];
    var boundaryDistance = 999;
    for (var i = 0; i < boundaries.length; i++) {
      var distance = angularDistance(circle.angle, boundaries[i]);
      if (distance < boundaryDistance) boundaryDistance = distance;
    }

    return {
      type: clone(type),
      strength: clone(type.strength),
      balance: clone(type.balance),
      mobility: clone(type.mobility),
      nearBoundary: boundaryDistance < cfg.TYPE_BOUNDARY_DEGREES,
      boundaryDistance: round(boundaryDistance, 1),
      sector: sector
    };
  }

  /* -----------------------------------------------------------------------
   * 7. Ведущие шкалы, амбивалентность и парные сочетания
   * --------------------------------------------------------------------- */
  function pickLeading(selection, p1, e, cfg) {
    var groups = {};
    var i;
    var source = selection.core.length ? selection.core : selection.background;
    var sourceScores = selection.core.length ? p1 : e;
    var plan = selection.core.length ? 'first' : 'second';

    for (i = 0; i < source.length; i++) {
      var pole = source[i];
      var factor = poleFactor(pole);
      if (!groups[factor]) groups[factor] = { factor: factor, poles: [] };
      groups[factor].poles.push(pole);
    }

    var chosen = [];
    var ambivalence = [];
    for (var factor in groups) {
      if (!Object.prototype.hasOwnProperty.call(groups, factor)) continue;
      var poles = groups[factor].poles;
      var plus = poles.indexOf(factor + '+') !== -1 ? factor + '+' : null;
      var minus = poles.indexOf(factor + '-') !== -1 ? factor + '-' : null;
      var selectedPole;
      if (plus && minus) {
        if (sourceScores[plus] >= sourceScores[minus]) selectedPole = plus;
        else selectedPole = minus;
        if (plan === 'first') {
          ambivalence.push({
            factor: factor,
            plus: plus,
            minus: minus,
            plusScore: sourceScores[plus],
            minusScore: sourceScores[minus],
            chosen: selectedPole
          });
        }
      } else {
        selectedPole = plus || minus;
      }
      if (selectedPole) {
        chosen.push({
          pole: selectedPole,
          factor: factor,
          score: sourceScores[selectedPole],
          effective: e[selectedPole],
          plan: plan
        });
      }
    }

    chosen.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return FACTOR_ORDER[a.factor] - FACTOR_ORDER[b.factor];
    });

    var leading = chosen.slice(0, cfg.MAX_LEADING);
    var leadingFactors = {};
    leading.forEach(function (item) { leadingFactors[item.factor] = true; });
    var ambivalenceForLeading = ambivalence.filter(function (item) {
      return leadingFactors[item.factor];
    }).slice(0, 1);

    return {
      leading: leading,
      ambivalence: ambivalenceForLeading
    };
  }

  function pickPair(selection, e, leading) {
    var leadingFactors = {};
    leading.forEach(function (item) { leadingFactors[item.factor] = true; });

    var vectors = [
      ['h', 's'],
      ['e', 'hy'],
      ['k', 'p'],
      ['d', 'm']
    ];
    var candidates = [];

    vectors.forEach(function (vector) {
      var first = bestPoleOfFactor(vector[0], e);
      var second = bestPoleOfFactor(vector[1], e);
      if (!first || !second) return;
      if (first.effective < 2.75 || second.effective < 2.75) return;
      if (!leadingFactors[first.factor] && !leadingFactors[second.factor]) return;
      var key = pairKey(first.pole, second.pole);
      if (!PAIR_TEXT[key]) return;
      candidates.push({
        vector: vector.join('+'),
        key: key,
        poles: [first.pole, second.pole],
        score: first.effective + second.effective,
        text: PAIR_TEXT[key]
      });
    });

    candidates.sort(function (a, b) { return b.score - a.score; });
    return candidates.length ? candidates[0] : null;
  }

  function bestPoleOfFactor(factor, e) {
    var plus = factor + '+';
    var minus = factor + '-';
    if (e[plus] <= 0 && e[minus] <= 0) return null;
    if (e[plus] >= e[minus]) {
      return { pole: plus, factor: factor, effective: e[plus] };
    }
    return { pole: minus, factor: factor, effective: e[minus] };
  }

  /* -----------------------------------------------------------------------
   * 8. Текстовая интерпретация
   * --------------------------------------------------------------------- */
  function buildText(result, cfg) {
    var cfgLocal = cfg || DEFAULT_CONFIG;
    var leading = result.leading.leading || [];
    var ambivalence = result.leading.ambivalence || [];
    var pair = result.pair;
    var type = result.pavlov.type;
    var circle = result.circle;
    var axes = result.axes;
    var noData = result.selection.selected.length === 0;
    var backgroundLeading = leading.length > 0 && leading[0].plan === 'second';

    var lines = [];
    var scaleLines = [];
    var i;

    if (leading.length) {
      for (i = 0; i < leading.length; i++) {
        scaleLines.push('• ' + POLE_TEXT[leading[i].pole].sentence);
      }
    } else if (result.selection.fallback) {
      for (i = 0; i < result.selection.weak.length && i < 2; i++) {
        scaleLines.push('• ' + POLE_TEXT[result.selection.weak[i]].weakSentence);
      }
    }

    for (i = 0; i < ambivalence.length; i++) {
      var amb = ambivalence[i];
      scaleLines.push(
        '• В факторе «' + FACTOR_META[amb.factor].label + '» заметны обе потребности: ' +
        'с одной стороны — ' + FACTOR_META[amb.factor].plus +
        ', с другой — ' + FACTOR_META[amb.factor].minus +
        '. Иногда они могут спорить между собой.'
      );
    }

    if (pair) {
      scaleLines.push('• Дополнительное сочетание — ' + pair.text);
    }

    var summary;
    if (noData) {
      summary = 'Недостаточно данных для интерпретации: нет шкал, набравших 3 балла ' +
        'на первом плане или 4 балла на втором.';
    } else if (backgroundLeading) {
      var bgLabels = joinRu(leading.map(function (item) {
        return POLE_TEXT[item.pole].shortLabel;
      }));
      summary = 'На первом плане выраженных тенденций нет; на втором плане заметны: ' +
        bgLabels + '. По формальным критериям источника тип ВНД — ' +
        type.label.toLowerCase() + ' (' + type.classical + ').';
    } else if (leading.length) {
      var labels = joinRu(leading.map(function (item) {
        return POLE_TEXT[item.pole].shortLabel;
      }));
      summary = 'В профиле наиболее заметны: ' + labels + '. ' +
        'По формальным критериям источника тип ВНД — ' + type.label.toLowerCase() +
        ' (' + type.classical + ').';
    } else if (result.selection.fallback) {
      summary = 'Ярко выраженных тенденций не выявлено; профиль скорее сглаженный. ' +
        'По формальным критериям источника тип ВНД — ' + type.label.toLowerCase() + '.';
    } else {
      summary = 'Недостаточно данных для интерпретации.';
    }

    var pavlovLine = '';
    var pavlovDescription = '';
    var circleLine = '';
    var axisLine = '';
    var consistency = '';

    if (!noData) {
      pavlovLine = 'Сила: ' + result.pavlov.strength.label + '. ' +
        'Баланс: ' + result.pavlov.balance.label + '. ' +
        'Подвижность: ' + result.pavlov.mobility.label + '.';
      pavlovDescription = type.description;
      if (result.pavlov.nearBoundary) {
        pavlovDescription += ' Точка стоит близко к границе типов, поэтому возможен смешанный вариант; вывод о типе стоит считать особенно осторожным.';
      }

      circleLine = 'Точка смещена в сектор «' + circle.sector.name + '» (радиус ' +
        formatNumber(circle.r, 2) + ' по шкале 0–1, или ' +
        formatNumber(circle.score9, 1) + ' из 9). ' +
        capitalize(circle.sector.description) + '.';
      if (circle.blend) {
        circleLine += ' Близко к границе с сектором «' + circle.second.name + '», поэтому возможен оттенок ' +
          circle.second.short + '.';
      }
      if (circle.r >= 0.9) {
        circleLine += ' Радиус близок к верхней границе шкалы: тенденции выражены очень заметно.';
      }

      axisLine = 'Оси: ' +
        'экстраверсия–интроверсия ' + formatSigned(axes.norm.EI) + ' (' + axisDirection('EI', axes.norm.EI, cfgLocal) + '); ' +
        'спонтанность–сензитивность ' + formatSigned(axes.norm.SS) + ' (' + axisDirection('SS', axes.norm.SS, cfgLocal) + '); ' +
        'тревожность–стеничность ' + formatSigned(axes.norm.AS) + ' (' + axisDirection('AS', axes.norm.AS, cfgLocal) + '); ' +
        'ригидность–лабильность ' + formatSigned(axes.norm.RL) + ' (' + axisDirection('RL', axes.norm.RL, cfgLocal) + ').';

      if (result.pavlov.nearBoundary) {
        consistency = 'Точка стоит близко к границе типов: тип определён по ведущему сектору, но возможен смешанный вариант. Это не диагноз, а гипотеза.';
      } else {
        consistency = 'Тип определён по ведущему сектору круга; соседние сектора добавляют оттенок, но не меняют основной рисунок. Это не диагноз, а гипотеза.';
      }
    }

    var backgroundText = '';
    if (!noData && !backgroundLeading) {
      var backgroundOnly = result.selection.background.filter(function (pole) {
        return result.selection.core.indexOf(pole) === -1;
      });
      backgroundOnly.sort(function (a, b) {
        return result.input.p2[b] - result.input.p2[a];
      });
      if (backgroundOnly.length) {
        var bg = joinRu(backgroundOnly.slice(0, cfgLocal.MAX_BACKGROUND).map(function (pole) {
          return '«' + POLE_TEXT[pole].label + '»';
        }));
        if (backgroundOnly.length === 1) {
          backgroundText = 'На втором плане заметна тенденция ' + bg +
            '. Это может проявляться не сразу, а в более спокойной обстановке или в близких отношениях; стоит рассматривать это как гипотезу, а не как окончательный вывод.';
        } else {
          backgroundText = 'На втором плане заметны тенденции ' + bg +
            '. Это может проявляться не сразу, а в более спокойной обстановке или в близких отношениях; стоит рассматривать это как гипотезу, а не как окончательный вывод.';
        }
      } else if (result.selection.both.length) {
        var bothLabels = joinRu(result.selection.both.slice(0, 3).map(function (pole) {
          return '«' + POLE_TEXT[pole].label + '»';
        }));
        if (result.selection.both.length === 1) {
          backgroundText = 'На втором плане ведущая тенденция ' + bothLabels +
            ' находит продолжение. Это можно рассматривать как дополнительное подтверждение, но не как отдельный вывод.';
        } else {
          backgroundText = 'На втором плане тенденции ' + bothLabels +
            ' находят продолжение. Это можно рассматривать как дополнительное подтверждение, но не как отдельный вывод.';
        }
      }
    }

    if (summary) {
      lines.push('Резюме');
      lines.push(summary);
      lines.push('');
    }
    if (scaleLines.length) {
      lines.push(backgroundLeading ? 'Тенденции второго плана' : 'Ведущие тенденции');
      if (backgroundLeading) {
        lines.push('Это фоновый слой: его стоит читать как гипотезу, а не как ведущие свойства.');
      }
      lines.push(scaleLines.join('\n'));
      lines.push('');
    }
    if (!noData) {
      lines.push('Тип ВНД по Павлову');
      lines.push(pavlovLine);
      lines.push(pavlovDescription);
      lines.push('');
      lines.push('Положение на круге ИТО');
      lines.push(circleLine);
      lines.push(axisLine);
      lines.push(consistency);
      lines.push('');
    }
    if (backgroundText) {
      lines.push('Второй план');
      lines.push(backgroundText);
      lines.push('');
    }
    lines.push(DISCLAIMER);

    return {
      summary: summary,
      scaleLines: scaleLines,
      pavlovLine: pavlovLine,
      pavlovDescription: pavlovDescription,
      circleLine: circleLine,
      axisLine: axisLine,
      consistency: consistency,
      background: backgroundText,
      disclaimer: DISCLAIMER,
      full: lines.join('\n')
    };
  }

  function axisDirection(axis, value, cfg) {
    if (Math.abs(value) < cfg.AXIS_DEADZONE) return 'без выраженного смещения';
    if (axis === 'EI') return value > 0 ? 'в сторону экстраверсии' : 'в сторону интроверсии';
    if (axis === 'SS') return value > 0 ? 'в сторону спонтанности' : 'в сторону сензитивности';
    if (axis === 'AS') return value > 0 ? 'в сторону тревожности' : 'в сторону стеничности';
    return value > 0 ? 'в сторону ригидности' : 'в сторону лабильности';
  }

  function joinRu(items) {
    if (!items.length) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + ' и ' + items[1];
    return items.slice(0, -1).join(', ') + ' и ' + items[items.length - 1];
  }

  function formatNumber(value, digits) {
    return Number(value).toFixed(digits).replace('.', ',');
  }

  function formatSigned(value) {
    var text = Number(value).toFixed(2).replace('.', ',');
    if (value > 0) return '+' + text;
    return text.replace('-', '−');
  }

  function capitalize(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  /* -----------------------------------------------------------------------
   * 8b. Матрица весов 16 × 4 (для документации, тестов и демо)
   * --------------------------------------------------------------------- */
  function getWeightMatrix(cfg) {
    var W = { EI: {}, AS: {}, SS: {}, RL: {} };
    for (var i = 0; i < POLES.length; i++) {
      var pole = POLES[i];
      var geometry = POLE_GEOMETRY[pole];
      for (var axis in AXIS_ANGLES) {
        if (!Object.prototype.hasOwnProperty.call(AXIS_ANGLES, axis)) continue;
        var rad = (geometry.angle - AXIS_ANGLES[axis]) * Math.PI / 180;
        W[axis][pole] = round(geometry.weight * Math.cos(rad), 4);
      }
    }
    return W;
  }

  function renderCircleSVG(result, options) {
    if (!result || !result.circle) return '';
    var opts = options || {};
    var size = opts.size || 760;
    var cx = size / 2;
    var cy = size / 2;
    var compact = !!opts.compact;
    var R = opts.radius || Math.round(size * (compact ? 0.42 : 0.296));
    var labelR = R + (opts.labelOffset || 55);
    var parts = [];

    function pt(radius, angleDeg) {
      var rad = angleDeg * Math.PI / 180;
      return {
        x: cx + radius * Math.cos(rad),
        y: cy - radius * Math.sin(rad)
      };
    }

    function fmt(value) {
      return Math.round(value * 100) / 100;
    }

    function polygonPoints(sector) {
      var start = sector.angle - 22.5;
      var end = sector.angle + 22.5;
      var pts = [fmt(cx) + ',' + fmt(cy)];
      for (var a = start; a <= end + 0.01; a += 3) {
        var p = pt(R, a);
        pts.push(fmt(p.x) + ',' + fmt(p.y));
      }
      return pts.join(' ');
    }

    var aria = 'Круг ИТО: сектор ' + result.circle.sector.name +
      ', радиус ' + result.circle.score9 + ' из 9';

    parts.push('<svg class="ito-svg" viewBox="0 0 ' + size + ' ' + size +
      '" role="img" aria-label="' + escapeXml(aria) + '">');

    /* Сектора */
    for (var i = 0; i < SECTORS.length; i++) {
      var sector = SECTORS[i];
      parts.push('<polygon class="ito-sector ' + (i % 2 ? 'ito-sector-alt' : '') +
        '" points="' + polygonPoints(sector) + '"/>');
    }

    /* Подсветка ожидаемых секторов типа ВНД */
    var expected = (result.pavlov && result.pavlov.type && result.pavlov.type.sectors) || [];
    for (var e = 0; e < expected.length; e++) {
      for (var s = 0; s < SECTORS.length; s++) {
        if (SECTORS[s].name !== expected[e]) continue;
        parts.push('<polygon class="ito-sector ito-sector-expected" points="' +
          polygonPoints(SECTORS[s]) + '"/>');
        break;
      }
    }

    /* Кольца 4, 7, 9 */
    var rings = [4, 7, 9];
    for (var r = 0; r < rings.length; r++) {
      parts.push('<circle class="ito-ring" cx="' + fmt(cx) + '" cy="' + fmt(cy) +
        '" r="' + fmt(R * rings[r] / 9) + '"/>');
    }

    /* Радиальные границы секторов */
    for (var b = 22.5; b < 360; b += 45) {
      var bp = pt(R, b);
      parts.push('<line class="ito-boundary" x1="' + fmt(cx) + '" y1="' + fmt(cy) +
        '" x2="' + fmt(bp.x) + '" y2="' + fmt(bp.y) + '"/>');
    }

    /* Четыре оси (через центр) */
    var axisAngles = [0, 315, 270, 225];
    for (var a = 0; a < axisAngles.length; a++) {
      var p1 = pt(R, axisAngles[a]);
      var p2 = pt(R, axisAngles[a] + 180);
      parts.push('<line class="ito-axis" x1="' + fmt(p2.x) + '" y1="' + fmt(p2.y) +
        '" x2="' + fmt(p1.x) + '" y2="' + fmt(p1.y) + '"/>');
    }

    if (!compact) {
    /* Подписи секторов: горизонтальные, вне кольца, без наложения */
    var roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    for (var l = 0; l < SECTORS.length; l++) {
      var sec = SECTORS[l];
      var lp = pt(labelR, sec.angle);
      var anchor = 'middle';
      if (lp.x > cx + 10) anchor = 'start';
      else if (lp.x < cx - 10) anchor = 'end';

      var ty = lp.y + 4;
      if (sec.angle === 270) ty = lp.y + 18;
      if (sec.angle === 90) ty = lp.y + 4;

      parts.push('<g class="ito-sector-label" transform="translate(' + fmt(lp.x) + ' ' + fmt(ty) + ')" text-anchor="' + anchor + '">');
      parts.push('<text class="ito-roman" x="0" y="-13">' + roman[l] + '</text>');
      parts.push('<text class="ito-name" x="0" y="4">' + escapeXml(sec.name) + '</text>');
      if (sec.sub) {
        parts.push('<text class="ito-sub" x="0" y="18">(' + escapeXml(sec.sub) + ')</text>');
      }
      parts.push('</g>');
    }

    }

    if (!compact) {
    /* Шкала 0–4–7–9 по вертикали */
    var scale = [
      { value: '9', y: cy - R },
      { value: '7', y: cy - R * 7 / 9 },
      { value: '4', y: cy - R * 4 / 9 },
      { value: '0', y: cy }
    ];
    for (var si = 0; si < scale.length; si++) {
      parts.push('<text class="ito-scale-label" x="' + fmt(cx + 8) + '" y="' + fmt(scale[si].y + 4) +
        '">' + scale[si].value + '</text>');
    }

    }

    /* Точка профиля */
    var pr = result.circle.r * R;
    var pp = pt(pr, result.circle.angle);
    parts.push('<line class="ito-point-line" x1="' + fmt(cx) + '" y1="' + fmt(cy) +
      '" x2="' + fmt(pp.x) + '" y2="' + fmt(pp.y) + '"/>');
    parts.push('<circle class="ito-point-halo" cx="' + fmt(pp.x) + '" cy="' + fmt(pp.y) + '" r="18"/>');
    parts.push('<circle class="ito-point" cx="' + fmt(pp.x) + '" cy="' + fmt(pp.y) + '" r="8"/>');
    parts.push('<circle class="ito-center" cx="' + fmt(cx) + '" cy="' + fmt(cy) + '" r="3"/>');

    parts.push('</svg>');
    return parts.join('');
  }

  function escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* -----------------------------------------------------------------------
   * 9. Публичный API
   * --------------------------------------------------------------------- */
  function analyze(p1Input, p2Input, options) {
    var cfg = makeConfig(options);
    var p1 = normalizeScores(p1Input);
    var p2 = normalizeScores(p2Input);
    var selection = selectScales(p1, p2, cfg);
    var scores = effectiveScores(p1, p2, selection, cfg);
    var axes = computeAxes(scores.e, cfg);
    var circle = computeCircle(axes, cfg);
    var pavlov = classifyPavlov(circle, cfg);
    var leading = pickLeading(selection, p1, scores.e, cfg);
    var pair = pickPair(selection, scores.e, leading.leading);

    var warnings = [];
    if (selection.selected.length === 0) {
      warnings.push('Нет шкал, подходящих под правила анализа: первый план < 3, второй план < 4, резервное правило не сработало.');
    }
    if (Math.abs(sumScores(p1) - 24) > 0.001) {
      warnings.push('Сумма баллов первого плана не равна 24. Для реального прохождения это признак неполных данных.');
    }
    if (Math.abs(sumScores(p2) - 24) > 0.001) {
      warnings.push('Сумма баллов второго плана не равна 24. Для реального прохождения это признак неполных данных.');
    }

    var result = {
      version: VERSION,
      config: cfg,
      input: { p1: p1, p2: p2 },
      selection: selection,
      convertedSecond: scores.q,
      effective: scores.e,
      axes: axes,
      circle: circle,
      pavlov: pavlov,
      leading: leading,
      pair: pair,
      warnings: warnings
    };
    result.text = buildText(result, cfg);
    return result;
  }

  function formatResultText(result) {
    return result && result.text ? result.text.full : '';
  }

  return {
    VERSION: VERSION,
    POLES: POLES,
    FACTORS: FACTORS,
    FACTOR_META: FACTOR_META,
    POLE_TEXT: POLE_TEXT,
    PAIR_TEXT: PAIR_TEXT,
    TYPE_TEXT: TYPE_TEXT,
    SECTORS: SECTORS,
    POLE_GEOMETRY: POLE_GEOMETRY,
    AXIS_ANGLES: AXIS_ANGLES,
    TYPE_BY_SECTOR: TYPE_BY_SECTOR,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    DISCLAIMER: DISCLAIMER,
    analyze: analyze,
    convertSecond: convertSecond,
    selectScales: selectScales,
    effectiveScores: effectiveScores,
    computeAxes: computeAxes,
    computeCircle: computeCircle,
    getWeightMatrix: getWeightMatrix,
    renderCircleSVG: renderCircleSVG,
    classifyPavlov: classifyPavlov,
    formatResultText: formatResultText
  };
});

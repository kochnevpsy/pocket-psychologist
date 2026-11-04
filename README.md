# Карманный психолог

Открытое приложение для саморегуляции и самопомощи: тест Сонди, дыхательные
практики, дневник, трекер состояния и работа с мыслями. Работает полностью
офлайн, без рекламы, аналитики и регистрации.

- Лицензия: [MIT](LICENSE)
- Ассеты и их лицензии: [ASSETS.md](ASSETS.md)
- Метадата для каталога F-Droid: [fastlane/](fastlane/metadata/android/)
- Готовая заготовка метадаты fdroiddata: [f-droid/com.pocket_psychologist.yml](f-droid/com.pocket_psychologist.yml)

## Быстрый запуск в браузере

Приложение статическое, сборка не требуется:

```bash
python3 -m http.server 8000
```

Откройте `http://localhost:8000`. Подойдёт любой современный браузер.

## Приватность

- Приложение не запрашивает разрешение `INTERNET` и не делает сетевых запросов:
  шрифты, аудио и изображения поставляются внутри.
- Нет рекламы, трекеров, аналитики и сторонних SDK.
- Все записи хранятся только на устройстве, в `localStorage` браузера или
  WebView. Экспорт — только по явной команде пользователя, в файл на устройстве.
- Резервное копирование данных приложения средствами Android отключено
  (`android:allowBackup="false"`), чтобы дневник не попадал в облако.

Ключи хранилища: `pocket_psy_diary_v1` (дневник), `szondi_history_tests`
(история тестов), `pocket_psy_thoughts_user`, `pocket_psy_user_tracker_entries`,
`pocket_psy_custom_coping`, `kp_design_theme` и настройки интерфейса.

## Структура

- `index.html` — интерфейс приложения.
- `app.js` — логика модулей и экспорт данных.
- `diary.js`, `diary.css` — личный дневник.
- `data.js`, `celebrities.js`, `szondi-ito-pavlov.js` — данные и алгоритмы Сонди.
- `styles.css`, `design.css`, `design-dark.css` — оформление.
- `fonts.css`, `fonts/` — локальные копии шрифтов (OFL 1.1).
- `motion.js` — библиотека анимаций (MIT).
- `audio/`, `portraits/` — медиаматериалы приложения.
- `android/` — Gradle-проект WebView-обёртки.

## Сборка Android

```bash
cd android
gradle assembleRelease
```

Требуется JDK 17+, Android SDK (API 36) и Gradle 8.11.1+. Веб-файлы
копируются в assets автоматически на этапе `preBuild`. Подробности и
требования — в [android/README.md](android/README.md).

Ключи подписи, пароли и готовые сборки в репозиторий намеренно не включены.

## Публикация в F-Droid

1. Репозиторий публичный, лицензия FOSS — есть.
2. Метадата описаний лежит в `fastlane/metadata/android/` (`ru-RU`, `en-US`).
3. Версия в `android/app/build.gradle.kts` (`versionCode 7`, `versionName 1.4`)
   помечена тегом `v1.4`.
4. Метадата для сборки — [f-droid/com.pocket_psychologist.yml](f-droid/com.pocket_psychologist.yml).
   Её нужно добавить в форк [fdroiddata](https://gitlab.com/fdroid/fdroiddata)
   как `metadata/com.pocket_psychologist.yml` и открыть Merge Request с меткой
   **New App**.

Приложение не содержит `NonFreeAssets`, `NonFreeNet`, `Tracking` и `Ads`:
сетевых сервисов нет, все ассеты свободные, сторонних проприетарных
зависимостей нет.

## Оговорка

Приложение не заменяет психотерапию и не ставит диагноз. При острых состояниях
обратитесь к специалисту или в службу экстренной помощи.

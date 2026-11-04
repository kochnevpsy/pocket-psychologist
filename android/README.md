# Android-обёртка (Gradle)

Здесь лежит исходник WebView-обёртки. Веб-приложение из корня репозитория
попадает в APK автоматически: Gradle-задача `copyWebAssets` копирует
`index.html`, `*.js`, `*.css`, `audio/`, `portraits/` и `fonts/` в
`app/src/main/assets/` на этапе `preBuild`. В git эта папка не хранится
(см. [.gitignore](../.gitignore)).

## Требования

- JDK 17+
- Android SDK с платформой API 36 и build-tools 36.x
- Gradle 8.11.1 или новее (или Android Studio, она подставит свой Gradle)
- Android Gradle Plugin 8.10.1 (скачивается с Google Maven автоматически)

## Сборка из командной строки

```bash
cd android
gradle assembleRelease
```

APK появится в `app/build/outputs/apk/release/`.

Путь к SDK задайте одним из способов: переменной `ANDROID_HOME` или файлом
`local.properties` со строкой `sdk.dir=/путь/к/Android/Sdk` (файл в git не
попадает).

## Версия приложения

`applicationId`, `versionCode` и `versionName` задаются только в
[app/build.gradle.kts](app/build.gradle.kts) — так их читает F-Droid при
проверке обновлений. В `AndroidManifest.xml` этих полей намеренно нет.

При выпуске новой версии: поднимите `versionCode` и `versionName`, закоммитьте
и поставьте тег `v<versionName>` — например `v1.5`.

## Подпись

Готовый APK подписывается вашим ключом (`apksigner` или `signingConfigs`).
Ключи, пароли и файлы сборки в репозиторий не добавляются. F-Droid собирает и
подписывает APK сам, свой ключ там не нужен.

Важно: сборка F-Droid подписана другим ключом, поэтому она не встанет
обновлением поверх APK, подписанного вашим ключом, — потребуется переустановка.

plugins {
    id("com.android.application")
}

android {
    namespace = "com.pocket_psychologist"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.pocket_psychologist"
        minSdk = 26
        targetSdk = 36
        // F-Droid читает эти две строки для проверки обновлений — держите их в виде простых литералов.
        versionCode = 7
        versionName = "1.4"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Корень репозитория: там лежит само веб-приложение (index.html, *.js, *.css, audio/, portraits/).
val webRoot = rootProject.projectDir.parentFile
val generatedAssetsDir = layout.projectDirectory.dir("src/main/assets")

// Исходники веб-приложения не дублируются в git: они копируются в assets при сборке.
val copyWebAssets by tasks.registering(Copy::class) {
    description = "Копирует статическое веб-приложение из корня репозитория в assets APK."
    group = "build"
    from(webRoot) {
        include("index.html", "*.js", "*.css")
        include("audio/**", "portraits/**", "fonts/**")
    }
    into(generatedAssetsDir)
}

tasks.named("preBuild").configure {
    dependsOn(copyWebAssets)
}

tasks.named("clean").configure {
    doLast {
        project.delete(generatedAssetsDir.asFile)
    }
}

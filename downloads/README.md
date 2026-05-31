# Downloads NaruStream

Ce dossier contient les fichiers de téléchargement pour l'application NaruStream sur différentes plateformes.

## Plateformes disponibles

- **Windows** (EXE)
- **Android** (APK & Android TV)
- **iOS** (IPA & Apple TV)

## Instructions de build (pour développeurs)

### Prérequis
- Node.js & npm
- Pour Android : Android Studio + Android SDK
- Pour iOS : macOS + Xcode
- Pour Windows : Electron Builder (inclus)

### Build Android APK
1. Ouvrir le projet Android : `npm run cap:android`
2. Dans Android Studio, Build > Generate Signed Bundle / APK
3. Choisir "APK" et suivre les étapes de signature

### Build Windows EXE
1. `npm run electron:build`
2. Le fichier EXE se trouvera dans le dossier `dist/`

### Build iOS IPA
1. Ouvrir le projet iOS : `npm run cap:ios`
2. Dans Xcode, Product > Archive
3. Distribuer l'appli (TestFlight ou Ad Hoc)

### Android TV / Apple TV
- Pour Android TV : Dans AndroidManifest.xml, ajouter `android:banner="@android.intent.category.LEANBACK_LAUNCHER"
- Pour Apple TV : Configurer target tvOS dans Xcode

## Instructions d'installation

### Windows
1. Téléchargez le fichier EXE depuis le site web NaruStream
2. Double-cliquez dessus pour lancer l'installateur
3. Suivez les instructions à l'écran

### Android
1. Téléchargez le fichier APK depuis le site web NaruStream
2. Activez les "Sources inconnues" dans les paramètres de votre téléphone
3. Ouvrez le fichier APK pour l'installer

### iOS
1. Téléchargez le fichier IPA depuis le site web NaruStream
2. Utilisez TestFlight ou un outil de signature d'IPA pour installer l'application sur votre appareil

## Liens de téléchargement

Les liens de téléchargement actuels pointent vers le dépôt GitHub principal :
https://github.com/narutouzmk65/NaruStream

# Guide Facile - Compiler les apps NaruStream

---

## 🚀 LA SOLUTION LA PLUS SIMPLE : GitHub Actions (Rien à installer !)
GitHub compile **automatiquement** l'EXE Windows et l'APK Android pour toi ! 🎉

### Comment ça marche ?
1. Tu pushes du code sur la branche `main` de GitHub
2. GitHub lance automatiquement un "workflow" pour compiler les apps
3. Tu télécharges les fichiers prêts depuis GitHub !

### Étapes pour récupérer les fichiers :
1. Ouvre ton repo → https://github.com/narutouzmk65/NaruStream
2. Clique sur l'onglet `Actions` (à côté de Pull requests)
3. Clique sur le workflow le plus en haut ("Build NaruStream")
4. Descends jusqu'à la section `Artifacts` → clique sur `narustream-windows` ou `narustream-android` pour télécharger !
5. Tu as tes fichiers prêts à utiliser !

---

## 🔴 Déjà prêt : Windows EXE !
L'EXE est trop gros pour GitHub, donc tu peux le trouver dans ton dossier :
👉 `dist\NaruStream Setup 1.0.0.exe`

Pour le mettre à disposition de tout le monde, utilise **GitHub Releases** :
1. Aller sur ton repo GitHub → https://github.com/narutouzmk65/NaruStream
2. Clique sur "Releases" (à droite)
3. Clique sur "Draft a new release"
4. Clique sur "Choose a tag" et tape `v1.0.0`, puis clique sur "Create new tag"
5. Dans "Release title", écrit `NaruStream v1.0.0`
6. Descends à "Attach binaries" → glisse-dépose ton fichier `dist\NaruStream Setup 1.0.0.exe`
7. Clique sur "Publish release"

---

## 📱 Pour Android APK (si tu veux compiler sur ton PC)
### Étape 1 : Installer Java JDK 17
1. Ouvre Chrome → https://adoptium.net/temurin/releases/?version=17
2. Clique sur le bouton `Windows x64 .msi`
3. Double-clique sur le fichier téléchargé → clique sur "Next" → "Next" → "Install" → attends que ça termine → "Finish"

### Étape 2 : Installer Android Studio
1. Ouvre Chrome → https://developer.android.com/studio
2. Clique sur "Download Android Studio" → coche la case "I have read and agree with the above terms and conditions" → clique sur "Download Android Studio for Windows"
3. Double-clique sur le fichier téléchargé → clique sur "Next" → "Next" → "Next" → "Install" → attends → "Finish"
4. Quand Android Studio s'ouvre, choisis "Standard" → "Next" → "Next" → "Finish" → attends que tous les outils se téléchargent (ça peut prendre 5-10 minutes)

### Étape 3 : Générer l'APK !
1. Ouvre un terminal PowerShell dans ton dossier NaruStream (celui où il y a `package.json`)
2. Tape cette commande et appuie sur Entrée :
   ```powershell
   npm run cap:android
   ```
3. Android Studio s'ouvre !
4. En haut à gauche, clique sur le menu `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
5. Attends que ça compile (ça prend 1-2 minutes la première fois)
6. Quand c'est fini, une notification apparaît en bas à droite → clique sur `locate`
7. Tu as ton APK ! Le fichier s'appelle `app-debug.apk`

### Étape 4 : Installer l'APK sur ton téléphone
1. Sur ton téléphone Android : `Paramètres` → `À propos du téléphone` → clique 7 fois sur `Numéro de build` (ça active le mode développeur)
2. Retourne dans `Paramètres` → `Options pour les développeurs` → active `Sources inconnues`
3. Transfère le fichier `app-debug.apk` sur ton téléphone
4. Ouvre le fichier sur ton téléphone → clique sur `Installer`

---

## 🍎 Pour iOS IPA (SEULEMENT SI TU AS UN MAC)
### Étape 1 : Installer Xcode
1. Ouvre l'App Store sur ton Mac → recherche "Xcode" → clique sur "Obtenir" / "Installer"
2. Attends que Xcode s'installe (c'est un gros fichier, ça peut prendre du temps)
3. Ouvre Xcode une fois → clique sur "Agree" → entre ton mot de passe si nécessaire

### Étape 2 : Générer l'IPA !
1. Ouvre un terminal sur ton Mac dans ton dossier NaruStream
2. Tape cette commande et appuie sur Entrée :
   ```bash
   npm run cap:ios
   ```
3. Xcode s'ouvre !
4. En haut à gauche, sélectionne "Any iOS Device" (à côté du bouton Play)
5. En haut, clique sur le menu `Product` → `Archive`
6. Attends que ça compile
7. Quand c'est fini, une fenêtre s'ouvre → clique sur `Distribute App` → `Ad Hoc` → `Next` → `Next` → `Export`
8. Choisis où sauvegarder l'IPA → tu as ton fichier !

---

## 📺 Pour Android TV / Apple TV
- **Android TV** : Dans Android Studio, tu peux configurer l'app pour TV (mais c'est plus complexe)
- **Apple TV** : Dans Xcode, tu peux changer la cible pour tvOS

---

## Liens utiles
- Android Studio : https://developer.android.com/studio
- Java JDK 17 : https://adoptium.net/temurin/releases/?version=17
- Xcode (App Store) : https://apps.apple.com/fr/app/xcode/id497799835?mt=12


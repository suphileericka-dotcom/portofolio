# Publier la nouvelle icône Android

Le projet TWA est `bubblewrap-twa/`, pas `android/` (Capacitor).
L'image source est `assets/Whimsical Forest Village App Icon.png`.
Les icônes classiques ont les tailles 48, 72, 96, 144 et 192 px.
Les calques adaptatifs ont les tailles 108, 162, 216, 324 et 432 px,
avec l'illustration réduite dans la région centrale de 66 dp et un fond blanc.
Android choisit le contour final. Le visuel est le même que celui fourni
pour le Play Store, mais le masque du téléphone peut différer.

Identifiant conservé : `com.suphileericka.bosquetlent`.
Clé existante conservée : `bubblewrap-twa/android.keystore`, alias `upload`.
Ne pas créer de nouvelle clé. Avec Play App Signing, Google conserve sa clé
de signature de distribution ; le fichier AAB utilise la clé d'import existante.

## Version

La version locale actuelle est `versionCode 4`, `versionName 1.0.3`.
Avant publication, choisir un code supérieur au plus grand code déjà importé
dans Play Console, tous canaux confondus. Si ce maximum est 4, utiliser 5.

Modifier uniquement ces champs :

- `bubblewrap-twa/app/build.gradle` : `versionCode 5`, `versionName "1.0.4"`.
- `bubblewrap-twa/twa-manifest.json` : `appVersionCode: 5`,
  `appVersionName: "1.0.4"`, `appVersion: "1.0.4"`.

## Générer l'AAB avec la configuration Gradle existante

Dans PowerShell :

```powershell
Set-Location C:\Users\portofolio
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/update-twa-icons.ps1
Set-Location bubblewrap-twa
$env:BOSQUET_KEYSTORE_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mot de passe du keystore existant' -AsSecureString)).Password
$env:BOSQUET_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', (Read-Host 'Mot de passe de la cle upload' -AsSecureString)).Password
try {
    .\gradlew.bat bundleRelease --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Echec de generation AAB' }
} finally {
    Remove-Item Env:BOSQUET_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:BOSQUET_KEY_PASSWORD -ErrorAction SilentlyContinue
}
```

Résultat : `bubblewrap-twa/app/build/outputs/bundle/release/app-release.aab`.
Ne pas utiliser l'ancien AAB présent à la racine du dépôt.

Il n'est pas nécessaire de lancer `bubblewrap update` pour ce remplacement.
Cette commande régénère le projet et les images à partir des URL du manifeste.
Si elle est utilisée ultérieurement, réappliquer le script d'icônes après
la régénération et vérifier que la configuration Gradle de signature existante
est toujours présente avant de construire la release.

Importer le nouvel AAB dans une release de test interne Play Console,
puis installer ou mettre à jour depuis Google Play et vérifier l'icône
sur l'écran d'accueil. Publier ensuite sur le canal voulu.
Changer uniquement l'icône de la fiche Play Store ne modifie pas celle
embarquée dans une application déjà installée.

Les ressources d'icône sont suivies dans Git. Le reste du dossier
`bubblewrap-twa/` reste ignoré. Le script permet de réappliquer les icônes
après une régénération ; conserver le projet et le keystore dans les
sauvegardes habituelles.

Références :
- https://developer.android.com/develop/ui/views/launch/icon_design_adaptive
- https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md

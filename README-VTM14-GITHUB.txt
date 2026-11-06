VTM14 — VERSION CORRIGÉE POUR GITHUB PAGES

PUBLICATION
1. Décompresser cette archive.
2. Envoyer le CONTENU du dossier afterglow-web-main à la racine du dépôt GitHub Pages.
3. Vérifier que index.html, launch.js, style.css, jb.html, core.js et les fichiers .bin sont à la racine.
4. Ne pas envoyer de codes privés, de clés d'administration ou de secrets.

CORRECTION DE LICENCE
- Après une première validation HTTP réussie, l'application enregistre un état d'activation local.
- Les démarrages suivants utilisent cet état local : aucun nouvel appel au serveur et aucune nouvelle saisie du code.
- La version précédente enregistrait le code après validation ; cette version migre cet état vers le nouveau format sans renvoyer le code au serveur.
- Le code en clair est supprimé du stockage local après conversion/activation.
- Le manifeste AppCache obsolète a été retiré afin d'éviter de conserver une ancienne version des scripts.

LIMITES IMPORTANTES
- Le stockage est lié au profil/navigateur et à son stockage local, pas à une identité matérielle inviolable.
- Effacer les données du navigateur, réinitialiser l'environnement ou changer de profil peut supprimer l'activation locale.
- Un indicateur local peut être modifié par un utilisateur techniquement avancé. Cette version privilégie le démarrage hors connexion et la non-réapparition du formulaire ; elle ne constitue pas un DRM inviolable.
- Le serveur d'activation doit être déployé et répondre en HTTP 2xx à la première activation. L'URL API est définie dans launch.js.
- Cette archive ne contient pas de backend Cloudflare prêt à déployer et ne modifie pas la base de codes distante.

DÉMARRAGE
Le lancement du payload reste celui du projet d'origine : jb.html?log=1&afterglow=run&mode=goldhen.

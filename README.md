# L’Mohad Store

Boutique React + Vite avec Supabase (base de données, authentification et stockage des photos). Le projet conserve l’interface existante et ajoute la modification des produits, le stock, les tailles, les couleurs, la modification des catégories et les mises à jour en direct.

## 1. Créer et configurer Supabase

1. Créez un projet sur https://supabase.com.
2. Ouvrez **SQL Editor → New query**, copiez tout le fichier `supabase.sql`, puis cliquez sur **Run**.
3. Ouvrez **Authentication → Sign In / Providers → Email** et désactivez l'inscription publique (**Allow new users to sign up**).
4. Dans **Authentication → Users → Add user**, créez le compte du propriétaire avec son email et un mot de passe fort.
5. Dans **SQL Editor**, exécutez la requête ci-dessous en remplaçant l'adresse par l'email exact du compte créé :

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'OWNER_EMAIL_HERE'
on conflict (user_id) do nothing;
```

Cette étape est obligatoire : un utilisateur authentifié qui n'est pas dans `admin_users` ne peut pas administrer la boutique.

6. Ouvrez **Project Settings → API** (ou **API Keys**) et copiez le Project URL et la clé publique `anon` / `publishable`. Ne copiez jamais la `service_role` / `secret` key dans le site.

## 2. Variables d'environnement

À la racine du projet, copiez `.env.example` vers `.env` et remplissez :

```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE_ANON
```

La clé publique est destinée au navigateur ; la sécurité dépend des règles RLS configurées par `supabase.sql`. La clé privée `service_role` ne doit jamais être ajoutée à `.env` côté Vite.

## 3. Tester sur votre ordinateur

Installez Node.js LTS, puis dans le dossier du projet :

```bash
npm install
npm run dev
```

Ouvrez l'adresse locale indiquée par Vite. Testez la connexion admin, ajoutez un produit, modifiez-le, changez le stock, créez une catégorie et vérifiez la boutique publique.

## 4. Déploiement permanent sur Vercel

1. Créez un dépôt GitHub privé ou public et envoyez-y le contenu du dossier du projet (ne téléversez jamais `.env`).
2. Sur https://vercel.com, choisissez **Add New → Project**, puis importez ce dépôt.
3. Framework : Vite. Build command : `npm run build`. Output directory : `dist`.
4. Dans **Environment Variables**, ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs du projet Supabase.
5. Cliquez sur **Deploy**. Vercel attribuera une adresse `*.vercel.app`. Cette même adresse de production reste attachée au projet lors des déploiements suivants.

## 5. Utilisation quotidienne

- Le propriétaire ouvre l'adresse publique, clique sur le cadenas, puis se connecte à `/login`.
- Dans **Administration → Produits**, il peut ajouter, modifier ou supprimer les produits, gérer le prix, la description, la catégorie, le stock, les tailles, les couleurs et les photos.
- Dans **Administration → Catégories**, il peut créer, renommer et supprimer des catégories.
- Les changements de produits et catégories sont enregistrés dans Supabase et diffusés par Realtime ; un rafraîchissement automatique de secours est également activé. Ces changements ne demandent pas de nouveau déploiement.
- Pour modifier le code ou le design, envoyez les changements sur la branche de production du dépôt GitHub. Vercel lancera automatiquement un nouveau déploiement sur la même adresse.

## 6. À savoir

- Ce ZIP n'est pas un site déjà publié. Il faut créer et configurer les comptes Supabase, GitHub et Vercel puis effectuer le premier déploiement.
- Le comportement en production doit être vérifié après la configuration réelle : ajout/modification/suppression, Realtime, photos, authentification et domaine final.
- Les produits qui existaient uniquement dans une ancienne version locale ne sont pas importés automatiquement. Ajoutez-les via le tableau de bord ou préparez un import séparé. Après la migration, vérifiez le stock de chaque ancien produit : les nouvelles colonnes de stock sont initialisées à zéro pour éviter de vendre un article dont la quantité est inconnue.
- Les commandes WhatsApp ouvrent un message prérempli. Le client confirme lui-même la commande dans WhatsApp.

#  SmartClinic

SmartClinic est une plateforme web moderne de gestion clinique assistée par IA.  

Elle permet la gestion complète des patients, praticiens, rendez-vous, notes SOAP et notifications automatiques.

---

#  Stack technique

- Frontend : React + TypeScript + Vite + Tailwind
- Backend : Django + Django REST Framework
- Base de données : PostgreSQL
- IA : OpenAI API (génération de notes SOAP)
- Authentification : Session Django + CSRF

---

#  1. Prérequis

Avant de lancer le projet, installez :
- Python 3.11+
- Node.js 18+
- npm
- PostgreSQL
- Git

Vérification :
```bash
python --version
node --version
npm --version
psql --version

------

# 2. Strucuture du projet

SmartClinic/
│
├── Backend/
├── Frontend/
├── Docs/
├── .env 
└── README.md

-----

# 3. Base de données PostgreSQL

-- Installer Postgresql et créer la base de données
CREATE DATABASE smartclinic\_db;


# Configuration Backend

--Après avoir clôné le projet
Se placer dans le repertoire backend : cd Backend
Créer l'environnement virtuel : python -m venv .venv
Activer l'environnement : .venv\\Scripts\\Activate.ps1
Installer les dépendances : pip install -r requirements.txt
Si requirements.txt n'existe pas encore, exécuter ce qui suit pour installer les dépendances : pip install django djangorestframework psycopg\[binary] python-dotenv openai

----

# 5. Fichier .env

Créer le fichier .env à la racine du projet et entrer les données ci-dessous

SECRET\_KEY=django-secret-key

DEBUG=True


DB\_NAME=smartclinic\_db
DB\_USER=postgres
DB\_PASSWORD=qwerty
DB\_HOST=localhost
DB\_PORT=5432

OPENAI\_API\_KEY=votre\_clé\_open\_ai

EMAIL\_HOST=smtp.gmail.com
EMAIL\_PORT=587
EMAIL\_HOST\_USER=smartclinic@gmail.com #cette adresse doit correspondre à celle du serveur de notification
EMAIL\_HOST\_PASSWORD=mot\_de\_passe\_application
EMAIL\_USE\_TLS=True
DEFAULT\_FROM\_EMAIL=smartclinic@gmail.com

----

# 6. Migration

Effectuer les migration en exécutant la commande suivante : python manage.py migrate

----

# 7. Compte admin

Créer un compte administrateur via la commande : python manage.py createsuperuser

----

# 8. Lancer le Backend

Exécuter : python manage.py runserver
Utiliser l'URL suivante au niveau du navigateur : http://127.0.0.1:8000/api/

----

# 9. Configuration Frontend

--Après avoir clôné le projet
Se placer dans le repertoire frontend : cd Frontend
Installer l'environnement : npm install
Vérification l'API. Dans src/services/apiClient.ts , vérifier l'existance du Backend tel que : const API\_BASE\_URL = "http://localhost:8000/api";
Lancer ensuite le frontend en exécutant : npm run dev
Utiliser l'URL suivant : http://localhost:5173

----

# 10. Fonctionnalités

-- Patient
inscription / connexion
réservation
annulation / reprogrammation
consultation dossier

-- Praticien
agenda
rendez-vous du jour
notes SOAP
génération IA
transcription audio

--Admin
gestion services
gestion praticiens
gestion patients
dashboard
audit
paramètres

----

# 11. Notifications

Emails envoyés :
confirmation RDV
annulation
création praticien
note SOAP ajoutée/modifiée
rappel RDV 24h
rappel SOAP quotidien
Commande manuelle : python manage.py send\_appointment\_reminders

----

# 12. Tests automatiques

Arrêter le serveur backend avant, et exécuter les commandes ci-dessous
python manage.py test apps.accounts.tests
python manage.py test apps.appointments.tests


import { Link } from "react-router-dom";

export default function Accueil() {
  return (
    <div className="min-h-screen scroll-smooth bg-[#f6f1e8] text-[#0f172a]">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-16 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl animate-pulse" />
        <div className="absolute right-[8%] top-[24rem] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl animate-pulse [animation-delay:1200ms]" />
        <div className="absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-300/10 blur-3xl animate-pulse [animation-delay:2400ms]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f6f1e8]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 font-semibold">
            <span className="inline-block h-8 w-8 rounded-full bg-teal-500 shadow-[0_8px_24px_rgba(20,184,166,0.35)]" />
            <span className="text-xl tracking-tight">SmartClinic</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-black/70 md:flex">
            <a
              href="#features"
              className="transition hover:text-black hover:-translate-y-[1px]"
            >
              Fonctionnalités
            </a>
            <a
              href="#solutions"
              className="transition hover:text-black hover:-translate-y-[1px]"
            >
              Solutions
            </a>
            <a
              href="#pricing"
              className="transition hover:text-black hover:-translate-y-[1px]"
            >
              Tarifs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-black/10 bg-white/60 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white"
            >
              Connexion clinique
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(20,184,166,0.28)] transition hover:-translate-y-[1px] hover:bg-teal-600"
            >
              Inscription
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="relative overflow-hidden pb-16 pt-16 md:pb-20 md:pt-20">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-teal-500/15 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 shadow-sm backdrop-blur">
              Plateforme clinique moderne
            </div>

            <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-semibold tracking-tight md:text-6xl">
              Gérez votre clinique.
              <br />
              <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Laissez l’IA rédiger les notes.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-black/60 md:text-lg">
              SmartClinic réunit rendez-vous, gestion clinique, portails par
              rôle, notes SOAP assistées par IA et suivi administratif dans une
              expérience fluide, moderne et professionnelle.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-teal-500 px-6 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(20,184,166,0.28)] transition hover:-translate-y-[1px] hover:bg-teal-600"
              >
                Ouvrir une nouvelle clinique
              </Link>

              <a
                href="#demo"
                className="rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-white"
              >
                Voir la démo
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-black/55">
              <span className="rounded-full border border-black/10 bg-white/60 px-4 py-2 shadow-sm">
                Rendez-vous intelligents
              </span>
              <span className="rounded-full border border-black/10 bg-white/60 px-4 py-2 shadow-sm">
                Notes SOAP assistées
              </span>
              <span className="rounded-full border border-black/10 bg-white/60 px-4 py-2 shadow-sm">
                Portail patient, praticien et admin
              </span>
            </div>
          </div>
        </section>

        {/* Hero preview */}
        <section className="pb-20">
          <div className="mx-auto max-w-5xl rounded-[30px] border border-black/10 bg-white/60 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0f766e] via-[#0b4a46] to-[#0b2527] p-5 md:p-8">
              <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" />

              <div className="relative grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
                <div className="animate-[fadeInUp_0.7s_ease-out]">
                  <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                    Aperçu SmartClinic
                  </div>

                  <h2 className="mt-4 max-w-xl text-2xl font-semibold text-white md:text-3xl">
                    Une interface claire pour piloter l’activité de la clinique
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
                    Visualisez les rendez-vous, organisez les tâches du jour,
                    rédigez les notes SOAP, gérez les praticiens et gardez une
                    vue cohérente sur l’ensemble de la plateforme.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <MetricCard label="Rendez-vous" value="Suivi fluide" />
                    <MetricCard label="Notes SOAP" value="IA intégrée" />
                    <MetricCard label="Admin" value="Contrôle global" />
                  </div>
                </div>

                <div className="animate-[fadeInUp_0.9s_ease-out] rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="rounded-2xl border border-white/10 bg-[#082220]/80 p-4 text-white shadow-inner">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-white/60">
                        Tableau de bord
                      </p>
                      <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] text-emerald-200">
                        En ligne
                      </span>
                    </div>

                    <div className="space-y-3">
                      <DashboardMiniBlock
                        title="Rendez-vous du jour"
                        desc="Confirmer, annuler ou terminer rapidement."
                      />
                      <DashboardMiniBlock
                        title="Notes SOAP"
                        desc="Créer et mettre à jour les notes assistées."
                      />
                      <DashboardMiniBlock
                        title="Gestion clinique"
                        desc="Patients, praticiens, services et paramètres."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 pb-20">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
              Fonctionnalités
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Un socle complet pour la gestion clinique
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-black/60">
              SmartClinic vous aide à gagner du temps, structurer votre activité
              et offrir une meilleure expérience au sein de la clinique.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PremiumFeatureCard
              title="Réservation intelligente"
              desc="Organisation des créneaux, limitation des conflits et prise de rendez-vous plus fluide."
            />
            <PremiumFeatureCard
              title="Notes SOAP avec IA"
              desc="Aide à la rédaction clinique pour accélérer la documentation et garder une structure claire."
            />
            <PremiumFeatureCard
              title="Notifications automatiques"
              desc="Réservations, confirmations, annulations et rappels envoyés au bon moment."
            />
            <PremiumFeatureCard
              title="Portails par rôle"
              desc="Une expérience distincte et adaptée pour les patients, les praticiens et l’administration."
            />
            <PremiumFeatureCard
              title="Gestion des praticiens"
              desc="Disponibilités, services attribués, agenda et suivi des activités du quotidien."
            />
            <PremiumFeatureCard
              title="Administration centralisée"
              desc="Tableau de bord, paramètres, audit et supervision depuis un espace unique."
            />
          </div>
        </section>

        {/* Solutions */}
        <section id="solutions" className="scroll-mt-24 pb-20">
          <div className="rounded-[30px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur md:p-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                Solutions
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Une solution pensée pour toute l’organisation de la clinique
              </h2>
              <p className="mt-4 text-black/60">
                SmartClinic accompagne les patients, les praticiens et
                l’administration avec une expérience unifiée et moderne.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <SolutionPanel
                title="Patients"
                desc="Réservation, consultation du portail, suivi des rendez-vous et meilleure lisibilité des informations."
              />
              <SolutionPanel
                title="Praticiens"
                desc="Agenda du jour, gestion des rendez-vous, notes SOAP et assistance IA pour gagner en efficacité."
              />
              <SolutionPanel
                title="Administration"
                desc="Gestion des services, praticiens, paramètres, audit et supervision des opérations."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 pb-20">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
              Tarifs
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Une présentation moderne de vos offres
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-black/60">
              Une base premium pour structurer la présentation commerciale de
              SmartClinic, ajustable selon votre modèle réel.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PricingPanel
              title="Essentiel"
              price="Sur demande"
              desc="Une base solide pour démarrer avec les fonctions principales."
              items={[
                "Gestion des rendez-vous",
                "Portail patient",
                "Portail praticien",
                "Support standard",
              ]}
            />

            <PricingPanel
              title="Professionnel"
              price="Sur demande"
              highlighted
              desc="Pour une clinique qui veut aller plus loin dans la productivité."
              items={[
                "Tout Essentiel",
                "Notes SOAP avec IA",
                "Notifications automatiques",
                "Gestion avancée",
              ]}
            />

            <PricingPanel
              title="Clinique+"
              price="Sur demande"
              desc="Pour des besoins élargis, une organisation plus grande ou plusieurs sites."
              items={[
                "Tout Professionnel",
                "Pilotage renforcé",
                "Accompagnement personnalisé",
                "Montée en charge facilitée",
              ]}
            />
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="scroll-mt-24 pb-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[30px] border border-black/10 bg-white/60 p-6 shadow-sm backdrop-blur md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                Démo
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Découvrez SmartClinic en quelques points
              </h2>
              <p className="mt-4 text-black/60">
                Une section de démo simple, claire et crédible pour guider
                rapidement les visiteurs vers l’essentiel.
              </p>

              <div className="mt-8 space-y-4">
                <DemoRow text="Connexion adaptée aux patients, praticiens et administrateurs" />
                <DemoRow text="Gestion des rendez-vous avec actions rapides et suivi quotidien" />
                <DemoRow text="Création et mise à jour des notes SOAP assistées par IA" />
                <DemoRow text="Pilotage global de la clinique via l’espace administratif" />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="rounded-full bg-teal-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-teal-600"
                >
                  Accéder à la plateforme
                </Link>
                <a
                  href="#contact"
                  className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium transition hover:bg-black/5"
                >
                  Demander une présentation
                </a>
              </div>
            </div>

            <div className="rounded-[30px] bg-[#0b2a28] p-6 text-white shadow-[0_24px_80px_rgba(11,42,40,0.24)] md:p-8">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm text-white/70">Vue SmartClinic</p>

                <div className="mt-5 space-y-4">
                  <PreviewBox
                    title="Agenda praticien"
                    desc="Vision claire des rendez-vous du jour et actions immédiates."
                  />
                  <PreviewBox
                    title="Notes SOAP"
                    desc="Documentation structurée et assistance intelligente."
                  />
                  <PreviewBox
                    title="Tableau de bord admin"
                    desc="Vue d’ensemble sur les services, praticiens et patients."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-20">
          <div className="overflow-hidden rounded-[34px] bg-gradient-to-r from-[#082c2b] via-[#0b2a28] to-[#103634] px-6 py-10 text-white shadow-[0_28px_90px_rgba(11,42,40,0.28)] md:px-10 md:py-12">
            <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                  Nouvelle clinique
                </p>
                <h3 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
                  Lancez votre espace SmartClinic avec une image moderne et une
                  gestion plus simple
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
                  Ouvrez votre clinique sur la plateforme, structurez vos
                  parcours internes et contactez rapidement notre équipe par
                  courriel pour échanger sur vos besoins.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/register"
                    className="rounded-full bg-teal-500 px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-[1px] hover:bg-teal-600"
                  >
                    Inscription nouvelle clinique
                  </Link>
                  <a
                    href="mailto:smartclinic08@gmail.com?subject=Demande%20d%27information%20SmartClinic"
                    className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
                  >
                    Contacter l’équipe
                  </a>
                </div>
              </div>

              <div className="grid gap-4">
                <GlassInfoCard
                  title="Sécurité"
                  desc="Une approche structurée avec bonnes pratiques et protection renforcée des données."
                />
                <GlassInfoCard
                  title="Contact rapide"
                  desc="Un accès direct par courriel pour poser vos questions et demander une présentation."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact réel et rapide */}
        <section id="contact" className="scroll-mt-24 pb-16">
          <div className="rounded-[30px] border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur md:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">
                Contact
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Un espace de contact simple, réel et rapide
              </h2>
              <p className="mt-4 text-black/60">
                Pour une prise de contact immédiate, utilisez directement
                l’adresse courriel officielle de SmartClinic. Cette zone sert de
                point d’entrée rapide pour les cliniques intéressées.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <ContactPremiumCard
                title="Nouvelle clinique"
                desc="Créer un compte et démarrer votre espace SmartClinic."
                buttonLabel="Créer un compte"
                to="/register"
              />

              <RealContactCard
                title="Nous écrire"
                desc="Pour toute demande commerciale, présentation ou question sur la plateforme."
                email="smartclinic08@gmail.com"
                subject="Demande d'information SmartClinic"
              />

              <ContactLinkCard
                title="Voir la démo"
                desc="Revenir à la section de démonstration et revoir les principaux usages de la plateforme."
                buttonLabel="Accéder à la démo"
                href="#demo"
              />
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-sm text-black/50">
          © {new Date().getFullYear()} SmartClinic — Québec
        </footer>
      </main>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function PremiumFeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white/75 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)]">
      <div className="h-12 w-12 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/15 to-emerald-400/10" />
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-black/60">{desc}</p>
    </div>
  );
}

function SolutionPanel({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-[#faf7f1] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
        {title}
      </p>
      <p className="mt-4 text-sm leading-7 text-black/65">{desc}</p>
    </div>
  );
}

function PricingPanel({
  title,
  price,
  desc,
  items,
  highlighted = false,
}: {
  title: string;
  price: string;
  desc: string;
  items: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border p-6 shadow-sm transition duration-300 hover:-translate-y-1 ${
        highlighted
          ? "border-teal-500 bg-white ring-2 ring-teal-500/15 shadow-[0_20px_44px_rgba(20,184,166,0.10)]"
          : "border-black/10 bg-white/75 hover:shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
      }`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
        {title}
      </p>
      <p className="mt-4 text-3xl font-semibold">{price}</p>
      <p className="mt-4 text-sm leading-7 text-black/60">{desc}</p>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-teal-500" />
            <span className="text-sm text-black/70">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a
          href="#contact"
          className={`inline-flex rounded-full px-5 py-2.5 text-sm font-medium ${
            highlighted
              ? "bg-teal-500 text-white hover:bg-teal-600"
              : "border border-black/10 hover:bg-black/5"
          }`}
        >
          En savoir plus
        </a>
      </div>
    </div>
  );
}

function DemoRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-teal-500" />
      <p className="text-sm leading-7 text-black/70">{text}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-white backdrop-blur">
      <p className="text-xs text-white/65">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DashboardMiniBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-6 text-white/70">{desc}</p>
    </div>
  );
}

function PreviewBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-xs leading-6 text-white/70">{desc}</p>
    </div>
  );
}

function GlassInfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur transition hover:bg-white/[0.10]">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7 text-white/75">{desc}</p>
    </div>
  );
}

function ContactPremiumCard({
  title,
  desc,
  buttonLabel,
  to,
}: {
  title: string;
  desc: string;
  buttonLabel: string;
  to: string;
}) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-black/60">{desc}</p>

      <div className="mt-6">
        <Link
          to={to}
          className="inline-flex rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-600"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}

function RealContactCard({
  title,
  desc,
  email,
  subject,
}: {
  title: string;
  desc: string;
  email: string;
  subject: string;
}) {
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-black/60">{desc}</p>

      <div className="mt-6 space-y-3">
        <a
          href={href}
          className="inline-flex rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition hover:bg-black/5"
        >
          Envoyer un courriel
        </a>

        <div className="rounded-2xl border border-teal-500/15 bg-teal-500/5 px-4 py-3 text-sm text-black/70">
          <span className="font-medium text-black">Email :</span>{" "}
          <a
            href={`mailto:${email}`}
            className="text-teal-700 underline underline-offset-2"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}

function ContactLinkCard({
  title,
  desc,
  buttonLabel,
  href,
}: {
  title: string;
  desc: string;
  buttonLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-black/60">{desc}</p>

      <div className="mt-6">
        <a
          href={href}
          className="inline-flex rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium hover:bg-black/5"
        >
          {buttonLabel}
        </a>
      </div>
    </div>
  );
}

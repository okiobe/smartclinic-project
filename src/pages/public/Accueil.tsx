import { Link } from "react-router-dom";

export default function Accueil() {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#0f172a]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#f6f1e8]/80 backdrop-blur border-b border-black/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-7 w-7 rounded-full bg-teal-500" />
            SmartClinic
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-black/70">
            <a className="hover:text-black" href="#features">
              Fonctionnalités
            </a>
            <a className="hover:text-black" href="#solutions">
              Solutions
            </a>
            <a className="hover:text-black" href="#pricing">
              Tarifs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full px-4 py-2 text-sm border border-black/10 hover:bg-black/5"
            >
              Connexion clinique
            </Link>
            <Link
              to="/booking"
              className="rounded-full px-4 py-2 text-sm bg-teal-500 text-white hover:bg-teal-600"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="pt-14 pb-10 text-center">
          <p className="text-xs font-medium text-black/60">SmartClinic</p>

          <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight">
            Gérez votre clinique.
            <br />
            <span className="text-teal-500">
              Laissez l’IA rédiger les notes.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-black/60">
            Plateforme tout-en-un de gestion clinique pour les professionnels de
            la santé : réservation intelligente, notes SOAP assistées par IA et
            gestion simplifiée.
          </p>

          <div className="mt-7 flex justify-center gap-3">
            <Link
              to="/booking"
              className="rounded-full px-5 py-2.5 text-sm bg-teal-500 text-white hover:bg-teal-600"
            >
              Commencer
            </Link>
            <button className="rounded-full px-5 py-2.5 text-sm border border-black/10 hover:bg-black/5">
              Voir la démo
            </button>
          </div>
        </section>

        {/* Hero visual */}
        <section className="pb-16">
          <div className="mx-auto max-w-5xl rounded-2xl border border-black/10 bg-white/40 p-4 shadow-sm">
            <div className="h-[320px] md:h-[420px] rounded-xl bg-gradient-to-br from-[#0f766e] to-[#0b3b38] relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
              <div className="absolute bottom-6 left-6 right-6 h-24 rounded-xl bg-white/10 border border-white/10" />
            </div>
          </div>
        </section>

        {/* Why choose */}
        <section id="features" className="pb-16">
          <p className="text-center text-xs font-medium text-teal-600">
            Pour vous faire gagner du temps
          </p>
          <h2 className="mt-2 text-center text-2xl md:text-3xl font-semibold">
            Pourquoi choisir SmartClinic ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-black/60">
            Conçu pour l’efficacité et le soin aux patients. Nous gérons
            l’administration pour que vous puissiez vous concentrer sur
            l’essentiel.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Réservation intelligente"
              desc="Planification fluide qui réduit les absences et optimise les créneaux."
            />
            <FeatureCard
              title="Notes SOAP avec IA"
              desc="Brouillons automatiques pour économiser des heures de documentation."
            />
            <FeatureCard
              title="Multi-cliniques"
              desc="Gérez plusieurs emplacements et praticiens depuis un tableau de bord unique."
            />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-16">
          <div className="rounded-2xl bg-[#0b2a28] text-white px-6 py-10 md:px-10 md:py-12">
            <div className="grid gap-8 md:grid-cols-3 md:items-center">
              <div className="md:col-span-1">
                <h3 className="text-2xl font-semibold">
                  Prêt à moderniser votre pratique ?
                </h3>
                <p className="mt-2 text-white/70 text-sm">
                  Rejoignez des professionnels qui accélèrent leur quotidien
                  avec SmartClinic.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link
                    to="/booking"
                    className="rounded-full px-5 py-2.5 text-sm bg-teal-500 hover:bg-teal-600"
                  >
                    Essai gratuit
                  </Link>
                  <button className="rounded-full px-5 py-2.5 text-sm border border-white/20 hover:bg-white/10">
                    Contacter l’équipe
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
                <InfoPill
                  title="Conforme (sécurité)"
                  desc="Chiffrement et bonnes pratiques de protection des données."
                />
                <InfoPill
                  title="Support 24/7"
                  desc="Une équipe disponible pour vous aider, quand vous en avez besoin."
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="py-10 text-center text-sm text-black/50">
          © {new Date().getFullYear()} SmartClinic — Québec
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-5 shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/25" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-black/60">{desc}</p>
    </div>
  );
}

function InfoPill({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
    </div>
  );
}

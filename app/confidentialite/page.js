"use client";

import Link from "next/link";
import styles from "./confidentialite.module.css";

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={`${styles.logo} text-glow-primary`}>
          <Link href="/">NARU<span>.STREAM</span></Link>
        </h1>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>← Retour à l'accueil</Link>
        </nav>
      </header>

      <div className={styles.content}>
        <div className={styles.welcomeSection}>
          <div className={styles.emoji}>📜</div>
          <h1 className={styles.title}>Charte de Confidentialité</h1>
          <p className={styles.subtitle}>
            Transparence, respect de la vie privée et fonctionnement de la communauté NaruStream.
          </p>
        </div>

        <div className={styles.policyCard}>
          {/* Section 1: Non-hébergement de contenus */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span>📁</span> Hébergement & Contenu
            </h2>
            <p className={styles.sectionText}>
              La communauté <strong>NaruStream</strong> tient à clarifier son mode de fonctionnement concernant les vidéos accessibles sur le site :
            </p>
            <div className={styles.highlightBox}>
              <p>
                <strong>Aucun fichier vidéo n'est hébergé sur nos serveurs.</strong> NaruStream agit uniquement en tant qu'annuaire et index de référencement.
              </p>
            </div>
            <p className={styles.sectionText}>
              Notre rôle se limite exclusivement à <strong>référencer des liens hypertextes</strong> menant vers des lecteurs vidéos tiers (comme des plateformes d'hébergement externes) ou des sites internet déjà existants et accessibles publiquement sur le réseau internet.
            </p>
            <p className={styles.sectionText}>
              NaruStream n'a aucun contrôle sur ces serveurs externes et ne peut en aucun cas être tenu responsable du contenu qui y est diffusé, stocké ou supprimé par ses hébergeurs respectifs.
            </p>
          </section>

          {/* Section 2: Protection des données personnelles */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span>🔒</span> Protection des Données Personnelles
            </h2>
            <p className={styles.sectionText}>
              Nous accordons une importance capitale à la vie privée de nos utilisateurs. C'est pourquoi nous appliquons une politique stricte de non-conservation :
            </p>
            <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0", flexWrap: "wrap" }}>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>✓ Zéro tracking intrusif</span>
              <span className={`${styles.badge} ${styles.badgeRed}`}>✗ Aucune revente de données</span>
            </div>
            <p className={styles.sectionText}>
              <strong>Aucune donnée personnelle n'est conservée.</strong> Nous ne collectons, ne stockons, ni ne suivons aucune information sensible permettant de vous identifier personnellement.
            </p>
            <p className={styles.sectionText}>
              Les profils d'utilisation créés au sein de notre plateforme servent uniquement à personnaliser votre expérience de visionnage locale (gestion de vos listes de favoris, historique de lecture local) et ne font l'objet d'aucun traitement marketing ou commercial.
            </p>
          </section>

          {/* Section 3: Cookies et technologies tierces */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span>🍪</span> Cookies & Lecteurs Externes
            </h2>
            <p className={styles.sectionText}>
              En naviguant sur NaruStream, vous pouvez être amené à utiliser des lecteurs vidéo externes ou à visiter des liens tiers. Ces services tiers sont susceptibles d'utiliser leurs propres cookies ou de collecter des informations selon leurs propres conditions générales d'utilisation.
            </p>
            <p className={styles.sectionText}>
              Nous vous recommandons de prendre connaissance des politiques de confidentialité de ces plateformes tierces lors de votre interaction avec leurs lecteurs.
            </p>
          </section>

          {/* Section 4: Dysfonctionnements et Erreurs */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span>⚠️</span> Dysfonctionnements & Lecteurs
            </h2>
            <p className={styles.sectionText}>
              Veuillez noter que <strong>des erreurs ou des dysfonctionnements temporaires peuvent parfois survenir</strong> au niveau des différents lecteurs vidéo ou lors de la lecture des bandes-annonces de présentation, ces éléments dépendant directement de flux externes.
            </p>
          </section>

          {/* Section 5: Contact */}
          <section className={styles.section} style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "2.5rem", marginTop: "2.5rem" }}>
            <h2 className={styles.sectionTitle}>
              <span>✉</span> Une Question ?
            </h2>
            <p className={styles.sectionText}>
              Si vous avez la moindre question concernant notre charte de confidentialité ou le fonctionnement de la plateforme, vous pouvez nous écrire directement via notre page de <Link href="/contact" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>contact</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

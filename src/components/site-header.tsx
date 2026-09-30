import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/about", label: "About" },
  { href: "/campus", label: "Campus" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Sto. Niño Catholic School home">
          <Image
            className="brand-mark"
            src="/images/source-site/sncs-seal.png"
            alt=""
            width={52}
            height={52}
            priority
          />
          <span>
            <strong>Sto. Niño Catholic School, Inc.</strong>
            <small>Signal Village, Taguig City</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}

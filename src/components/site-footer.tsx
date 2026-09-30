import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">Sto. Niño Catholic School, Inc.</p>
          <p>A faith-centered learning community in Taguig City.</p>
        </div>
        <div>
          <p className="footer-heading">Explore</p>
          <Link href="/about">About SNCS</Link>
          <Link href="/campus">Campus life</Link>
          <Link href="/news">Latest news</Link>
        </div>
        <div>
          <p className="footer-heading">Visit</p>
          <p>Signal Village</p>
          <p>Taguig City</p>
          <Link href="/contact">Contact the school</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Sto. Niño Catholic School, Inc.</span>
        <span>Public website MVP · PB-10</span>
      </div>
    </footer>
  );
}

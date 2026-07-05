import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaApple,
  FaGooglePlay,
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaChevronDown,
} from "react-icons/fa";
import { SERVED_CITIES, FOOTER_FEATURED_CITIES } from "../../data/platformCatalog";

const DashboardFooter = () => {
  const [showAllCities, setShowAllCities] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-2 border-t border-border/70 bg-muted/30 dark:bg-zinc-950/40">
      {/* App download strip */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-8 md:py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-base md:text-lg font-bold text-foreground max-w-md">
            For better experience, download the Cravon app now
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <FaGooglePlay className="text-xl" />
              <span className="text-left text-xs leading-tight">
                GET IT ON
                <span className="block text-sm font-semibold">Google Play</span>
              </span>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2.5 bg-black text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <FaApple className="text-xl" />
              <span className="text-left text-xs leading-tight">
                Download on the
                <span className="block text-sm font-semibold">App Store</span>
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <span className="text-xl font-bold text-primary">Cravon</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              © {year} Cravon Food Technologies Pvt. Ltd.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/partner" className="hover:text-primary transition-colors">Cravon Corporate</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Team</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cravon One</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-4">Contact us</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
              <li><Link to="/help" className="hover:text-primary transition-colors">Help &amp; Support</Link></li>
              <li><Link to="/partner" className="hover:text-primary transition-colors">Partner with us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Ride with us</Link></li>
            </ul>
            <h4 className="text-sm font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Terms &amp; Conditions</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-4">Available in:</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {(showAllCities ? SERVED_CITIES : FOOTER_FEATURED_CITIES).map((city) => (
                <li key={city}>
                  <Link to="/home" className="hover:text-primary transition-colors">{city}</Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowAllCities((v) => !v)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground border border-border rounded-lg px-3 py-1.5 hover:border-primary/50 hover:text-primary transition-colors"
            >
              {SERVED_CITIES.length} cities
              <FaChevronDown size={10} className={`transition-transform ${showAllCities ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-4">Life at Cravon</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground mb-6">
              <li><a href="#" className="hover:text-primary transition-colors">Explore with Cravon</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cravon News</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Snackables</a></li>
            </ul>
            <h4 className="text-sm font-bold text-foreground mb-3">Social Links</h4>
            <div className="flex items-center gap-3 text-muted-foreground">
              {[FaLinkedin, FaInstagram, FaFacebook, FaTwitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;

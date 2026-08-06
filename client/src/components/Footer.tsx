import { useNavigate } from "react-router-dom";
import {
  Languages,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <footer className="bg-gray-900 text-gray-300 dark:bg-black py-12 sm:py-16 mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-gray-800 pb-12 mb-12 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                <Languages className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">MCQGyaan AI</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400">{t("footer_tagline")}</p>
            <p className="text-xs text-gray-500">
              {t("footer_copyright", { year: currentYear })}
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t("footer_product")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigation("/")} className="transition hover:text-blue-400">
                  {t("home")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/features")} className="transition hover:text-blue-400">
                  {t("features")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/pricing")} className="transition hover:text-blue-400">
                  {t("pricing")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/about-us")} className="transition hover:text-blue-400">
                  {t("footer_about_us")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t("footer_support")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigation("/contact")} className="transition hover:text-blue-400">
                  {t("contact")}
                </button>
              </li>
              <li>
                <a href="mailto:support@mcqgyaan.com" className="transition hover:text-blue-400">
                  {t("footer_email_support")}
                </a>
              </li>
              <li>
                <a href="tel:+919950143179" className="transition hover:text-blue-400">
                  {t("footer_call_us")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t("footer_legal")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigation("/terms")} className="transition hover:text-blue-400">
                  {t("footer_terms")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/privacy")} className="transition hover:text-blue-400">
                  {t("footer_privacy")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/refund-policy")} className="transition hover:text-blue-400">
                  {t("footer_refund")}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation("/disclaimer")} className="transition hover:text-blue-400">
                  {t("footer_disclaimer")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t("footer_contact")}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <a href="mailto:support@mcqgyaan.com" className="transition hover:text-blue-400">
                  support@mcqgyaan.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <a href="tel:+919950143179" className="transition hover:text-blue-400">
                  +91 99501 43179
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
                <span>{t("footer_location")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">{t("footer_bottom_note")}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-facebook">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-twitter">
              <Twitter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-linkedin">
              <Linkedin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-youtube">
              <Youtube className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

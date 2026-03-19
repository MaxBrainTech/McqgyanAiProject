import { useNavigate } from "react-router-dom";
import { Languages, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12 sm:py-16 mt-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12 pb-12 border-b border-gray-800">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">MCQGyaan AI</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Empowering students with AI-powered learning for CBSE education.
            </p>
            <p className="text-xs text-gray-500">© {currentYear} MaxBrain Technologies. All rights reserved.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigation("/")} className="hover:text-blue-400 transition">Home</button></li>
              <li><button onClick={() => handleNavigation("/features")} className="hover:text-blue-400 transition">Features</button></li>
              <li><button onClick={() => handleNavigation("/pricing")} className="hover:text-blue-400 transition">Pricing</button></li>
              <li><button onClick={() => handleNavigation("/about-us")} className="hover:text-blue-400 transition">About Us</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigation("/contact")} className="hover:text-blue-400 transition">Contact Us</button></li>
              <li><a href="mailto:support@mcqgyaan.com" className="hover:text-blue-400 transition">Email Support</a></li>
              <li><a href="tel:+919950143179" className="hover:text-blue-400 transition">Call Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => handleNavigation("/terms")} className="hover:text-blue-400 transition">Terms</button></li>
              <li><button onClick={() => handleNavigation("/privacy")} className="hover:text-blue-400 transition">Privacy</button></li>
              <li><button onClick={() => handleNavigation("/refund-policy")} className="hover:text-blue-400 transition">Refund</button></li>
              <li><button onClick={() => handleNavigation("/disclaimer")} className="hover:text-blue-400 transition">Disclaimer</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="mailto:support@mcqgyaan.com" className="hover:text-blue-400 transition">support@mcqgyaan.com</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <a href="tel:+919950143179" className="hover:text-blue-400 transition">+91 99501 43179</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                <span>Jaipur, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">Free until Dec 31, 2026 • Made with passion for education</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-facebook">
              <Facebook className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-twitter">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-linkedin">
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-400" data-testid="button-youtube">
              <Youtube className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

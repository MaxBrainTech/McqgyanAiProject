import { Link } from "react-router-dom";



export default function Footer() {
  return (
    <footer className="
      bg-gradient-to-br from-blue-600 to-purple-700
      dark:from-gray-900 dark:to-black
      text-white pt-16 pb-10
    ">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Logo + About */}
        <div>
          <h2 className="text-2xl font-bold mb-3">MaxBrain</h2>
          <p className="text-white/80 leading-relaxed">
            Blending innovation with technology — delivering digital solutions 
            that transform your ideas into high-impact products.
          </p>

          <div className="flex gap-4 mt-4">
            <a href="#" className="text-white/70 hover:text-yellow-300 text-xl">🌐</a>
            <a href="#" className="text-white/70 hover:text-yellow-300 text-xl">📘</a>
            <a href="#" className="text-white/70 hover:text-yellow-300 text-xl">🐦</a>
            <a href="#" className="text-white/70 hover:text-yellow-300 text-xl">📸</a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-300">Quick Links</h3>
          <ul className="space-y-3 text-white/80">
            <li><a href="#" className="hover:text-yellow-300">Home</a></li>
            <li><a href="#" className="hover:text-yellow-300">Features</a></li>
            {/* <li><a href="#" className="hover:text-yellow-300">Services</a></li> */}
            <li><a href="#" className="hover:text-yellow-300">Pricing</a></li>
            <li><a href="#" className="hover:text-yellow-300">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-300">Support</h3>
          <ul className="space-y-3 text-white/80">
            <li>
              <Link to="/Homepage" className="hover:text-yellow-300 font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link to="/features" className="hover:text-yellow-300">Features</Link>
            </li>
            <li>
              {/* <Link to="/services" className="hover:text-yellow-300">Services</Link> */}
            </li>
            <li>
              <Link to="/pricing" className="hover:text-yellow-300">Pricing</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-yellow-300">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-yellow-300">Contact</h3>
          <ul className="space-y-3 text-white/80">
            <li>📍 Jaipur, Rajasthan, India</li>
            <li>📧 support@themaxbrain.com</li>
            <li>📧 info@themaxbrain.com</li>
            <li>📞 +91 9950143179</li>
            <li>📞 +91 7597493655</li>
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/20 mt-10 pt-6 text-center text-white/70">
        <p>© {new Date().getFullYear()} MaxBrain Technologies Pvt. Ltd. All rights reserved.</p>
      </div>
    </footer>
  );
}




// export default function Footer() {
//   return <div className="p-10 text-3xl font-bold">Contact Page</div>;
// }
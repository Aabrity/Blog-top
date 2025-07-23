
import { Footer } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  BsFacebook,
  BsInstagram,
  BsTwitter,
  BsYoutube,
  BsGlobe,
} from 'react-icons/bs';
import logoLight from '../assets/logo/logo.png'; 
import logoDark from '../assets/logo/logow.png';   

export default function FooterCom() {
  const { theme } = useSelector((state) => state.theme);

  return (
    <Footer
      container
      className={`border-t-4 ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-300 border-green-500'
          : 'bg-green-100 text-gray-800 border-green-300 shadow-[0_-2px_4px_rgba(34,197,94,0.1)]'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src={theme === 'dark' ? logoDark : logoLight}
                alt="BlogTOp logo"
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-lg font-bold">
                <span className={theme === 'dark' ? 'text-white' : 'text-slate-800'}>
                  BLOG
                </span>
                <span className="text-green-600">-TOP</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <h3 className="font-semibold uppercase tracking-wide text-xs mb-2 text-green-600">
                ABOUT
              </h3>
              <div className="space-y-1">
                <Link
                  to="/about"
                  className="block hover:text-green-500 transition-colors"
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="block hover:text-green-500 transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold uppercase tracking-wide text-xs mb-2 text-green-600">
                FOLLOW US
              </h3>
              <div className="space-y-1">
                <a href="#" className="block hover:text-green-500 transition-colors">
                  Facebook
                </a>
                <a href="#" className="block hover:text-green-500 transition-colors">
                  Twitter
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold uppercase tracking-wide text-xs mb-2 text-green-600">
                LEGAL
              </h3>
              <div className="space-y-1">
                <Link
                  to="/privacy"
                  className="block hover:text-green-500 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="block hover:text-green-500 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-400/30">
          <div className="text-sm">
            © {new Date().getFullYear()} BlogTop. All rights reserved.
          </div>

          <div className="flex gap-4">
            {[BsFacebook, BsInstagram, BsTwitter, BsYoutube, BsGlobe].map(
              (Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="hover:text-green-500 text-gray-400 transition-colors"
                >
                  <Icon size={18} />
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </Footer>
  );
}

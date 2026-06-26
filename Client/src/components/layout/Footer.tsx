import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Departments", path: "/departments" },
    { name: "Cells & Centers", path: "/cells" },
    { name: "Activities", path: "/activities" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* College Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              
              <div>
                <h3 className="text-lg font-bold">LDRP</h3>
                <p className="text-sm opacity-90">Institute of Technology & Research</p>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Inspiring students to innovate, collaborate, and make significant societal contributions through research excellence, since 2024.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/ldrpitr" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              
              <a href="https://www.linkedin.com/school/ldrp-institute-of-technology-research-gujarat-technological-university-india/" className="hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/ksv_ldrp_itr/" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-sm opacity-80 hover:opacity-100 hover:text-white transition-all duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-0.5 opacity-80" />
                <div className="text-sm opacity-80">
                  <p>LDRP Institute of Technology & Research,</p>
                  <p>Near KH-5,Sector-15,</p>
                  <p>Gandhinagar - 382015.</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 opacity-80" />
                <p className="text-sm opacity-80">+ 91 - 079 - 23241492 </p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 opacity-80" />
                <p className="text-sm opacity-80">info@ldrp.ac.in</p>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Location</h4>
            <div className="w-full h-44 bg-white/20 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1770.9993969124264!2d72.63777998862933!3d23.239012594755653!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395c2b933477ba9f%3A0xa463a4d35cdc83d2!2sLDRP%20INSTITUTE%20OF%20TECHNOLOGY%20AND%20RESEARCH%2C%20Sector%2015%2C%20Gandhinagar%2C%20Gujarat%20382016!5e1!3m2!1sen!2sin!4v1756895268003!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="College Location"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm opacity-80">
              © 2025 LDRP-ITR. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm opacity-80">
              <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
              <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
              <a href="https://www.ldrp.ac.in/sitemap_index.xml" className="hover:opacity-100 transition-opacity">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
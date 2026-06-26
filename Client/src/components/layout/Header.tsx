import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const departments = [
    "Computer Engineering",
    "Information Technology",
    "Electronics and Communication",
    "Civil Engineering",
    "Mechanical Engineering",
    "MBA",
    "MCA",
  ];

  const cells = [
    "M. M. Patel Students Research Project Cell",
    "Department of International Relations",
    "Women Entrepreneurship Cell",
    "Women Development Cell",
    "Library",
    "Anti-Ragging Cell",
    "Sports Cell",
    "Social Responsibility Activities",
    "LAKSH (University Fitness Cell)",
  ];

  const activities = ["Placement", "Sports", "NCC", "NSS"];

  const isActive = (path: string) => location.pathname === path;

  return (
  <header
  style={{
    backgroundColor: "rgba(20, 54, 109, 0.95)",
    backdropFilter: "blur(6px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",

    backgroundImage: `
      radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)
    `,
    backgroundSize: "20px 20px",
  }}
  className="sticky top-0 z-50 w-full"
>



  


      <div className="container mx-auto px-0 ml-14">
        <div className="flex h-20 items-center justify-between">
          {/* Left Logo (Clickable) */}
          <a
            href="#" // 🔗 change link here
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <div className="w-16 h-16 flex items-left justify-center ">
              <img
                src="https://ieee-ldrpitr-sb.vercel.app/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fdygk5jhz8%2Fimage%2Fupload%2Fv1714903054%2FStudyNotion%2FLDRP-ITR_Logo_di2kbq.png&w=256&q=75"
                alt="LDRP-ITR Logo"
                className="w-18 h-18 object-contain"
              />
            </div>
            <div className="hidden md:block">
              <h1 className="text-5xl font-bold text-primary-foreground">
                LDRP
              </h1>
              <p className="text-xs text-primary-foreground/80">
                Institute Of Technology and Research
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList className="space-x-0">
                <NavigationMenuItem>
                  <Link
                    to="/"
                    className={`nav-link px-3 py-2 text-sm font-medium ${
                      isActive("/")
                        ? "text-white"
                        : "text-primary-foreground hover:text-white"
                    }`}
                  >
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-primary-foreground hover:text-white hover:bg-primary-dark/20">
                    Departments & Faculty
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-64 gap-1 p-2 bg-white/95 backdrop-blur-sm border shadow-lg z-50">
                      {departments.map((dept) => (
                        <NavigationMenuLink key={dept} asChild>
                          <Link
                            to={`/departments/${dept
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace("&", "and")}`}
                            className="block select-none rounded-md p-3 leading-none text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {dept}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-primary-foreground hover:text-white hover:bg-primary-dark/20">
                    Cells & Centers
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-80 gap-1 p-2 bg-white/95 backdrop-blur-sm border shadow-lg z-50">
                      {cells.map((cell) => (
                        <NavigationMenuLink key={cell} asChild>
                          <Link
                            to={`/cells/${cell
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace("&", "and")}`}
                            className="block select-none rounded-md p-3 leading-none text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {cell}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-primary-foreground hover:text-white hover:bg-primary-dark/20">
                    Activities
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-48 gap-1 p-2 bg-white/95 backdrop-blur-sm border shadow-lg z-50">
                      {activities.map((activity) => (
                        <NavigationMenuLink key={activity} asChild>
                          <Link
                            to={`/activities/${activity.toLowerCase()}`}
                            className="block select-none rounded-md p-3 leading-none text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {activity}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/faculty-login"
                    className={`nav-link px-3 py-2 text-sm font-medium ${
                      isActive("/faculty-login")
                        ? "text-white"
                        : "text-primary-foreground hover:text-white"
                    }`}
                  >
                    Faculty Portal
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/admin-login"
                    className={`nav-link px-3 py-2 text-sm font-medium ${
                      isActive("/admin-login")
                        ? "text-white"
                        : "text-primary-foreground hover:text-white"
                    }`}
                  >
                    Admin Portal
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/about"
                    className={`nav-link px-3 py-2 text-sm font-medium ${
                      isActive("/about")
                        ? "text-white"
                        : "text-primary-foreground hover:text-white"
                    }`}
                  >
                    About Us
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link
                    to="/contact"
                    className={`nav-link px-3 py-2 text-sm font-medium ${
                      isActive("/contact")
                        ? "text-white"
                        : "text-primary-foreground hover:text-white"
                    }`}
                  >
                    Contact Us
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Logos (Clickable) */}
          <a
            href="https://ksv.ac.in/" // 🔗 change link here
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-16 h-16 flex items-left justify-center ml-12">
              <img
                src="https://www.mmpsrpc.in/static/media/ksv.c6540b125992f5167fc7.png"
                alt="KSV Logo"
                className="w-18 h-18 object-contain"
              />
            </div>
          </a>

          <a
            href="https://svkm.org.in/" // 🔗 change link here
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-16 h-16 flex items-left justify-center ml-0">
              <img
                src="https://www.mmpsrpc.in/static/media/svkm.f25bc0d9bb5dcbe27efd.png"
                alt="SVKM Logo"
                className="w-14  h-16 object-contain"
              />
            </div>
          </a>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-dark/20"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link
                    to="/"
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    About Us
                  </Link>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-primary-dark">
                      Departments
                    </h3>
                    {departments.map((dept) => (
                      <Link
                        key={dept}
                        to={`/departments/${dept
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace("&", "and")}`}
                        className="block pl-4 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        {dept}
                      </Link>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-primary-dark">
                      Cells & Centers
                    </h3>
                    {cells.map((cell) => (
                      <Link
                        key={cell}
                        to={`/cells/${cell
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace("&", "and")}`}
                        className="block pl-4 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        {cell}
                      </Link>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-primary-dark">
                      Activities
                    </h3>
                    {activities.map((activity) => (
                      <Link
                        key={activity}
                        to={`/activities/${activity.toLowerCase()}`}
                        className="block pl-4 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => setIsOpen(false)}
                      >
                        {activity}
                      </Link>
                    ))}
                  </div>

                  <Link
                    to="/faculty-login"
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Faculty Portal
                  </Link>
                  <Link
                    to="/admin-login"
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Portal
                  </Link>

                  <Link
                    to="/contact"
                    className="text-lg font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Contact Us
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

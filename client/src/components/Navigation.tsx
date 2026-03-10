import { Link, useLocation } from "wouter";
import { FileText, Upload, Home, Stethoscope, Users, Settings } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/upload", label: "Escanear", icon: Upload },
  { href: "/records", label: "Historial", icon: FileText },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export default function Navigation() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Stethoscope className="h-6 w-6" />
            <span>DiarioMed</span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

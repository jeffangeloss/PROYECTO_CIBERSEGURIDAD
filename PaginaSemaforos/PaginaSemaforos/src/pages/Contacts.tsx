import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contacts() {
  const contacts = [
    {
      name: "Dr. Carlos Mendoza",
      role: "Director del Proyecto",
      email: "c.mendoza@universidad.edu",
      phone: "+1 (555) 123-4567",
      department: "Departamento de Ciberseguridad"
    },
    {
      name: "Ing. María González",
      role: "Coordinadora IoT",
      email: "m.gonzalez@universidad.edu",
      phone: "+1 (555) 234-5678",
      department: "Laboratorio de Sistemas Embebidos"
    },
    {
      name: "Prof. Juan Pérez",
      role: "Asesor Técnico",
      email: "j.perez@universidad.edu",
      phone: "+1 (555) 345-6789",
      department: "Ingeniería de Sistemas"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contactos del Proyecto</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Para más información sobre el proyecto de investigación en ciberseguridad IoT,
            puede contactar a los siguientes miembros del equipo académico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contacts.map((contact, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">{contact.name}</CardTitle>
                <CardDescription className="text-primary font-medium">
                  {contact.role}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{contact.department}</p>
                
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors">
                    {contact.email}
                  </a>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-accent" />
                  <span>{contact.phone}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Dirección</h3>
              <p className="text-muted-foreground">
                Av. Principal 1234, Campus Norte<br />
                Ciudad 123, CP 12345
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Horario de Atención</h3>
              <p className="text-muted-foreground">
                Lunes a Viernes: 9:00 AM - 6:00 PM<br />
                Sábados: 9:00 AM - 1:00 PM
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" size="sm">
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
              <Button variant="outline" size="sm">
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

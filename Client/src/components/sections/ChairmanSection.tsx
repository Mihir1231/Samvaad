import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, Award, Users, Heart } from "lucide-react";

const ChairmanSection = () => {
  const chairman = {
    name: "Vallabhbhai M Patel",
    position: "President, Kadi Sarva Vishwavidyalaya",
    position1: "Chairman, Sarva Vidyalaya Kelvani Mandal, Kadi & Gandhinagar",

    image: "https://ksv.ac.in/docs/images/chairman.jpg", // Using the uploaded image
    quote: "KAR BHALA HOGA BHALA",
    bio: "With the objective of providing education to one and all the trust has been managing various schools right from Pre Primary Level to Primary to Secondary to Higher Secondary level both in Gujarati Medium and English Medium.  In addition to the schools the trust also manages a University i.e., Kadi Sarva Vishwavidyalaya and also other colleges.",
    achievements: [
      "PhD in Educational Management from IIT Mumbai",
      "25+ years in Educational Leadership",
      "Recipient of National Education Excellence Award 2020",
      "Author of 3 books on Modern Education Practices"
    ],
    philosophy: "Our philosophy centers around holistic development of students, combining academic rigor with practical skills, ethical values, and social responsibility. We believe in nurturing not just skilled professionals, but conscious citizens who can contribute meaningfully to society."
  };

  const highlights = [
    {
      icon: Award,
      title: "Academic Excellence",
      description: "Leading the institution to achieve top rankings and accreditations"
    },
    {
      icon: Users,
      title: "Student Development", 
      description: "Fostering an environment for comprehensive personality development"
    },
    {
      icon: Heart,
      title: "Social Impact",
      description: "Promoting education accessibility and community development"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary-light/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Message from Our Chairman
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary-dark mx-auto"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative h-96 lg:h-full">
                  <img 
                    src={chairman.image} 
                    alt={chairman.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold mb-1">{chairman.name}</h3>
                    <p className="text-white/90 text-lg">{chairman.position}</p>
                    <p className="text-white/90 text-lg">{chairman.position1}</p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  {/* Quote */}
                  <div className="mb-8">
                    <Quote className="h-12 w-12 text-primary mb-4 opacity-60" />
                    <blockquote className="text-lg md:text-xl text-foreground leading-relaxed italic font-medium">
                      "{chairman.quote}"
                    </blockquote>
                  </div>

                  {/* Bio */}
                  <div className="mb-8">
                    <p className="text-muted-foreground leading-relaxed">
                      {chairman.bio}
                    </p>
                  </div>

                  {/* Achievements */}
                  
                </div>
              </div>

              {/* Philosophy Section */}
              <div className="p-8 lg:p-12 bg-gradient-to-r from-primary/5 to-primary-dark/5 border-t">
                <h4 className="text-xl font-semibold text-foreground mb-4 text-center">Our Educational Philosophy</h4>
                <p className="text-muted-foreground leading-relaxed text-center max-w-4xl mx-auto mb-8">
                  {chairman.philosophy}
                </p>

                {/* Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <highlight.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h5 className="font-semibold text-foreground mb-2">{highlight.title}</h5>
                      <p className="text-sm text-muted-foreground">{highlight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ChairmanSection;
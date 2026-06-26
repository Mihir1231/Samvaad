import { Award, Users, BookOpen, Globe, Target, Eye, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ChairmanSection from "@/components/sections/ChairmanSection";

const About = () => {
  // Easily editable college images
  const collegeImages = [
    {
      id: 1,
      src: "https://media.licdn.com/dms/image/v2/C4E1BAQHinizzknOMWg/company-background_10000/company-background_10000/0/1583918159714?e=1757505600&v=beta&t=edWQWy0G7XTQv6apjgV_mky8luXbUB7c_TgPIKJCt94",
      alt: "Main Campus Building",
      title: "Main Campus"
    },
    {
      id: 2,
      src: "https://media.collegedekho.com/media/img/institute/crawled_images/None/library.png", 
      alt: "Library and Study Areas",
      title: "Modern Library"
    },
    
   
    
    {
      id: 3,
      src: "https://www.ldrp.ac.in/wp-content/uploads/mca5-1024x768.jpg",
      alt: "Auditorium",
      title: "Main Auditorium"
    }
  ];

  const achievements = [
   
  ];

  const values = [
    {
      icon: Target,
      title: "Excellence",
      description: "Striving for the highest standards in education, research, and service to society."
    },
    {
      icon: Eye,
      title: "Innovation",
      description: "Fostering creative thinking and technological advancement in all academic pursuits."
    },
    {
      icon: Heart,
      title: "Integrity",
      description: "Maintaining ethical standards and transparency in all our educational endeavors."
    },
    {
      icon: Users,
      title: "Inclusivity",
      description: "Creating an environment where diversity is celebrated and everyone can thrive."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 fade-in">About Our College</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto slide-up">
            Empowering minds, shaping futures, and building tomorrow's leaders through excellence in education
          </p>
        </div>
      </section>

      {/* College Images Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Campus</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collegeImages.map((image, index) => (
              <Card key={image.id} className="group overflow-hidden border-0 shadow-lg hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <h3 className="text-white font-semibold text-lg p-6">{image.title}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

        <ChairmanSection />

      

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="p-8 border-0 shadow-lg hover-lift">
              <h3 className="text-2xl font-bold text-primary-dark mb-6">Our Mission</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our mission continues to drive our growth and progress, building on strong foundations of relationships amongst the students, parents and the Sarva Vidhyalaya Kelvani Mandal Education is the most important tool to uplift our human values.
              </p>
            </Card>
            
            <Card className="p-8 border-0 shadow-lg hover-lift">
              <h3 className="text-2xl font-bold text-primary-dark mb-6">Our Vision</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To be recognized as a premier institution of higher learning that creates an inclusive, innovative, and inspiring environment for academic excellence, research advancement, and character development, preparing graduates to address global challenges.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Core Values</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center border-0 shadow-lg hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
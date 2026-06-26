import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import womenEntrepreneurshipImg from "@/assets/wec.jpg";

const WomenEntrepreneurship = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={womenEntrepreneurshipImg} 
            alt="Women Entrepreneurship Cell"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">Women Entrepreneurship Cell</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Women Entrepreneurship Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Engage in right pursuit of imparting quality and value based education; Kadi Sarva Vishwidyalaya has always explored the new avenues for student development in sustainable way. In line with same deliberation, At KSV, we have initiated women entrepreneurship Cell to ignite the spirit of an Entrepreneurship amongst our female students.

Entrepreneurship has been identified as one of the major trends shaping business, economy and even society. Today’s world is changing at surprising pace with wind of Globalization and IT revolution. Entire world is sensing political and economical transformation. The changing market conditions have thrown up opportunities for emerging businesses. This has also created economic opportunities for women who want to own and operate business.

Entrepreneurs shape the economic destiny of nation by creating wealth and employment, offering products and services, and generating taxes for government. Indian women today have horned their abilities and jumped into a battle field of life with the sword of “Shakti”, fighting against family restrictions, religious boundaries, emotional ties, social restrictions and cultural paradox. Indian women had undergone a long way and are becoming increasingly visible and successful in all spheres and have shifted from kitchen to higher level of professional activities.
It is high time that countries should create more support systems for encouraging more entrepreneurship amongst women. At the same time, it is up to women to break away from stereotyped mindsets.

Sanskrit meaning of Entrepreneurship is “AntraPrerna“. With this strong AntraPrerna of our leaders who believes in “Kar Bhala Hoga Bhala”, gave birth to Women Entrepreneurship Cell. As a philanthropic Trust and University in its true sense, KSV has observed the need to empower female students to make them financially and socially independent. In India today, women are getting more opportunities for entrepreneurship and having higher success rates. In spite of that they are facing many challenges and barriers to start and run the venture. While there is increased social acceptance of women in the workplace, they still face difficulties in finding team members, mentors, knowledge about sources of finance, supporting agencies, practical exposure, training and funding to scale up their ideas.
            </p>
            
            
            <div className="flex justify-center">
                <Button className="flex items-center gap-2" size="lg" asChild>
                <a href="https://wecksv.org/" target="_blank" rel="noopener noreferrer">
                  Visit Portal <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
             
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WomenEntrepreneurship;
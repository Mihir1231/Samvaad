import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import dirImg from "@/assets/dir.jpg";

const WomenEntrepreneurship = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={dirImg} 
            alt="Women Entrepreneurship Cell"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">Department of International Relations</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Department of International Relations Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              To provide a platform for students and lecturers to be a
part of global education and its pedagogy.
To provide international platform for exposure and
learning.
To arrange and invite experts for International workshop
and seminar for the students and lectures from all over
the globe encouraging national and international
collaboration and association• To provide need based training for specific subjects with
Universities and foreign companies.
To encourage collaborative researches and exchange
programs.

            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              It managed by SVKM is pioneering a new model of
higher education for a global world. It is dedicated to
excellence in teaching and research and to advancing
cooperation & progress on humanity's shared challenges.
It supports innovative research and under graduate
education programs that push forward the frontiers of
knowledge and respond in powerful and interdisciplinary
ways to vital global and local challenges.
As a vital part of a model university for the 21st century it
contributes in multiple ways to the development of a
sustainable, knowledge-based economy in India
            </p>
            
            
            <div className="flex justify-center">
              <Button className="flex items-center gap-2" size="lg" asChild>
                <a href="https://www.dirsvkm.com/" target="_blank" rel="noopener noreferrer">
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
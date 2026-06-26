import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import womenEntrepreneurshipImg from "@/assets/women.jpg";

const WomenDevelopment = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={womenEntrepreneurshipImg} 
            alt="Women Development Cell" 
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6" 
          />
          <h1 className="text-4xl font-bold text-primary mb-4">Women Development Cell</h1>
        </div>
        
        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Women Development Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
             In pursuance of the directions issued by the UGC and MHRD, Kadi Sarva Vishwavidyalaya has set up the Women Development Cell (WDC) and prescribed norms to sensitize the community with regard to gender related issues and create a gender friendly environment
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our cell organizes workshops, seminars, and training sessions on women's rights, career development, and personal safety. We also provide counseling services and support systems for women facing various challenges.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We collaborate with various organizations to provide comprehensive support including mentorship programs, skill development workshops, and career guidance sessions specifically designed for women's empowerment and professional growth.
            </p>
            
            <div className="flex justify-center">
             
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WomenDevelopment;
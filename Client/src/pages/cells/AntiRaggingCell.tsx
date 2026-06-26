import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import socialResponsibilityImg from "@/assets/social-responsibility.jpg";

const AntiRaggingCell = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={socialResponsibilityImg} 
            alt="Anti-Ragging Cell" 
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6" 
          />
          <h1 className="text-4xl font-bold text-primary mb-4">Anti-Ragging Cell</h1>
        </div>
        
        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Anti-Ragging Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Anti-Ragging Cell is established as per the guidelines of the Supreme Court of India and UGC regulations. 
              Our primary objective is to eliminate ragging in all its forms from the institution and ensure a conducive 
              learning environment for all students.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ragging is a criminal offense and is strictly prohibited. Any form of physical, mental, or emotional harassment 
              of junior students by senior students is considered ragging and will be dealt with severely according to the law.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We maintain a zero tolerance policy for ragging and ensure that all complaints are investigated promptly and fairly. 
              Our cell works proactively to create awareness about the harmful effects of ragging and promotes a culture of respect and dignity.
            </p>
            
            <div className="flex justify-center">
             
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AntiRaggingCell;
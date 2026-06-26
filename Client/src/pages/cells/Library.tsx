import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import libraryImg from "@/assets/libaray.jpg";

const Library = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={libraryImg} 
            alt="College Library"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">College Library</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About College Library</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our college library serves as the intellectual heart of the institution, 
              providing comprehensive resources and services to support academic excellence 
              and research. We maintain an extensive collection of books, journals, 
              digital resources, and multimedia materials across all disciplines.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The library features modern facilities including reading halls, research 
              sections, computer labs, and collaborative study spaces. We provide access 
              to online databases, e-journals, and digital libraries to support both 
              undergraduate and postgraduate research activities.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Our professional library staff assists students and faculty in research 
              methodologies, information literacy, and effective use of library resources. 
              We continuously update our collection to reflect current academic and 
              industry requirements.
            </p>
            
            <div className="flex justify-center">
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Library;
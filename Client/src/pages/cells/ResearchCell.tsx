import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import researchCellImg from "@/assets/research-cell.jpg";

const ResearchCell = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        <div className="mb-12 animate-fade-in">
          <img src={researchCellImg} alt="M. M. Patel Students Research Project Cell" className="w-full h-80 object-cover rounded-lg shadow-lg mb-6" />
          <h1 className="text-4xl font-bold text-primary mb-4">M. M. Patel Students Research Project Cell</h1>
        </div>
        
        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About M. M. Patel Students Research Project Cell</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Founded in 2024, M. M. Patel Students Research Project Cell has been at the forefront of fostering academic excellence and innovative research among students at KSV University. Our journey began with a vision to create a platform where students could explore their research potential and contribute to the academic community.

Over the years, we have grown from a small group of enthusiastic researchers to a vibrant community of researchers, mentors, and faculty members. Our commitment to nurturing talent and pushing the boundaries of knowledge has remained unwavering throughout our journey.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our cell organizes research workshops, seminars, and conferences to foster research excellence and innovation across all disciplines. We encourage interdisciplinary research and provide mentorship to budding researchers.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Through various initiatives and partnerships with industry and academic institutions, we aim to bridge the gap between theoretical knowledge and practical research applications, fostering innovation and creativity among our students.
            </p>
            
            <div className="flex justify-center">
              <Button className="flex items-center gap-2" size="lg" asChild>
                <a href="https://www.mmpsrpc.in/" target="_blank" rel="noopener noreferrer">
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

export default ResearchCell;
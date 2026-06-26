import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import nssImg from "@/assets/nss.jpg";

const NSS = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={nssImg} 
            alt="NSS Activities"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">National Service Scheme (NSS)</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About National Service Scheme (NSS)</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Volunteers works selflessly on “Don’t wait for the change, be the change”.

LDRP is running 1 unit (100 Volunteers) of NSS. Students is actively participating social activities like Blood Donation Camp, Medical Check up Camp, Thalassemia Awareness and Testing Camp.

Every Year volunteers are celebrating Engineers Day, Aids Day, Women’s Day, Population Day, Ozone Day, Teachers Day and Sanvedna Saptaah.

Volunteers are participating in 7 days residential camp in different village.

Volunteers have participated in National Integration Camp, Pre Republic Day Camp and attended BHARTIYA CHATRA SANSAD Seminar.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our NSS unit actively engages students in various community development 
              activities, social service projects, and awareness campaigns. Through 
              regular activities and special camping programs, students develop 
              civic consciousness and contribute to national development.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              NSS volunteers participate in activities like literacy programs, 
              health awareness campaigns, environmental conservation, disaster relief, 
              and community development projects. This service helps students understand 
              the community in which they work and develop solutions to social problems.
            </p>
            
            <div className="flex justify-center">
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NSS;
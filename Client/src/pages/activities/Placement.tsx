import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import placementImg from "@/assets/placement.jpg";

const Placement = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={placementImg} 
            alt="Placement Activities"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">Placement Activities</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Placement Activities</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ketan Chaudhari

Placement Officer,

LDRP-ITR,

Gandhinagar

placement@ldrp.ac.in

Training and Placement is an important wing for any institution to promote knowledge with the advancement of technology. LDRP offer training for both students and faculties. Additionally, Institute is always engaging the faculty as well students in the career base workshops and other extra curriculum activities.

Industry Institution Interaction Cell (III Cell) is established a close and continuing inter-action between the industry and Institute. As there are large numbers of Engineering and Management colleges coming up in Gujarat, the competition for employment is increasing every day and the job of placement is becoming a challenging one.

To deal with the current scenario and academic demand, a full pledged III – cell is functioning in our college with a full time placement officer. This is the team work and supported by the faculty as well student’s coordinators.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Cell is performing the following activities:-

Arranging in plant training for students through the industrial visits,
Training to suit various needs of industry,
Expert Lecture,
Work shops on latest technology,
Carrier counseling,
Alumni networking,
Training sessions on soft skill development,
Inviting various organizations for campus recruitment.,
Arrangement for the on as well pooled campus.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              The placement cell also focuses on entrepreneurship development and provides 
              support for students interested in starting their own ventures. We maintain 
              an excellent track record with over 88.77% placement rate consistently.
            </p>
            
            <div className="flex justify-center">
              
            </div>
          </CardContent>
        </Card>

        {/* Statistics & Companies */}
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Placement Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overall Placement Rate:</span>
                  <span className="font-semibold text-primary">88.77%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Highest Package:</span>
                  <span className="font-semibold text-primary">₹12 LPA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Package:</span>
                  <span className="font-semibold text-primary">₹4.5 LPA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Companies Visited:</span>
                  <span className="font-semibold text-primary">120+</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Top Recruiters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-semibold text-primary">TCS</h4>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-semibold text-primary">Infosys</h4>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-semibold text-primary">Wipro</h4>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-semibold text-primary">Cognizant</h4>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-semibold text-primary">L&T</h4>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h4 className="font-semibold text-primary">Accenture</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Placement;
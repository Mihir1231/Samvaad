import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import sportsImg from "@/assets/sports.jpg";

const Sports = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={sportsImg} 
            alt="Sports Activities"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">Sports Activities</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Sports Activities</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              LDRP is having its own name and fame in sports & games.

College students have participated in different sports & games like Cricket, Football, Volleyball, Kabaddi, Kho-Kho, Badminton, Table Tennis, Chess, Swimming, Athletics, Taekwondo, Cross Country etc….

This year 47 students have represented Kadi Sarva Vishwavidyalaya in All India Inter University and West Zone Inter University in different games.

Above that college Team participated in Invitation Tournaments like PETROCUP, CONCOURS & ELITE CORE, J.G.CUP, ADANI CUP,NIRMA  and SHAURYA.

Every Year college is organizing Inter Branch sports fest called “TRIUNFADOR – Fighter kabhi haar nahi maanta’.

Most awaited event of the college is “SPORTS MAN AND SPORTS WOMAN OF THE YEAR”.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The college maintains well-equipped sports facilities and organizes 
              regular tournaments, competitions, and training sessions. Our students 
              participate in inter-collegiate, state, and national level competitions, 
              bringing laurels to the institution.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We offer coaching and training in multiple sports disciplines and 
              encourage students to maintain an active lifestyle while pursuing 
              their academic goals. Our sports achievements reflect the dedication 
              and talent of our student athletes.
            </p>
            
            <div className="flex justify-center">
             
            </div>
          </CardContent>
        </Card>

        {/* Sports & Facilities */}
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Sports Offered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Cricket</li>
                  <li>• Football</li>
                  <li>• Basketball</li>
                  <li>• Volleyball</li>
                  <li>• Badminton</li>
                </ul>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Table Tennis</li>
                  <li>• Tennis</li>
                  <li>• Athletics</li>
                  <li>• Chess</li>
                  <li>• Kabaddi</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Facilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Outdoor Facilities</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Cricket Ground</li>
                    <li>• Football Field</li>
                    <li>• Basketball Courts</li>
                    <li>• Tennis Courts</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary">Indoor Facilities</h3>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Gymnasium</li>
                    <li>• Badminton Hall</li>
                    <li>• Table Tennis Hall</li>
                    <li>• Fitness Center</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sports;
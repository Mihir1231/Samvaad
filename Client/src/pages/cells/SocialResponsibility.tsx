import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, TreePine, GraduationCap, HandHeart, Calendar, ExternalLink } from "lucide-react";
import socialResponsibilityImage from "@/assets/social.jpg";

const SocialResponsibility = () => {
  const initiatives = [
    {
      title: "Community Education Program",
      description: "Teaching basic literacy and computer skills to underprivileged communities",
      impact: "500+ beneficiaries",
      category: "Education"
    },
    {
      title: "Environmental Conservation Drive",
      description: "Tree plantation and waste management awareness campaigns",
      impact: "1000+ trees planted",
      category: "Environment"
    },
    {
      title: "Healthcare Awareness Camps",
      description: "Free health checkups and awareness programs in rural areas",
      impact: "300+ people served",
      category: "Healthcare"
    },
    {
      title: "Digital India Initiative",
      description: "Promoting digital literacy among elderly and rural populations",
      impact: "200+ people trained",
      category: "Technology"
    }
  ];

  const upcomingEvents = [
    { title: "Blood Donation Camp", date: "March 10, 2024", type: "Healthcare" },
    { title: "Tree Plantation Drive", date: "March 15, 2024", type: "Environment" },
    { title: "Old Age Home Visit", date: "March 20, 2024", type: "Community Service" },
    { title: "Cleanliness Drive", date: "March 25, 2024", type: "Environment" }
  ];

  const partnerships = [
    "Local NGOs",
    "Municipal Corporation",
    "Healthcare Centers",
    "Environmental Groups",
    "Educational Institutions",
    "Community Centers"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <div className="relative h-80 rounded-xl overflow-hidden mb-8">
            <img 
              src={socialResponsibilityImage} 
              alt="Social Responsibility Activities"
              className="w-full h-full object-cover"
            />
            
          </div>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About Social Responsibility Activities</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sarva Netrutva is a 5 days residential leadership training program (Lead for Change) which is a unique initiative by Kadi Sarva Vishwavidyalaya from December 2009. Till date 41 programs have been conducted through which 2665 students from various colleges of KSV got benefited. Sarva Netrutva aims to bring holistic development of students which help them to become a noble citizen who contribute in nation building. The whole program works on transforming society through changes in individual and relationships, starting with their own life. It helps in inculcate good habits and develop the leadership qualities with an aim to provide social services to the society/nation. Thus “Nation Building through Character Building is a main motto of the program.”

With the effective use of Meditation, Yoga, Pranayama, Group Task, Games, Learning from films, Role Plays, Interaction with unsung heroes, field (Social) visit and many leadership processes this training invokes attitude of service, brotherhood and responsibility toward society/nation in the participants.
            </p>
           <p className="text-muted-foreground leading-relaxed mb-4">
            Through various activities it nurtures skills like public speaking, mass motivation, life skills, problem solving skill, team building, time management etc in participants. It increases confidence in the youth, thus this program helps the participants in overall development of leadership skills. For continuous learning, university schedule Sarva Netrutva Follow Up session to charge their minds and to motivate students on regular basis.
           </p>
            
            <div className="flex justify-center">
             
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialResponsibility;
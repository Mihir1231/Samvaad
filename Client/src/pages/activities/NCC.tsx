import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import nccImg from "@/assets/ncc.jpg";

const NCC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-12 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <img 
            src={nccImg} 
            alt="NCC Activities"
            className="w-full h-80 object-cover rounded-lg shadow-lg mb-6"
          />
          <h1 className="text-4xl font-bold text-primary mb-4">National Cadet Corps (NCC)</h1>
        </div>

        {/* About Section */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About National Cadet Corps (NCC)</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              NCC provides a suitable environment to motivate the youth to take up a career in the Armed Forces and Develop Character,Comradeship,Discipline,Leadership,Secular Outlook, Spirit of Adventure and  Ideals of Selfless Service among the Youth of the Country.

LDRP is having 50 seats of NCC which is running under 9 BT Gujarat Ahmedabad, NCC.

Cadets are having parade on every Monday.

Every year Cadets have celebrated Kargil Vijay Diwas, Republic Day and Independence Day and have  given their services in every college events and programme

Cadets have attended Advance Leadership Camp, Basic Leadership Camp, National Integration Camp, CATC and NCC National Games.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our NCC unit conducts regular training sessions, camps, and adventure 
              activities that help cadets develop physical fitness, mental alertness, 
              and leadership qualities. Cadets participate in various national and 
              state-level competitions and camps.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              The NCC program instills values of patriotism, national integration, 
              and social service. Our cadets actively participate in community service, 
              disaster management, and various social awareness campaigns, contributing 
              positively to society.
            </p>
            
            <div className="flex justify-center">
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NCC;
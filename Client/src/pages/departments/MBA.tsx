import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mbaImg from "@/assets/mba.jpg";
import faculty16 from "@/assets/faculty-16.jpg";
import faculty17 from "@/assets/faculty-17.jpg";
import faculty18 from "@/assets/faculty-18.jpg";

const MBA = () => {
  const facultyList = [
    {
      name: "Dr. Vinitkumar M.Mistri",
      designation: "Associate Professor and Head",
      qualification: "	Ph. D., MBA (Marketing)",
      experience: "20 years",
      specialization: "Strategic Mgt, Marketing Mgt and International Business",
      image: faculty16
    },
    {
      name: "	Dr. Sejal Acharya",
      designation: "Assistant Professor",
      qualification: 	"Ph.D., MBA (Marketing) , BE (Computer)",
      experience: "19 years",
      specialization: "IT, Marketing, HR, Statistics",
      image: faculty17
    },
    {
      name: "	Dr. Hemali G.. Broker",
      designation: "Assistant Professor",
      qualification: "PhD. , MBA (Finance)",
      experience: "18 years",
      specialization: "	Finance",
      image: faculty18
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        

        {/* Department Description */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About the Program</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The institute has started an additional MBA program within the Engineering College from the academic year 2006-07.

This institute of professional education is housed in the sprawling 10-acre campus situated in picturesque locales of Gandhinagar. Right from their inception this institute sincerely committed itself to the cause of professional education and hence has spread no efforts to create an academic environment conducive to effective learning. In fact, the institute possesses all relevant and necessary infrastructural facilities right from its inception.

To this end, the institute has taken certain concrete and positive initiatives in molding the student’s attitudes towards their work, towards others and most importantly, towards themselves. The attitudes would distinguish them from the others, help them to be humble, to be open to change yet be prudent enough to judge when and which change is for better.
            </p>
            
          </CardContent>
        </Card>

        {/* Faculty Section */}
        <div className="animate-fade-in">
          <h2 className="text-3xl font-bold text-primary mb-8">Our Faculty</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facultyList.map((faculty, index) => (
              <Card key={index} className="hover-scale transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <img 
                    src={faculty.image} 
                    alt={faculty.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-md"
                  />
                  <h3 className="font-bold text-lg text-primary mb-2">{faculty.name}</h3>
                  <p className="text-accent font-medium mb-2">{faculty.designation}</p>
                  <p className="text-sm text-muted-foreground mb-1">{faculty.qualification}</p>
                  <p className="text-sm text-muted-foreground mb-2">Experience: {faculty.experience}</p>
                  <p className="text-sm text-primary font-medium">
                    Specialization: {faculty.specialization}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MBA;
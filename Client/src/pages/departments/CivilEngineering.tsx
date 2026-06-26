import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import civilEngineeringImg from "@/assets/civil-engineering.jpg";
import faculty10 from "@/assets/faculty-10.jpg";
import faculty11 from "@/assets/faculty-11.jpg";
import faculty12 from "@/assets/faculty-12.jpg";

const CivilEngineering = () => {
  const facultyList = [
    {
      name: "MS. MEGHA BHATT",
      designation: "Head of Department",
      qualification: "M.TECH (STRUCTURAL DESIGN) (CEPT UNIVERSITY), Ph.D (PURSUING)",
      experience: "10 years",
      specialization: "	STRUCTURAL DESIGN",
      image: faculty10
    },
    {
      name: "	MS. LABDHI SHETH",
      designation: "Assistant Professor",
      qualification: "M.E (ENVIRONMENTAL) (L.D. COLLEGE OF ENGINEERING)",
      experience: "8 years",
      specialization: "ENVIRONMENT ENGINEERING",
      image: faculty11
    },
    {
      name: "MR. VIKAS D. BHAVSAR",
      designation: "Assistant Professor",
      qualification: "M.TECH(ENVIRONMENTAL)",
      experience: "8 years",
      specialization: "	ENVIRONMENTAL ENGINEERING",
      image: faculty12
    },
    {
      name: "	MS. ANKITA J. PARIKH",
      designation: "Assistant Professor",
      qualification: "	M.E (WATER RESOURCES MANAGEMENT)",
      experience: "13 years",
      specialization: "WATER RESOURCES MANAGEMENT",
      image: "https://www.ldrp.ac.in/images/faculty/9_AJP.jpg"
    },
    {
      name: "		MS. MAUNI N. MODI",
      designation: "Assistant Professor",
      qualification: "	M.TECH (GEOTECHNICAL) (D.D.I.T, NADIAD)",
      experience: "10 years",
      specialization: "	GEOTECHNICAL ENGINEERING",
      image: "https://www.ldrp.ac.in/images/faculty/9_73_Mauni-modi_civil_ap.jpg"
    },
    {
      name: "		MS. RINNI SHAH",
      designation: "Assistant Professor",
      qualification: "	M.E (INFRASTRUCTURE) (LDRP, GANDHINAGAR)",
      experience: "5 years",
      specialization: "	WATER RESOURCES",
      image: "https://www.ldrp.ac.in/images/faculty/9_rinni%20photo.jpg"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}


        {/* Department Description */}
        <Card className="mb-12 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">About the Department</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Department of civil engineering has been functioning since 2011 and has grown into a full-fledged department with specializations in all the major areas of Civil Engineering. The department has produced several eminent engineers who have made significant contributions in the planning and execution of Civil Engineering projects in India as well as abroad. The department has highly qualified faculty members engaged in teaching with the aim of achieving excellence in various fields. The faculty members are specialized in different disciplines of Civil Engineering.
 

Civil Engineering deals with creating designs, constructing and maintaining physical structures including rails, roads, bridges, buildings, dams, etc. Civil Engineering is one of the highly critical engineering domains where a perfectly built structure can facilitate people with much comfort but a minor mistake made by an engineer can take away hundreds of lives in seconds. So, deep knowledge and perfect understanding of the concepts and requirements of civil engineering is highly desirable. This perfection in learning starts with the search of a good engineering college whose only aim is to produce highly skilled professionals with adequate knowledge and competency. LDRP-ITR is the Best Civil Engineering College in Gandhinagar and Ahmadabad Region end up this search by providing highly quality and reliable teaching and training curriculum and facilities to the students..
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

export default CivilEngineering;
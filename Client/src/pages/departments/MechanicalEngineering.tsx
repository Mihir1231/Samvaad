import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mechanicalEngineeringImg from "@/assets/mechanical-engineering.jpg";
import faculty13 from "@/assets/faculty-13.jpg";
import faculty14 from "@/assets/faculty-14.jpg";
import faculty15 from "@/assets/faculty-15.jpg";

const MechanicalEngineering = () => {
  const facultyList = [
    {
      name: "PROF. (DR.) ALKESH M. MAVANI",
      designation: "Proffesor",
      qualification: "	PH.D., M.E MECH",
      experience: "27 years",
      specialization: "	Thermal Engineering , CFD, Renewable Energy",
      image: faculty13
    },
    {
      name: "MRS. PRAGNA R PATEL",
      designation: "Associate Professor",
      qualification: "	M.E (I.C/AUTO)",
      experience: "26 years",
      specialization: "Mechanical -IC/Auto",
      image: faculty14
    },
    {
      name: "	Dr. KAUSHAL H. BHAVSAR",
      designation: "	Associate Professor",
      qualification: "M.Tech (CAD/CAM), Ph.D. (KSV)",
      experience: "13 years",
      specialization: "	CAD/CAM, FEA, FSW, Product Development, 3D PRINTING-RPT, CFD",
      image: faculty15
    },
     {
      name: "	MS. VIDYA NAIR",
      designation: "Associate Professor",
      qualification: "	M.E MECH (M/C DESIGN) ",
      experience: "25 years",
      specialization: "	Production",
      image: "https://www.ldrp.ac.in/images/faculty/5_68_vidya%20nair.jpg"
    },
     {
      name: "		MR. NEEL JOSHI",
      designation: "	Assistant Professor",
      qualification: "		M.E. (Thermal)",
      experience: "14 years",
      specialization: "	Thermal Engineering",
      image: "https://www.ldrp.ac.in/images/faculty/NeelJoshi.jpg"
    },
     {
      name: "	DR. ANKIT A DARJI",
      designation: "Associate Professor",
      qualification: "		PH.D., M.E (PRODUCTION)",
      experience: "16 years",
      specialization: "	Production",
      image: "https://www.ldrp.ac.in/images/faculty/5_68_ANKIT%20DARJI.jpg"
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
              The Department of Mechanical Engineering provides comprehensive education in the 
              design, analysis, manufacturing, and maintenance of mechanical systems. Our program 
              covers fundamental areas including thermodynamics, fluid mechanics, machine design, 
              manufacturing processes, and materials science.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We integrate traditional mechanical engineering principles with modern technologies 
              such as computer-aided design, robotics, and automation. Our curriculum emphasizes 
              both theoretical understanding and practical application, preparing students for 
              diverse career opportunities in automotive, aerospace, manufacturing, and energy sectors.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The department features state-of-the-art laboratories including thermal engineering, 
              fluid mechanics, manufacturing technology, and CAD/CAM labs. Students gain hands-on 
              experience with modern machining tools, testing equipment, and simulation software, 
              ensuring they are well-prepared for industrial challenges.
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

export default MechanicalEngineering;
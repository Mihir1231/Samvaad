import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import electronicsCommunicationImg from "@/assets/electronics-communication.jpg";
import faculty7 from "@/assets/faculty-7.jpg";
import faculty8 from "@/assets/faculty-8.jpg";
import faculty9 from "@/assets/faculty-9.jpg";

const ElectronicsCommunication = () => {
  const facultyList = [
    {
      name: "DR. SHRIDHAR E. MENDHE",
      designation: "Head of Department",
      qualification: "Ph.D. in Electronics Engineering",
      experience: "30 years",
      specialization: "	Antenna and Wave Propagation",
      image: faculty7
    },
    {
      name: "Prof. KHUSHBU R. JOSHI",
      designation: "Assistant Professor",
      qualification: "	M.E.(CSE), Ph.D. (Pursuing)",
      experience: "17 years",
      specialization: "Electronics & Comm. and Sate. Comm",
      image: faculty8
    },
    {
      name: "Prof. PRASHANTKUMAR P. OZA",
      designation: "Assistant Professor",
      qualification: "Ph.D. (Pursuing)",
      experience: "20 years",
      specialization: " Embedded Systems, VLSI, IoT",
      image: faculty9
    },
    {
      name: "DR. DILIP H. PATEL",
      designation: "Assistant Professor",
      qualification: "	Ph.D.",
      experience: "23 years",
      specialization: "	Optical Networks,Wireless Comm.",
      image: "https://www.ldrp.ac.in/images/faculty/3_Prof.%20DILIP%20H.%20PATEL%20Assistant%20Professor.jpg"
    },
    {
      name: "MR. PIYUSH R. KAPADIYA",
      designation: "	Assistant Professor",
      qualification: "	Ph.D. (Pursuing)",
      experience: "19 years",
      specialization: "	VLSI, Digital Logic Design",
      image: "https://www.ldrp.ac.in/images/faculty/3_Mr.%20PIYUSH%20R.%20KAPADIYA%20Lecturer.jpg"
    },
    {
      name: "MS. PAYAL D. SHAH",
      designation: "Assistant Professor",
      qualification: "	M.Tech. (VLSI), Ph.D. (Pursuing)  ",
      experience: "17 years",
      specialization: "VLSI and DLD",
      image: "https://www.ldrp.ac.in/images/faculty/3_Ms.%20PAYAL%20SHAH%20Lecturer.jpg"
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
              The EC Engineering (Electronics and Communication) Department was established in year 2006. The Department started with under graduate programme in Electronics and Communication Engineering.

The first most prime important mission of the EC department is to produce the engineer to use their skill for entrepreneurship. The Department has well qualified faculties and technical assistants. The Department has reach library with technical journals. Our efforts will be to have the proper placement of the Graduate engineers through our LDRP-ITR. Contribute to overall techno-economical development of the State in particular and Nation in general and improve quality of life of communities.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We focus on cutting-edge technologies including VLSI design, wireless communication, 
              digital signal processing, microwave engineering, and optical communication. Our 
              curriculum is designed to meet the evolving needs of the electronics and communication 
              industry, ensuring graduates are industry-ready.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The department features well-equipped laboratories for electronic circuits, 
              communication systems, microprocessors, and VLSI design. Students gain hands-on 
              experience with modern instrumentation and industry-standard software tools, 
              preparing them for successful careers in the electronics sector.
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

export default ElectronicsCommunication;
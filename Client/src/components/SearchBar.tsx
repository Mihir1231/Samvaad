import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Computer Engineering",
    "MBA Admissions",
    "Placement Records"
  ]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock search data - replace with actual search functionality
  const searchData = [
    { type: "Department", title: "Computer Engineering", url: "/departments/computer-engineering", description: "Learn about our CS department and programs" },
    { type: "Department", title: "Information Technology", url: "/departments/information-technology", description: "IT programs and curriculum details" },
    { type: "Department", title: "Mechanical Engineering", url: "/departments/mechanical-engineering", description: "Mechanical engineering courses and facilities" },
    { type: "Activity", title: "Placement Cell", url: "/activities/placement", description: "Career opportunities and placement statistics" },
    { type: "Activity", title: "Sports Activities", url: "/activities/sports", description: "Athletic programs and sports facilities" },
    { type: "Cell", title: "Research Cell", url: "/cells/m.-m.-patel-students-research-project-cell", description: "Student research opportunities and projects" },
    { type: "Cell", title: "Library", url: "/cells/library", description: "Library resources and digital collections" },
    { type: "Page", title: "About Us", url: "/about", description: "Learn more about our college history and mission" },
    { type: "Page", title: "Contact", url: "/contact", description: "Get in touch with us" }
  ];

  const trendingSearches = [
    "Admission Process",
    "Faculty Login",
    "Research Projects",
    "Campus Life",
    "Placement Statistics"
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = searchData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches
      const updated = [searchQuery, ...recentSearches.filter(item => item !== searchQuery)].slice(0, 5);
      setRecentSearches(updated);
      
      // Perform search
      handleSearch(searchQuery);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
    setIsOpen(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative group">
            <Input
              type="text"
              placeholder="Search departments, activities, faculty..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onFocus={() => setIsOpen(true)}
              className="h-14 pl-12 pr-20 text-lg bg-white/95 backdrop-blur-sm border-2 border-primary/20 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:border-primary focus:ring-4 focus:ring-primary/20 group-hover:border-primary/40"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
            
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Search className="h-5 w-5 text-white" />
            </Button>
          </div>
        </form>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-hidden bg-white/95 backdrop-blur-sm border shadow-2xl rounded-2xl z-50">
          <CardContent className="p-0">
            {searchQuery.trim() === "" ? (
              // Show recent and trending searches when no query
              <div className="p-6 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => handleQuickSearch(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Trending Searches</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                        onClick={() => handleQuickSearch(search)}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              // Show search results
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/50 last:border-b-0"
                    onClick={() => {
                      window.location.href = result.url;
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1 text-xs">
                        {result.type}
                      </Badge>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">{result.title}</h4>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // No results found
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try searching for departments, activities, or general information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
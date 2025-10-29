import { useState } from "react";
import { Search } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export function LocationInput({ onSearch }) {
  const [location, setLocation] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location.trim());
    }
  };

  return (
      <form onSubmit={handleSubmit} className="w-100 d-flex justify-content-center mb-4">
        <div className="input-group" style={{ maxWidth: "500px" }}>
          <input
            ref={ref}
            type="text"
            className="form-control form-control-lg"
            placeholder="Enter city name..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Location search"
            data-testid="input-location"
          />
          <button type="submit" className="btn btn-primary btn-lg d-flex align-items-center" data-testid="button-search-location">
            <Search className="me-2" />
            Search
          </button>
        </div>
      </form>
    );
}

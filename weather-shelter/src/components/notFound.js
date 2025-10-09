import React from "react";
import { AlertCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function NotFound() {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card w-100" style={{ maxWidth: "24rem", margin: "1rem" }}>
        <div className="card-body pt-4">
          <div className="d-flex align-items-center mb-3 gap-2">
            <AlertCircle className="text-danger" size={32} />
            <h1 className="h4 fw-bold mb-0">404 Page Not Found</h1>
          </div>
          <p className="text-secondary mt-3">
            Did you forget to add the page to the router?
          </p>
        </div>
      </div>
    </div>
  );
}

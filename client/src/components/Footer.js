// client/src/components/Footer.js

import React from "react";
import "./Footer.css"; // Optional: for custom styling

const Footer = () => {
  return (
    <div className="footer">
      <p>
        &copy;{" "}
        <a
          href="https://www.linkedin.com/in/daniel-portela-byrne-2463851b2/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Daniel Portela Byrne
        </a>{" "}
        2024
      </p>
    </div>
  );
};

export default Footer;

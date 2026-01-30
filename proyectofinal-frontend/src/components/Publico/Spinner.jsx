import React from "react";
import "../../global.css";

const Spinner = ({ overlay = false, message = "" }) => {
  if (overlay) {
    return (
      <div className="spinner-overlay" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        {message && <div className="spinner-message">{message}</div>}
      </div>
    );
  }

  return (
    <div className="spinner-inline" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      {message && <span className="spinner-message-inline">{message}</span>}
    </div>
  );
};

export default Spinner;

import React, { useEffect, useRef } from "react";
import ThemeToggle from "../components/Publico/ThemeToggle";

const PageWithTitle = ({ title, children }) => {
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const prev = previousTitle.current;
    const newTitle = title ? `SerenVoice - ${title}` : prev;
    document.title = newTitle;
    return () => {
      document.title = prev;
    };
  }, [title]);

  return (
    <>
      <ThemeToggle />
      {children}
    </>
  );
};

export default PageWithTitle;

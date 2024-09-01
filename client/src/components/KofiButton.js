// client/src/components/KofiButton.js

import React, { useEffect } from "react";

const KofiButton = () => {
  useEffect(() => {
    const scriptId = "kofi-widget-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
      script.async = true;
      script.onload = () => {
        if (window.kofiWidgetOverlay) {
          window.kofiWidgetOverlay.draw("danielportelabyrne", {
            type: "floating-chat",
            "floating-chat.donateButton.text": "Support me",
            "floating-chat.donateButton.background-color": "#f45d22",
            "floating-chat.donateButton.text-color": "#fff",
          });
        }
      };
      document.body.appendChild(script);
    } else {
      // If the script already exists, just initialize the widget
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.draw("danielportelabyrne", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Support me",
          "floating-chat.donateButton.background-color": "#f45d22",
          "floating-chat.donateButton.text-color": "#fff",
        });
      }
    }

    return () => {
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return null;
};

export default KofiButton;

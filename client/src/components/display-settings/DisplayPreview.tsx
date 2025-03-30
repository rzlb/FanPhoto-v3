import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import "../../styles/display.css";

interface DisplayPreviewProps {
  settings: {
    displayFormat: string;
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    textPosition: string;
    textAlignment: string;
    textPadding: number;
    textMaxWidth: string;
    textBackground: boolean;
    textBackgroundColor: string;
    textBackgroundOpacity: number;
    backgroundPath: string | null;
    logoPath: string | null;
    showCaptions?: boolean;
  };
}

export default function DisplayPreview({ settings }: DisplayPreviewProps) {
  // Set CSS variables for preview styling
  useEffect(() => {
    const previewRoot = document.getElementById('display-preview-container');
    if (!previewRoot) return;
    
    previewRoot.style.setProperty('--text-color', settings.fontColor);
    previewRoot.style.setProperty('--text-font-family', settings.fontFamily);
    previewRoot.style.setProperty('--text-font-size', `${Math.max(8, settings.fontSize / 2)}px`);
    previewRoot.style.setProperty('--text-padding', `${Math.max(2, settings.textPadding / 2)}px`);
    
    // Set border styles
    previewRoot.style.setProperty('--border-style', settings.borderStyle);
    previewRoot.style.setProperty('--border-width', `${settings.borderWidth/2}px`);
    previewRoot.style.setProperty('--border-color', settings.borderColor);
    
    // Calculate RGBA background color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgbColor = hexToRgb(settings.textBackgroundColor);
    if (rgbColor) {
      const rgba = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${settings.textBackgroundOpacity / 100})`;
      previewRoot.style.setProperty('--text-background-color', rgba);
    }
    
    // Set max width based on selected option
    const maxWidthValue = settings.textMaxWidth === 'full' ? '100%' : 
                      settings.textMaxWidth === '3/4' ? '75%' : 
                      settings.textMaxWidth === '1/2' ? '50%' : '33.333%';
    previewRoot.style.setProperty('--text-max-width', maxWidthValue);
  }, [
    settings.fontColor, 
    settings.fontFamily, 
    settings.fontSize, 
    settings.textPadding, 
    settings.textBackgroundColor, 
    settings.textBackgroundOpacity, 
    settings.textMaxWidth,
    settings.borderStyle,
    settings.borderWidth,
    settings.borderColor
  ]);

  // Create background style
  const backgroundStyle = settings?.backgroundPath 
    ? { 
        backgroundImage: `url(${settings.backgroundPath})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { backgroundColor: '#f0f0f0' };

  // Border styles for preview elements
  const getBorderStyle = () => {
    if (settings.borderStyle === "none") return {};
    return {
      borderStyle: settings.borderStyle,
      borderWidth: `${settings.borderWidth/2}px`,
      borderColor: settings.borderColor
    };
  };

  // Sample images for preview
  const sampleImages = [
    {
      id: 1,
      originalPath: "https://placehold.co/400x300/667788/ffffff?text=Sample+Photo+1",
      submitterName: "John Doe",
      caption: "This is the first example photo caption",
    },
    {
      id: 2,
      originalPath: "https://placehold.co/400x300/886677/ffffff?text=Sample+Photo+2",
      submitterName: "Jane Smith",
      caption: "This is the second example photo caption",
    },
    {
      id: 3,
      originalPath: "https://placehold.co/400x300/778866/ffffff?text=Sample+Photo+3",
      submitterName: "Bob Johnson",
      caption: "This is the third example photo caption",
    },
    {
      id: 4,
      originalPath: "https://placehold.co/400x300/668877/ffffff?text=Sample+Photo+4",
      submitterName: "Alice Brown",
      caption: "This is the fourth example photo caption",
    }
  ];

  // Generate preview based on display format
  const renderPreview = () => {
    const format = settings.displayFormat;
    const sampleImage = sampleImages[0];
    
    switch (format) {
      case "16:9-default":
        return (
          <div 
            className="preview-carousel"
            style={getBorderStyle()}
          >
            {/* Above image text */}
            {settings.textPosition === "above-image" && settings.showCaptions && (
              <div className={`preview-text-above text-align-${settings.textAlignment}`}>
                <div className={`preview-text ${settings.textBackground ? 'with-text-background' : ''}`}>
                  <p className="font-bold" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                    {sampleImage.submitterName}
                  </p>
                  <p className="mt-1" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                    {sampleImage.caption}
                  </p>
                </div>
              </div>
            )}
            
            {/* Image container */}
            <div className="preview-image-container">
              <img 
                src={sampleImage.originalPath} 
                alt="Preview" 
                className="preview-image" 
              />
              
              {/* Overlay caption */}
              {settings.textPosition === "overlay-bottom" && settings.showCaptions && (
                <div className={`preview-text-overlay text-align-${settings.textAlignment}`}>
                  <div className={`preview-text ${settings.textBackground ? 'with-text-background' : ''}`}>
                    <p className="font-bold" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                      {sampleImage.submitterName}
                    </p>
                    <p className="mt-1" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                      {sampleImage.caption}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Overlay top caption */}
              {settings.textPosition === "overlay-top" && settings.showCaptions && (
                <div className={`preview-text-overlay-top text-align-${settings.textAlignment}`}>
                  <div className={`preview-text ${settings.textBackground ? 'with-text-background' : ''}`}>
                    <p className="font-bold" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                      {sampleImage.submitterName}
                    </p>
                    <p className="mt-1" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                      {sampleImage.caption}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Below image text */}
            {settings.textPosition === "below-image" && settings.showCaptions && (
              <div className={`preview-text-below text-align-${settings.textAlignment}`}>
                <div className={`preview-text ${settings.textBackground ? 'with-text-background' : ''}`}>
                  <p className="font-bold" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                    {sampleImage.submitterName}
                  </p>
                  <p className="mt-1" style={{ fontFamily: settings.fontFamily, color: settings.fontColor }}>
                    {sampleImage.caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      
      case "16:9-multiple":
        return (
          <div className="preview-grid-layout" style={{ aspectRatio: "16/9", ...getBorderStyle() }}>
            {sampleImages.map((image, index) => (
              <div key={image.id} className="preview-grid-item">
                <img src={image.originalPath} alt={`Preview ${index + 1}`} className="preview-grid-image" />
                {settings.showCaptions && (
                  <div className="grid-caption" style={{
                    padding: "4px",
                    backgroundColor: "rgba(0,0,0,0.7)",
                    color: "#ffffff",
                    fontSize: "8px",
                    textAlign: "center",
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0"
                  }}>
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      
      case "text-only":
        return (
          <div 
            className="preview-text-only" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              aspectRatio: "16/9", 
              ...getBorderStyle() 
            }}
          >
            <div 
              className={`preview-text-content text-align-${settings.textAlignment}`}
              style={{ 
                fontFamily: settings.fontFamily,
                width: settings.textMaxWidth === 'full' ? '90%' : 
                       settings.textMaxWidth === '3/4' ? '75%' : 
                       settings.textMaxWidth === '1/2' ? '50%' : '33.333%',
                padding: `${Math.max(4, settings.textPadding/2)}px`,
                backgroundColor: settings.textBackground ? 'var(--text-background-color)' : 'transparent',
                borderRadius: '0.375rem',
              }}
            >
              <h2 className="font-bold mb-1" style={{ color: settings.fontColor, fontSize: `${Math.max(12, settings.fontSize/1.5)}px` }}>
                Welcome to the Event!
              </h2>
              <p style={{ color: settings.fontColor, fontSize: `${Math.max(8, settings.fontSize/2)}px` }}>
                This is a text-only display format. It's perfect for announcements, welcome messages, or any content that doesn't require images.
              </p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="preview-carousel">
            <div className="preview-image-container">
              <img src={sampleImage.originalPath} alt="Preview" className="preview-image" />
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden mt-8">
      <CardContent className="p-0">
        <div 
          id="display-preview-container"
          className="preview-container"
          style={{ 
            ...backgroundStyle,
            aspectRatio: "16/9",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Logo */}
          {settings.logoPath && (
            <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 10 }}>
              <img src={settings.logoPath} alt="Logo" style={{ height: "24px" }} />
            </div>
          )}
          
          {renderPreview()}
        </div>
      </CardContent>
    </Card>
  );
} 
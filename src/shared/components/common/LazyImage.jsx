import React from "react";
import { CG } from "../../styles/componentStyles.js";

export function LazyImage({
  src,
  alt = "",
  style = {},
  containerStyle,
  imgStyle,
  onError,
  className,
}) {
  const [loaded, setLoaded] = React.useState(false);
  const imgRef = React.useRef(null);

  const cStyle = containerStyle || style;
  const iStyle = imgStyle || {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  return (
    <div ref={imgRef} className={className} style={CG.lazyWrap(cStyle)}>
      {src && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            setLoaded(true);
            onError && onError(e);
          }}
          style={CG.lazyImage(iStyle, loaded)}
        />
      )}

      {!loaded && (
        <div style={CG.lazyPlaceholder}>
          <div style={CG.lazySpinner} />
        </div>
      )}
    </div>
  );
}

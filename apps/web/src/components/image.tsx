export function OImage({
  src,
  width,
  height,
  alt,
  className,
  style,
  ...props
}: {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}) {
  const url_as_base64 = Buffer.from(src).toString("base64");

  const optimizedUrl = `https://imgproxy.folkscommunity.com/plain/${width && height ? `rs:fill:${width * 3}:${height * 3}:0/` : ""}${url_as_base64}.png`;

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

type LogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

export function Logo({ variant = "dark", className = "" }: LogoProps) {
  return (
    <span
      className={`logo ${variant === "light" ? "logo-light" : ""} ${className}`.trim()}
      aria-label="TGS Saudi"
      role="img"
    >
      <span className="logo-mark" aria-hidden="true">
        tgs
      </span>
      <span className="logo-word" aria-hidden="true">
        Saudi
      </span>
    </span>
  );
}

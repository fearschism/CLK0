import markUrl from "../assets/tgs-mark.png";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <span className={`logo ${className}`.trim()} aria-label="TGS Saudi" role="img">
      <img className="logo-mark" src={markUrl} alt="" aria-hidden="true" />
      <span className="logo-word" aria-hidden="true">
        Saudi
      </span>
    </span>
  );
}

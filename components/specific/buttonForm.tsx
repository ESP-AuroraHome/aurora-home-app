import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

interface Props {
  loading: boolean;
  text: string;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "liquid-glass";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
}

const ButtonForm = ({
  loading,
  text,
  loadingText,
  disabled,
  className,
  variant = "default",
  onClick,
  type = "submit",
}: Props) => {
  const liquidGlassClasses =
    "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/15 hover:border-white/30 active:bg-white/20 transition-all shadow-lg";

  return (
    <Button
      className={cn(
        variant === "liquid-glass" ? liquidGlassClasses : "bg-blue-500",
        "w-full",
        className,
      )}
      size={"lg"}
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
    >
      {loading ? (
        <>
          <Spinner
            className={variant === "liquid-glass" ? "text-white" : undefined}
          />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
};

export default ButtonForm;

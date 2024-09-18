import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./ui/button";
import { Loader2Icon } from "lucide-react";

interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
}
 
const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  disabled,
  className,
  ...props
}) => {
  return ( 
      <Button
      disabled={loading || disabled}
      className={cn("flex items-center gap-2", className)}
      {...props}
      >
        {loading && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {props.children}
      </Button>
   );
}
 
export default LoadingButton;

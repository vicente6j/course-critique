import { FC } from "react";
import { Button as NextButton, ButtonGroup} from "@nextui-org/button";

interface ButtonProps {
  onClick: () => void;
  text: string;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | undefined;
  isDisabled?: boolean;
  size?: string;
}

const Button: FC<ButtonProps> = ({
  onClick,
  text,
  color,
}: ButtonProps) => {
  return (
    <NextButton
      onClick={onClick}
      size="md"
      color={color ? color : "default"}
    >
      {text}
    </NextButton>
  )
}

export default Button;
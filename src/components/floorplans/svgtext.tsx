export type TextProps = React.SVGTextElementAttributes<SVGTextElement> & {
  title: string;
  transform: string;
};

export const TextItem = ({ title, transform, ...props }: TextProps) => {
  return (
    <text
      className="fill-current"
      fontFamily="Excalifont, Xiaolai, Segoe UI Emoji"
      fontSize={36}
      transform={transform}
      x="0"
      y="32"
      {...props}
    >
      {title}
    </text>
  );
};

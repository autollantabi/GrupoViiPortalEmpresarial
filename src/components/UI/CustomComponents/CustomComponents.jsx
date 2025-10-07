import styled from "styled-components";

const CustomDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  padding: 10px;
  margin: 0;
  width: 100%;
`;

const StyledText = styled.span`
  font-family: inherit;
  display: inline-block;
  color: ${({ theme, color }) => color || theme.colors.textPrimary};
  font-weight: ${({ $weight }) => $weight || "400"};
  font-size: ${({ size }) => size || "16px"};
  text-align: ${({ $align }) => $align || "left"};
`;

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  user-select: none;
  cursor: ${({ onClick, disabled }) =>
    onClick ? (disabled ? "not-allowed" : "pointer") : "default"};
  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  background-color: ${({ theme, variant }) =>
    variant === "contained" ? theme.colors.background : "transparent"};
  border: ${({ theme, variant }) =>
    variant === "outlined" ? `1px solid ${theme.colors.placeholder}` : "none"};
  box-shadow: 0 5px 10px ${({ theme }) => theme.colors.boxShadow},
    0 15px 40px rgba(0, 0, 0, 0.05);
`;

const StyledImage = styled.img`
  display: flex;
  border-radius: 8px;
  object-fit: ${({ $objectFit }) => $objectFit || "cover"};
`;

// Estilos para el componente de checkbox
const StyledCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? "0.6" : "1")};
`;

const StyledCheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const StyledCheckmark = styled.span`
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  background-color: ${({ checked, theme }) =>
    checked ? theme.colors.primary : "#fff"};
  border: 1px solid
    ${({ checked, theme }) =>
      checked ? theme.colors.primary : theme.colors.borderColor || "#ccc"};
  border-radius: 3px;
  transition: all 0.2s ease-in-out;

  &:after {
    content: "";
    position: absolute;
    display: ${({ checked }) => (checked ? "block" : "none")};
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  &:hover {
    border-color: ${({ theme, disabled }) =>
      disabled ? theme.colors.borderColor : theme.colors.primary};
    box-shadow: ${({ disabled }) =>
      disabled ? "none" : "0 0 0 2px rgba(0, 102, 204, 0.1)"};
  }
`;

const StyledCheckboxLabel = styled.label`
  margin-left: 8px;
  font-size: 14px;
  color: ${({ $color, theme }) => $color || theme.colors.textPrimary};
  user-select: none;
`;

export const CustomContainer = ({
  style,
  children,
  justifyContent = "row",
  alignItems = "center",
  flexDirection = "center",
  height = "auto",
  width = "auto",
}) => {
  return (
    <CustomDiv
      style={{
        ...style,
        justifyContent: justifyContent,
        alignItems: alignItems,
        flexDirection: flexDirection,
        height: height,
        width: width,
      }}
    >
      {children}
    </CustomDiv>
  );
};

export const CustomContainerClickable = ({
  style,
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <CustomDiv style={style} onClick={!disabled ? onClick : undefined}>
      {children}
    </CustomDiv>
  );
};

export const CustomText = ({
  children,
  weight,
  size,
  color,
  align,
  onClick,
  style,
}) => (
  <StyledText
    onClick={onClick || undefined}
    $weight={weight}
    size={size}
    color={color}
    $align={align}
    style={style}
  >
    {children}
  </StyledText>
);

export const CustomCard = ({
  children,
  style,
  variant,
  onClick,
  disabled = false,
}) => (
  <StyledCard
    style={style}
    variant={variant}
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
  >
    {children}
  </StyledCard>
);

export const CustomImage = ({
  src,
  alt = "Image",
  width = "100%",
  height = "auto",
  objectFit = "cover",
  style = {},
  placeholder = "https://placehold.co/600x400?text=No+Image",
  lazy = true,
  onClick,
}) => (
  <StyledImage
    src={src}
    alt={alt}
    width={width}
    height={height}
    style={style}
    $objectFit={objectFit}
    loading={lazy ? "lazy" : "eager"}
    onError={(e) => (e.target.src = placeholder)}
    onClick={onClick}
  />
);

export const CustomCheckboxField = ({
  id,
  name,
  checked = false,
  onChange,
  label,
  labelColor,
  disabled = false,
  className,
  style,
  labelStyle,
  required = false,
}) => {
  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) onChange(e.target.name, e.target.checked);
  };

  return (
    <StyledCheckboxContainer
      className={className}
      style={style}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(name, !checked)}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <StyledCheckboxInput
          id={id}
          type="checkbox"
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          required={required}
        />
        <StyledCheckmark checked={checked} disabled={disabled} />
      </div>

      {label && (
        <StyledCheckboxLabel
          htmlFor={id}
          style={labelStyle}
          disabled={disabled}
          $color={labelColor}
        >
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </StyledCheckboxLabel>
      )}
    </StyledCheckboxContainer>
  );
};

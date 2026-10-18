export type PolicyCheck = {
  id: string;
  label: string;
  valid: boolean;
};

export function getPasswordPolicy(password: string): PolicyCheck[] {
  return [
    {
      id: "length",
      label: "Mínimo 10 caracteres",
      valid: password.length >= 10
    },
    {
      id: "uppercase",
      label: "Una letra mayúscula",
      valid: /[A-ZÁÉÍÓÚÑ]/.test(password)
    },
    {
      id: "lowercase",
      label: "Una letra minúscula",
      valid: /[a-záéíóúñ]/.test(password)
    },
    {
      id: "number",
      label: "Un número",
      valid: /\d/.test(password)
    },
    {
      id: "symbol",
      label: "Un símbolo",
      valid: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(password)
    }
  ];
}

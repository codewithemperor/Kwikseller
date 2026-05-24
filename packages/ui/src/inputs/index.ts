export {
  TextInput,
  PasswordInput,
  NumberInput,
  TextareaInput,
  DatePickerInput,
  DateRangePickerInput,
  TimeFieldInput,
  SelectInput,
  // convenience aliases
  Text,
  Password,
  Number,
  Textarea,
  DatePicker,
  DateRangePicker,
  Time,
  Select,
} from "./form-inputs";
export { FieldInput, FieldTextarea, FieldSelect } from "./plain-inputs";
export type { FieldInputProps, FieldTextareaProps, FieldSelectProps } from "./plain-inputs";

export type {
  BaseInputProps,
  TextInputProps,
  PasswordInputProps,
  NumberInputProps,
  TextareaInputProps,
  DatePickerInputProps,
  DateRangePickerInputProps,
  DateRange,
  TimeFieldInputProps,
} from "./form-inputs";

// OTP Components
export { OTPInput, OTPModal } from "./otp-input";
export type { OTPInputProps, OTPModalProps } from "./otp-input";

// Submit Button
export { SubmitButton } from "./submit-button";
export type { SubmitButtonProps } from "./submit-button";
export { AppButton } from "./app-button";
export type { AppButtonProps } from "./app-button";
export { AppSwitch } from "./app-switch";
export type { AppSwitchProps } from "./app-switch";
export { AppColorPicker } from "./app-color-picker";
export type { AppColorPickerProps } from "./app-color-picker";

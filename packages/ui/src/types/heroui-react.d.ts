declare module "@heroui/react" {
  import type React from "react";

  type AnyComponent = React.FC<any>;

  interface CalendarComponent extends AnyComponent {
    Cell: AnyComponent;
    Grid: AnyComponent;
    GridBody: AnyComponent;
    GridHeader: AnyComponent;
    Header: AnyComponent;
    HeaderCell: AnyComponent;
    NavButton: AnyComponent;
    YearPickerTrigger: AnyComponent;
    YearPickerTriggerHeading: AnyComponent;
    YearPickerTriggerIndicator: AnyComponent;
  }

  interface AvatarComponent extends AnyComponent {
    Fallback: AnyComponent;
    Image: AnyComponent;
  }

  interface BreadcrumbsComponent extends AnyComponent {
    Item: AnyComponent;
  }

  interface CardComponent extends AnyComponent {
    Content: AnyComponent;
  }

  interface DropdownComponent extends AnyComponent {
    Item: AnyComponent;
    Menu: AnyComponent;
    Popover: AnyComponent;
    Trigger: AnyComponent;
  }

  interface DateFieldComponent extends AnyComponent {
    Group: AnyComponent;
    Input: AnyComponent;
    InputContainer: AnyComponent;
    Segment: AnyComponent;
    Suffix: AnyComponent;
  }

  interface DatePickerComponent extends AnyComponent {
    Popover: AnyComponent;
    Trigger: AnyComponent;
    TriggerIndicator: AnyComponent;
  }

  interface DateRangePickerComponent extends DatePickerComponent {
    RangeSeparator: AnyComponent;
  }

  interface InputGroupComponent extends AnyComponent {
    Input: AnyComponent;
    Prefix: AnyComponent;
    Suffix: AnyComponent;
    TextArea: AnyComponent;
  }

  interface InputOTPComponent extends AnyComponent {
    Group: AnyComponent;
    Separator: AnyComponent;
    Slot: AnyComponent;
  }

  interface ListBoxComponent extends AnyComponent {
    Item: AnyComponent;
    ItemIndicator: AnyComponent;
    Section: AnyComponent;
  }

  interface NumberFieldComponent extends AnyComponent {
    DecrementButton: AnyComponent;
    Group: AnyComponent;
    IncrementButton: AnyComponent;
    Input: AnyComponent;
  }

  interface RangeCalendarComponent extends CalendarComponent {}

  interface SelectComponent extends AnyComponent {
    Indicator: AnyComponent;
    Popover: AnyComponent;
    Trigger: AnyComponent;
    Value: AnyComponent;
  }

  interface TableComponent extends AnyComponent {
    Body: AnyComponent;
    Cell: AnyComponent;
    Column: AnyComponent;
    Content: AnyComponent;
    Footer: AnyComponent;
    Header: AnyComponent;
    Row: AnyComponent;
    ScrollContainer: AnyComponent;
  }

  interface ToastApi {
    (title: string, options?: any): any;
    close(id: any): void;
    danger(title: string, options?: any): any;
    promise<T>(promise: Promise<T>, messages: any): Promise<T>;
    success(title: string, options?: any): any;
    warning(title: string, options?: any): any;
  }

  interface ToastComponent extends AnyComponent {
    Provider: AnyComponent;
  }

  interface TimeFieldComponent extends AnyComponent {
    Group: AnyComponent;
    Input: AnyComponent;
    Prefix: AnyComponent;
    Segment: AnyComponent;
    Suffix: AnyComponent;
  }

  export type DateValue = any;
  export type TimeValue = any;
  export type Key = React.Key;
  export type ColorChannel =
    | "hue"
    | "saturation"
    | "brightness"
    | "lightness"
    | "red"
    | "green"
    | "blue";
  export type ColorSpace = "hsb" | "hsl" | "rgb";

  export type SortDescriptor = {
    column?: React.Key;
    direction?: "ascending" | "descending";
  };

  export const Avatar: AvatarComponent;
  export const Breadcrumbs: BreadcrumbsComponent;
  export const Button: React.FC<any>;
  export const Calendar: CalendarComponent;
  export const Card: CardComponent;
  export const CardContent: React.FC<any>;
  export const Checkbox: React.FC<any>;
  export const Chip: React.FC<any>;
  export const cn: (...inputs: any[]) => string;
  export const DateField: DateFieldComponent;
  export const DatePicker: DatePickerComponent;
  export const DateRangePicker: DateRangePickerComponent;
  export const Description: React.FC<any>;
  export const Dropdown: DropdownComponent;
  export const FieldError: React.FC<any>;
  export const Form: React.FC<any>;
  export const Input: React.FC<any>;
  export const InputGroup: InputGroupComponent;
  export const InputOTP: InputOTPComponent;
  export const Label: React.FC<any>;
  export const ListBox: ListBoxComponent;
  export const NumberField: NumberFieldComponent;
  export const RangeCalendar: RangeCalendarComponent;
  export const Separator: React.FC<any>;
  export const Select: SelectComponent;
  export const Skeleton: React.FC<any>;
  export const Spinner: React.FC<any>;
  export const Surface: React.FC<any>;
  export const Switch: any;
  export const ColorPicker: any;
  export const ColorField: any;
  export const ColorArea: any;
  export const ColorSlider: any;
  export const ColorSwatch: any;
  export const Table: TableComponent;
  export const TextField: React.FC<any>;
  export const TimeField: TimeFieldComponent;
  export const Toast: ToastComponent;
  export const toast: ToastApi;

  export const Modal: React.FC<any>;
  export const ModalBackdrop: React.FC<any>;
  export const ModalBody: React.FC<any>;
  export const ModalContainer: React.FC<any>;
  export const ModalDialog: React.FC<any>;
  export const ModalFooter: React.FC<any>;
  export const ModalHeader: React.FC<any>;
  export const Drawer: any;
}

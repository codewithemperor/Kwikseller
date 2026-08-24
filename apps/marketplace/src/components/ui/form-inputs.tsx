"use client";

import React from "react";
import { Controller, FieldValues, Path } from "react-hook-form";
import type { DateValue, TimeValue } from "@heroui/react";
import {
  TextField,
  Label,
  FieldError,
  InputGroup,
  NumberField,
  Description,
  Calendar,
  DateField,
  DatePicker,
  DateRangePicker,
  RangeCalendar,
  TimeField,
  Select,
  ListBox,
  Checkbox,
} from "@heroui/react";
import { cn } from "@/lib/utils";
import type { Key } from "@heroui/react";
import {
  parseDate,
  parseAbsoluteToLocal,
  CalendarDate,
} from "@internationalized/date";
import { Eye, EyeOff } from "lucide-react";
const formInputGroupClass =
  "min-h-[52px] rounded-2xl border border-border bg-background text-[15px] shadow-sm outline-none ring-0 transition focus-within:border-border focus-within:outline-none focus-within:ring-0 focus-within:ring-transparent focus-within:shadow-sm data-[focus-visible=true]:outline-none data-[focus-visible=true]:ring-0 dark:border-white/10 dark:bg-background";
const formInputClass =
  "h-[52px] text-[15px] text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:text-white";

// ==================== BASE TYPES ====================

interface BaseInputProps<T extends FieldValues> {
  name: Path<T>;
  control: any;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  description?: string;
}

export type { BaseInputProps };

// ==================== TEXT INPUT ====================

interface TextInputProps<T extends FieldValues> extends BaseInputProps<T> {
  type?: "text" | "email" | "tel" | "url" | "password";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

export type { TextInputProps };

export function TextInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = "text",
  startContent,
  endContent,
  isRequired = false,
  isDisabled = false,
  className,
  description,
}: TextInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const { value, onChange, ...restField } = field;

        const formattedValue =
          typeof value === "string"
            ? value
            : value !== undefined && value !== null
              ? String(value)
              : "";

        return (
          <TextField
            className={className}
            isDisabled={isDisabled}
            isRequired={isRequired}
            isInvalid={!!error}
          >
            <Label>{label}</Label>
            <InputGroup className={formInputGroupClass}>
              {startContent && (
                <InputGroup.Prefix>{startContent}</InputGroup.Prefix>
              )}
              <InputGroup.Input
                {...restField}
                type={type}
                placeholder={placeholder}
                value={formattedValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(e.target.value)
                }
                className={formInputClass}
              />
              {endContent && (
                <InputGroup.Suffix>{endContent}</InputGroup.Suffix>
              )}
            </InputGroup>
            {description && !error && <Description>{description}</Description>}
            <FieldError>{error?.message}</FieldError>
          </TextField>
        );
      }}
    />
  );
}

// ==================== PASSWORD INPUT ====================

interface PasswordInputProps<T extends FieldValues> extends BaseInputProps<T> {
  startContent?: React.ReactNode;
}

export type { PasswordInputProps };

export function PasswordInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  startContent,
  isRequired = false,
  isDisabled = false,
  className,
  description,
}: PasswordInputProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TextField
          className={className}
          isDisabled={isDisabled}
          isRequired={isRequired}
          isInvalid={!!error}
        >
          <Label>{label}</Label>
          <InputGroup className={formInputGroupClass}>
            {startContent && (
              <InputGroup.Prefix>{startContent}</InputGroup.Prefix>
            )}
            <InputGroup.Input
              {...field}
              type={showPassword ? "text" : "password"}
              placeholder={placeholder}
              value={field.value ?? ""}
              className={formInputClass}
            />
            <InputGroup.Suffix>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </InputGroup.Suffix>
          </InputGroup>
          {description && !error && <Description>{description}</Description>}
          <FieldError>{error?.message}</FieldError>
        </TextField>
      )}
    />
  );
}

// ==================== NUMBER INPUT ====================

interface NumberInputProps<T extends FieldValues> extends BaseInputProps<T> {
  min?: number;
  max?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

export type { NumberInputProps };

export function NumberInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  min,
  max,
  step = 1,
  formatOptions,
  isRequired = false,
  isDisabled = false,
  className,
  description,
}: NumberInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <NumberField
          className={className}
          isDisabled={isDisabled}
          isRequired={isRequired}
          isInvalid={!!error}
          minValue={min}
          maxValue={max}
          step={step}
          formatOptions={formatOptions}
          value={
            field.value === undefined ||
            field.value === null ||
            Number.isNaN(field.value)
              ? undefined
              : field.value
          }
          onChange={(val: number) => {
            field.onChange(Number.isNaN(val) ? undefined : val);
          }}
        >
          <Label>{label}</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input placeholder={placeholder} />
            <NumberField.IncrementButton />
          </NumberField.Group>
          {description && !error && <Description>{description}</Description>}
          <FieldError>{error?.message}</FieldError>
        </NumberField>
      )}
    />
  );
}

// ==================== TEXTAREA INPUT ====================

interface TextareaInputProps<T extends FieldValues> extends BaseInputProps<T> {
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export type { TextareaInputProps };

export function TextareaInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  rows = 4,
  maxLength,
  showCount = false,
  isRequired = false,
  isDisabled = false,
  className,
  description,
}: TextareaInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const currentLength = (field.value ?? "").length;

        return (
          <TextField
            className={className}
            isDisabled={isDisabled}
            isRequired={isRequired}
            isInvalid={!!error}
          >
            <Label>{label}</Label>
            <InputGroup>
              <InputGroup.TextArea
                {...field}
                placeholder={placeholder}
                value={field.value ?? ""}
                rows={rows}
                maxLength={maxLength}
                className="resize-none"
              />
            </InputGroup>
            {(description || (showCount && maxLength)) && !error && (
              <Description className="flex w-full items-center justify-between px-1">
                <span>{description ?? ""}</span>
                {showCount && maxLength && (
                  <span className="ml-auto tabular-nums">
                    {currentLength}/{maxLength}
                  </span>
                )}
              </Description>
            )}
            <FieldError>{error?.message}</FieldError>
          </TextField>
        );
      }}
    />
  );
}

// ==================== DATE PICKER INPUT ====================
// Replaces: <TextInput type="date" />

interface DatePickerInputProps<
  T extends FieldValues,
> extends BaseInputProps<T> {
  minValue?: DateValue;
  maxValue?: DateValue;
  granularity?: "day" | "hour" | "minute" | "second";
}

export type { DatePickerInputProps };

export function DatePickerInput<T extends FieldValues>({
  name,
  control,
  label,
  isRequired = false,
  isDisabled = false,
  className,
  description,
  minValue,
  maxValue,
  granularity,
}: DatePickerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          className={className}
          isDisabled={isDisabled}
          isRequired={isRequired}
          isInvalid={!!error}
          minValue={minValue}
          maxValue={maxValue}
          granularity={granularity}
          value={(field.value as DateValue | null | undefined) ?? null}
          onChange={(val: DateValue | null) => field.onChange(val)}
        >
          <Label>{label}</Label>
          <DateField.Group fullWidth>
            <DateField.Input>
              {(segment: unknown) => (
                // @ts-expect-error HeroUI DateField.Segment type mismatch
                <DateField.Segment segment={segment} />
              )}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DatePicker.Popover>
            <Calendar aria-label={label}>
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day: React.ReactNode) => (
                    <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                  )}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(date: DateValue) => (
                    // @ts-expect-error HeroUI Calendar.Cell DateValue type mismatch
                    <Calendar.Cell date={date} />
                  )}
                </Calendar.GridBody>
              </Calendar.Grid>
            </Calendar>
          </DatePicker.Popover>
          {description && !error && <Description>{description}</Description>}
          <FieldError>{error?.message}</FieldError>
        </DatePicker>
      )}
    />
  );
}

// ==================== DATE RANGE PICKER INPUT ====================

interface DateRange {
  start: DateValue;
  end: DateValue;
}

interface DateRangePickerInputProps<
  T extends FieldValues,
> extends BaseInputProps<T> {
  minValue?: DateValue;
  maxValue?: DateValue;
  startName?: string;
  endName?: string;
}

export type { DateRange, DateRangePickerInputProps };

export function DateRangePickerInput<T extends FieldValues>({
  name,
  control,
  label,
  isRequired = false,
  isDisabled = false,
  className,
  description,
  minValue,
  maxValue,
  startName,
  endName,
}: DateRangePickerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <DateRangePicker
          className={className}
          isDisabled={isDisabled}
          isInvalid={!!error}
          minValue={minValue}
          maxValue={maxValue}
          startName={startName}
          endName={endName}
          value={(field.value as DateRange | null | undefined) ?? null}
          onChange={(val: DateRange | null) => field.onChange(val)}
        >
          <Label>{label}</Label>
          <DateField.Group fullWidth>
            <DateField.InputContainer>
              <DateField.Input slot="start">
                {(segment: unknown) => (
                  // @ts-expect-error HeroUI DateField.Segment type mismatch
                  <DateField.Segment segment={segment} />
                )}
              </DateField.Input>
              <DateRangePicker.RangeSeparator />
              <DateField.Input slot="end">
                {(segment: unknown) => (
                  // @ts-expect-error HeroUI DateField.Segment type mismatch
                  <DateField.Segment segment={segment} />
                )}
              </DateField.Input>
            </DateField.InputContainer>
            <DateField.Suffix>
              <DateRangePicker.Trigger>
                <DateRangePicker.TriggerIndicator />
              </DateRangePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <DateRangePicker.Popover>
            <RangeCalendar aria-label={label}>
              <RangeCalendar.Header>
                <RangeCalendar.YearPickerTrigger>
                  <RangeCalendar.YearPickerTriggerHeading />
                  <RangeCalendar.YearPickerTriggerIndicator />
                </RangeCalendar.YearPickerTrigger>
                <RangeCalendar.NavButton slot="previous" />
                <RangeCalendar.NavButton slot="next" />
              </RangeCalendar.Header>
              <RangeCalendar.Grid>
                <RangeCalendar.GridHeader>
                  {(day: React.ReactNode) => (
                    <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                  )}
                </RangeCalendar.GridHeader>
                <RangeCalendar.GridBody>
                  {(date: DateValue) => (
                    // @ts-expect-error HeroUI RangeCalendar.Cell DateValue type mismatch
                    <RangeCalendar.Cell date={date} />
                  )}
                </RangeCalendar.GridBody>
              </RangeCalendar.Grid>
            </RangeCalendar>
          </DateRangePicker.Popover>
          {description && !error && <Description>{description}</Description>}
          <FieldError>{error?.message}</FieldError>
        </DateRangePicker>
      )}
    />
  );
}

// ==================== TIME FIELD INPUT ====================

interface TimeFieldInputProps<T extends FieldValues> extends BaseInputProps<T> {
  granularity?: "hour" | "minute" | "second";
  hourCycle?: 12 | 24;
  hideTimeZone?: boolean;
  minValue?: TimeValue;
  maxValue?: TimeValue;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

export type { TimeFieldInputProps };

export function TimeFieldInput<T extends FieldValues>({
  name,
  control,
  label,
  isRequired = false,
  isDisabled = false,
  className,
  description,
  granularity,
  hourCycle,
  hideTimeZone,
  minValue,
  maxValue,
  startContent,
  endContent,
}: TimeFieldInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <TimeField
          className={className}
          isDisabled={isDisabled}
          isRequired={isRequired}
          isInvalid={!!error}
          granularity={granularity}
          hourCycle={hourCycle}
          hideTimeZone={hideTimeZone}
          minValue={minValue ?? undefined}
          maxValue={maxValue ?? undefined}
          value={(field.value as TimeValue | null | undefined) ?? null}
          onChange={(val: TimeValue | null) => field.onChange(val)}
        >
          <Label>{label}</Label>
          <TimeField.Group fullWidth>
            {startContent && (
              <TimeField.Prefix>{startContent}</TimeField.Prefix>
            )}
            <TimeField.Input>
              {(segment: unknown) => (
                // @ts-expect-error HeroUI TimeField.Segment type mismatch
                <TimeField.Segment segment={segment} />
              )}
            </TimeField.Input>
            {endContent && <TimeField.Suffix>{endContent}</TimeField.Suffix>}
          </TimeField.Group>
          {description && !error && <Description>{description}</Description>}
          <FieldError>{error?.message}</FieldError>
        </TimeField>
      )}
    />
  );
}

// ==================== SELECT INPUT ====================
interface SelectOption {
  id: Key;
  label: string;
  isDisabled?: boolean;
}

interface SelectSection {
  id: Key;
  heading: string;
  options: SelectOption[];
}

interface SelectInputProps<T extends FieldValues> extends BaseInputProps<T> {
  options?: SelectOption[];
  sections?: SelectSection[];
  selectionMode?: "single" | "multiple";
  placeholder?: string;
  disabledKeys?: Iterable<Key>;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export type { SelectOption, SelectSection, SelectInputProps };

export function SelectInput<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Select one",
  options,
  sections,
  selectionMode = "single",
  disabledKeys,
  isRequired = false,
  isDisabled = false,
  className,
  description,
  variant = "primary",
  fullWidth = false,
}: SelectInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Normalize value: RHF stores plain string/string[]; Select expects Key | Key[] | null
        const value: Key | Key[] | null =
          field.value === undefined || field.value === null
            ? null
            : field.value;

        return (
          <Select
            className={className}
            isDisabled={isDisabled}
            isRequired={isRequired}
            isInvalid={!!error}
            selectionMode={selectionMode}
            disabledKeys={disabledKeys}
            variant={variant}
            fullWidth={fullWidth}
            placeholder={placeholder}
            value={value}
            onChange={(val: Key | Key[] | null) => field.onChange(val)}
          >
            <Label>{label}</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {sections
                  ? sections.map((section) => (
                      <ListBox.Section key={section.id}>
                        <div className="px-2 py-1 text-xs font-semibold text-default-400 uppercase">
                          {section.heading}
                        </div>
                        {section.options.map((opt) => (
                          <ListBox.Item
                            key={opt.id}
                            id={opt.id}
                            textValue={opt.label}
                          >
                            {opt.label}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox.Section>
                    ))
                  : options?.map((opt) => (
                      <ListBox.Item
                        key={opt.id}
                        id={opt.id}
                        textValue={opt.label}
                      >
                        {opt.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
              </ListBox>
            </Select.Popover>
            {description && !error && <Description>{description}</Description>}
            <FieldError>{error?.message}</FieldError>
          </Select>
        );
      }}
    />
  );
}

// ==================== CHECKBOX INPUT ====================

interface CheckboxInputProps<T extends FieldValues>
  extends Omit<BaseInputProps<T>, "label" | "placeholder"> {
  children: React.ReactNode;
}

export type { CheckboxInputProps };

export function CheckboxInput<T extends FieldValues>({
  name,
  control,
  children,
  isRequired = false,
  isDisabled = false,
  className,
  description,
}: CheckboxInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, name: fieldName, onBlur },
        fieldState: { error },
      }) => (
        <div className="space-x-1.5 flex">
          <Checkbox
            name={fieldName}
            value="on"
            isSelected={!!value}
            onChange={onChange}
            onBlur={onBlur}
            isDisabled={isDisabled}
            isRequired={isRequired}
            isInvalid={!!error}
            className={cn("rounded-md border-border", className)}
          >
            <Checkbox.Content className="flex items-center gap-2">
              <Checkbox.Control className="shrink-0">
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
          <div>
          <Label>
            <span className="text-xs leading-relaxed text-muted-foreground">
                {children}
              </span>
          </Label>
            <FieldError className="pl-6 text-xs">{error?.message}</FieldError>
              
          {description && !error && (
            <Description className="pl-6">{description}</Description>
          )}
          </div>
        </div>
      )}
    />
  );
}

// ==================== EXPORTS ====================

export { TextInput as Text };
export { PasswordInput as Password };
export { NumberInput as Number };
export { TextareaInput as Textarea };
export { DatePickerInput as DatePicker };
export { DateRangePickerInput as DateRangePicker };
export { TimeFieldInput as Time };
export { SelectInput as Select };
export { CheckboxInput as Checkbox };

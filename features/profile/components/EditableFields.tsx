"use client";

import { SquarePen } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProfileFormData } from "../utils/profileSchema";

type EditableField = "name" | "email" | "locale" | null;

interface EditableFieldProps {
  form: UseFormReturn<ProfileFormData>;
  editingField: EditableField;
  onFieldClick: (field: EditableField) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

export function EditableNameField({
  form,
  editingField,
  onFieldClick,
  onBlur,
  t,
}: EditableFieldProps) {
  const watchedName = form.watch("name");

  if (editingField === "name") {
    return (
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="flex-1 min-w-0">
            <FormControl>
              <Input
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all h-8 text-sm"
                placeholder={t("namePlaceholder")}
                autoFocus
                {...field}
                onBlur={(e) => {
                  field.onBlur();
                  onBlur(e);
                }}
              />
            </FormControl>
            <FormMessage className="text-red-300 text-xs" />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
      <p className="text-white text-lg font-semibold flex-1 min-w-0 truncate">
        {watchedName}
      </p>
      <SquarePen
        className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors flex-shrink-0"
        onClick={() => onFieldClick("name")}
      />
    </div>
  );
}

export function EditableEmailField({
  form,
  editingField,
  onFieldClick,
  onBlur,
  t,
}: EditableFieldProps) {
  const watchedEmail = form.watch("email");

  if (editingField === "email") {
    return (
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormControl>
              <Input
                type="email"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 transition-all h-8 text-sm"
                placeholder={t("emailPlaceholder")}
                autoFocus
                {...field}
                onBlur={(e) => {
                  field.onBlur();
                  onBlur(e);
                }}
              />
            </FormControl>
            <FormMessage className="text-red-300 text-xs" />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full">
      <p className="text-white/70 text-sm flex-1 min-w-0 truncate">
        {watchedEmail}
      </p>
      <SquarePen
        className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors flex-shrink-0"
        onClick={() => onFieldClick("email")}
      />
    </div>
  );
}

interface LocaleFieldProps {
  form: UseFormReturn<ProfileFormData>;
  editingField: EditableField;
  onFieldClick: (field: EditableField) => void;
  setEditingField: (field: EditableField) => void;
  t: (key: string) => string;
}

export function EditableLocaleField({
  form,
  editingField,
  onFieldClick,
  setEditingField,
  t,
}: LocaleFieldProps) {
  const watchedLocale = form.watch("locale");

  if (editingField === "locale") {
    return (
      <FormField
        control={form.control}
        name="locale"
        render={({ field }) => (
          <FormItem className="flex-1 max-w-[200px]">
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setEditingField(null);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 focus:border-white/40 transition-all h-8 text-sm">
                  <SelectValue className="text-white" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20">
                <SelectItem value="fr" className="text-white focus:bg-white/20">
                  Français
                </SelectItem>
                <SelectItem value="en" className="text-white focus:bg-white/20">
                  English
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-red-300 text-xs" />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="flex items-center justify-end gap-2 sm:gap-3">
      <span className="text-white font-medium">
        {watchedLocale === "fr" ? t("french") : t("english")}
      </span>
      <SquarePen
        className="w-4 h-4 text-white/70 hover:text-white cursor-pointer transition-colors flex-shrink-0"
        onClick={() => onFieldClick("locale")}
      />
    </div>
  );
}

export type { EditableField };

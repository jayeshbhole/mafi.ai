import { forwardRef } from "react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A fixed version of `React.forwardRef` that allows the `ref` to be typed as a generic.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function fixedForwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactNode,
): (props: P & React.RefAttributes<T | null>) => React.ReactNode {
  // @ts-ignore
  return forwardRef(render);
}

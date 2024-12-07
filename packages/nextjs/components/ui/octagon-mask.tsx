/* eslint-disable @typescript-eslint/ban-types */
import { cn, fixedForwardRef } from "@/lib/utils";
import React, {
  type ForwardedRef,
  type CSSProperties,
  type ComponentPropsWithoutRef,
  type ElementType,
  type PropsWithChildren,
  type ReactNode,
} from "react";

type DefaultCornerRadii = "2px" | "4px" | "7px" | "10px" | "13px";

type PolymorphicProps<E extends ElementType> = PropsWithChildren<
  ComponentPropsWithoutRef<E> & {
    as?: E;
  }
>;
const defaultElement = "div";
type DefaultElement = typeof defaultElement;

export type OctagonMaskComponentProps<T extends ElementType = DefaultElement> = PolymorphicProps<T> & {
  borderWidth?: "0px" | "1px" | "2px" | "4px";
  /** `2px | 4px | 7px | 10px | 13px | {number}px` | {number}rem */
  cornerRadius?: DefaultCornerRadii | (`${number}rem` & {}) | (`${number}px` & {});
  contentClass?: string;
  contentAs?: ElementType;
  children?: ReactNode;
};

// use forward ref
const OctagonMask = fixedForwardRef(
  <E extends ElementType = DefaultElement>(
    {
      as,
      children,
      borderWidth = "1px",
      cornerRadius = "7px",
      contentClass,
      contentAs,
      ...props
    }: OctagonMaskComponentProps<E>,
    ref?: ForwardedRef<HTMLElement | null>,
  ) => {
    const Component: ElementType = as ?? "div";
    const ContentComponent: ElementType = contentAs ?? "div";

    return (
      <Component
        ref={ref}
        {...props}
        className={cn(`octagon-mask relative flex h-fit w-fit p-[--border-width]`, props.className)}
        style={
          {
            "--border-width": borderWidth,
            "--corner": cornerRadius,
            ...props.style,
          } as CSSProperties
        }
      >
        <ContentComponent className={cn(`mask-content flex-1`, contentClass)}>{children}</ContentComponent>
      </Component>
    );
  },
);

export default OctagonMask;
